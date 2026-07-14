import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from './interfaces/auth-user.interface';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import {
  GithubOAuthConfiguredGuard,
  GoogleOAuthConfiguredGuard,
} from './guards/oauth-configured.guard';

type OAuthRequest = Request & {
  user: {
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
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(
      dto,
      request.headers['user-agent'],
      request.ip,
      response,
    );
  }

  @Public()
  @Post('refresh')
  refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[
      this.authService.getRefreshCookieName()
    ] as string | undefined;
    return this.authService.refresh(refreshToken, response);
  }

  @Public()
  @Post('logout')
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[
      this.authService.getRefreshCookieName()
    ] as string | undefined;
    return this.authService.logout(refreshToken, response);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user.sub);
  }

  @Public()
  @Get('providers')
  providers() {
    return {
      google: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
      ),
      github: Boolean(
        process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
      ),
    };
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthConfiguredGuard, AuthGuard('google'))
  googleAuth() {
    return;
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuthConfiguredGuard, AuthGuard('google'))
  async googleCallback(
    @Req() request: OAuthRequest,
    @Res() response: Response,
  ) {
    const result = await this.authService.completeOAuthLogin(
      request.user,
      request.headers['user-agent'],
      request.ip,
      response,
    );

    response.redirect(
      `${this.authService.getWebOrigin()}/auth/callback?accessToken=${encodeURIComponent(result.accessToken)}`,
    );
  }

  @Public()
  @Get('github')
  @UseGuards(GithubOAuthConfiguredGuard, AuthGuard('github'))
  githubAuth() {
    return;
  }

  @Public()
  @Get('github/callback')
  @UseGuards(GithubOAuthConfiguredGuard, AuthGuard('github'))
  async githubCallback(
    @Req() request: OAuthRequest,
    @Res() response: Response,
  ) {
    const result = await this.authService.completeOAuthLogin(
      request.user,
      request.headers['user-agent'],
      request.ip,
      response,
    );

    response.redirect(
      `${this.authService.getWebOrigin()}/auth/callback?accessToken=${encodeURIComponent(result.accessToken)}`,
    );
  }
}
