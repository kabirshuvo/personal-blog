import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { generateUniqueSlug } from '../common/utils/slug.util';
import {
  createRandomToken,
  hashPassword,
  verifyPassword,
} from '../common/utils/password.util';
import type {
  AuthUser,
  JwtRefreshPayload,
} from './interfaces/auth-user.interface';
import type { RegisterDto, LoginDto } from './dto/auth.dto';

const REFRESH_COOKIE = 'refresh_token';
const ACCESS_EXPIRES_IN = (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as
  `${number}s` | `${number}m` | `${number}h` | `${number}d`;
const REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as
  `${number}s` | `${number}m` | `${number}h` | `${number}d`;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

type UserWithAccess = {
  id: string;
  email: string;
  name: string;
  slug: string;
  bio: string | null;
  avatarUrl: string | null;
  status: string;
  role: {
    name: string;
    rolePermissions: Array<{ permission: { key: string } }>;
  };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const subscriberRole = await this.prisma.role.findUnique({
      where: { name: 'subscriber' },
    });

    if (!subscriberRole) {
      throw new ConflictException('Default subscriber role is not configured');
    }

    const slug = await generateUniqueSlug(dto.name, async (candidate) => {
      const user = await this.prisma.user.findUnique({
        where: { slug: candidate },
      });
      return user !== null;
    });

    const passwordHash = await hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        provider: 'local',
        name: dto.name.trim(),
        slug,
        roleId: subscriberRole.id,
      },
      include: this.userInclude(),
    });

    void this.emailService.sendWelcomeEmail(user.email, user.name);

    return this.toPublicUser(user);
  }

  async login(
    dto: LoginDto,
    userAgent: string | undefined,
    ipAddress: string | undefined,
    response: Response,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: this.userInclude(),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses social login. Sign in with Google or GitHub.',
      );
    }

    const validPassword = await verifyPassword(dto.password, user.passwordHash);

    if (!validPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user, userAgent, ipAddress);
    this.setRefreshCookie(response, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      user: this.toPublicUser(user),
    };
  }

  async refresh(refreshToken: string | undefined, response: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    let payload: JwtRefreshPayload;

    try {
      payload = this.jwtService.verify<JwtRefreshPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh' || !payload.jti || !payload.sub) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    const redisKey = this.refreshRedisKey(payload.jti);
    const storedUserId = await this.redis.get(redisKey);

    if (!storedUserId || storedUserId !== payload.sub) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const session = await this.prisma.session.findFirst({
      where: {
        refreshTokenJti: payload.jti,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      await this.redis.del(redisKey);
      throw new UnauthorizedException('Refresh session is invalid');
    }

    await this.revokeSession(session.id, payload.jti);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: this.userInclude(),
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User is not active');
    }

    const tokens = await this.issueTokens(
      user,
      session.userAgent ?? undefined,
      session.ipAddress ?? undefined,
    );
    this.setRefreshCookie(response, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      user: this.toPublicUser(user),
    };
  }

  async logout(refreshToken: string | undefined, response: Response) {
    if (refreshToken) {
      try {
        const payload = this.jwtService.verify<JwtRefreshPayload>(
          refreshToken,
          {
            secret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
          },
        );

        if (payload.jti) {
          await this.revokeSessionByJti(payload.jti);
        }
      } catch {
        // Ignore invalid tokens on logout.
      }
    }

    this.clearRefreshCookie(response);

    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.userInclude(),
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toAuthMe(user);
  }

  async validateOAuthUser(params: {
    provider: string;
    providerId: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
  }) {
    const email = params.email.toLowerCase();

    let user = await this.prisma.user.findFirst({
      where: {
        provider: params.provider,
        providerId: params.providerId,
      },
      include: this.userInclude(),
    });

    if (!user) {
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email },
        include: this.userInclude(),
      });

      if (existingByEmail) {
        user = await this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            provider: params.provider,
            providerId: params.providerId,
            avatarUrl: params.avatarUrl ?? existingByEmail.avatarUrl,
          },
          include: this.userInclude(),
        });
      }
    }

    if (!user) {
      const subscriberRole = await this.prisma.role.findUnique({
        where: { name: 'subscriber' },
      });

      if (!subscriberRole) {
        throw new ConflictException(
          'Default subscriber role is not configured',
        );
      }

      const slug = await generateUniqueSlug(params.name, async (candidate) => {
        const match = await this.prisma.user.findUnique({
          where: { slug: candidate },
        });
        return match !== null;
      });

      user = await this.prisma.user.create({
        data: {
          email,
          name: params.name.trim(),
          slug,
          avatarUrl: params.avatarUrl ?? null,
          provider: params.provider,
          providerId: params.providerId,
          roleId: subscriberRole.id,
        },
        include: this.userInclude(),
      });

      void this.emailService.sendWelcomeEmail(user.email, user.name);
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active');
    }

    return user;
  }

  async completeOAuthLogin(
    user: UserWithAccess,
    userAgent: string | undefined,
    ipAddress: string | undefined,
    response: Response,
  ) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user, userAgent, ipAddress);
    this.setRefreshCookie(response, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      user: this.toPublicUser(user),
    };
  }

  getWebOrigin(): string {
    return process.env.WEB_ORIGIN ?? 'http://localhost:3000';
  }

  private userInclude() {
    return {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    } as const;
  }

  private toAuthUser(user: UserWithAccess): AuthUser {
    return {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      permissions: user.role.rolePermissions.map(
        (entry) => entry.permission.key,
      ),
    };
  }

  private toPublicUser(user: UserWithAccess) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      slug: user.slug,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      status: user.status,
      role: {
        name: user.role.name,
        permissions: user.role.rolePermissions.map(
          (entry) => entry.permission.key,
        ),
      },
    };
  }

  private toAuthMe(user: UserWithAccess) {
    return this.toPublicUser(user);
  }

  private async issueTokens(
    user: UserWithAccess,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const authUser = this.toAuthUser(user);
    const jti = createRandomToken();
    const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenJti: jti,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    await this.redis.set(
      this.refreshRedisKey(jti),
      user.id,
      REFRESH_TTL_SECONDS,
    );

    const accessToken = this.jwtService.sign(authUser, {
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
      expiresIn: ACCESS_EXPIRES_IN,
    });

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        jti,
        type: 'refresh',
      } satisfies JwtRefreshPayload,
      {
        secret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
        expiresIn: REFRESH_EXPIRES_IN,
      },
    );

    return { accessToken, refreshToken };
  }

  private async revokeSession(sessionId: string, jti: string) {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    await this.redis.del(this.refreshRedisKey(jti));
  }

  private async revokeSessionByJti(jti: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenJti: jti },
    });

    if (session && !session.revokedAt) {
      await this.revokeSession(session.id, jti);
    } else {
      await this.redis.del(this.refreshRedisKey(jti));
    }
  }

  private refreshRedisKey(jti: string): string {
    return `refresh:${jti}`;
  }

  private setRefreshCookie(response: Response, refreshToken: string) {
    response.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: REFRESH_TTL_SECONDS * 1000,
    });
  }

  private clearRefreshCookie(response: Response) {
    response.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
    });
  }

  getRefreshCookieName(): string {
    return REFRESH_COOKIE;
  }
}
