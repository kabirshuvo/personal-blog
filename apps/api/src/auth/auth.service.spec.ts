import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import * as passwordUtil from '../common/utils/password.util';

describe('AuthService', () => {
  let authService: AuthService;

  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const jwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
    verify: jest.fn(),
  };

  const redis = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const emailService = {
    sendWelcomeEmail: jest.fn(),
    sendNewsletterConfirmation: jest.fn(),
  };

  const cookieMock = jest.fn();
  const clearCookieMock = jest.fn();

  const mockResponse = {
    cookie: cookieMock,
    clearCookie: clearCookieMock,
  } as unknown as Response;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: RedisService, useValue: redis },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  describe('register', () => {
    it('rejects duplicate email addresses', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(
        authService.register({
          email: 'user@example.com',
          password: 'password123',
          name: 'Existing User',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates a subscriber account with a hashed password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findUnique.mockResolvedValue({ id: 'role-subscriber' });
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        name: 'New User',
        slug: 'new-user',
        bio: null,
        avatarUrl: null,
        status: 'ACTIVE',
        role: {
          name: 'subscriber',
          rolePermissions: [],
        },
      });

      const hashSpy = jest
        .spyOn(passwordUtil, 'hashPassword')
        .mockResolvedValue('hashed-password');

      const user = await authService.register({
        email: 'user@example.com',
        password: 'password123',
        name: 'New User',
      });

      expect(hashSpy).toHaveBeenCalledWith('password123');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'user@example.com',
            passwordHash: 'hashed-password',
            roleId: 'role-subscriber',
          }) as Record<string, unknown>,
        }),
      );
      expect(user.role.name).toBe('subscriber');

      hashSpy.mockRestore();
    });
  });

  describe('login', () => {
    it('rejects accounts without a password hash', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: null,
        status: 'ACTIVE',
        role: { name: 'subscriber', rolePermissions: [] },
      });

      await expect(
        authService.login(
          { email: 'user@example.com', password: 'password123' },
          'jest',
          '127.0.0.1',
          mockResponse,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: 'hashed-password',
        status: 'ACTIVE',
        role: { name: 'subscriber', rolePermissions: [] },
      });

      jest.spyOn(passwordUtil, 'verifyPassword').mockResolvedValue(false);

      await expect(
        authService.login(
          { email: 'user@example.com', password: 'wrong-password' },
          'jest',
          '127.0.0.1',
          mockResponse,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects inactive accounts', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: 'hashed-password',
        status: 'SUSPENDED',
        role: { name: 'subscriber', rolePermissions: [] },
      });

      jest.spyOn(passwordUtil, 'verifyPassword').mockResolvedValue(true);

      await expect(
        authService.login(
          { email: 'user@example.com', password: 'password123' },
          'jest',
          '127.0.0.1',
          mockResponse,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns an access token for valid credentials', async () => {
      const user = {
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: 'hashed-password',
        name: 'Valid User',
        slug: 'valid-user',
        bio: null,
        avatarUrl: null,
        status: 'ACTIVE',
        role: { name: 'subscriber', rolePermissions: [] },
      };

      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);
      prisma.session.create.mockResolvedValue({ id: 'session-1' });
      redis.set.mockResolvedValue(undefined);

      jest.spyOn(passwordUtil, 'verifyPassword').mockResolvedValue(true);
      jest
        .spyOn(passwordUtil, 'createRandomToken')
        .mockReturnValue('refresh-jti');

      const result = await authService.login(
        { email: 'user@example.com', password: 'password123' },
        'jest',
        '127.0.0.1',
        mockResponse,
      );

      expect(result.accessToken).toBe('signed-token');
      expect(result.user.email).toBe('user@example.com');
      expect(redis.set).toHaveBeenCalledWith(
        'refresh:refresh-jti',
        'user-1',
        expect.any(Number),
      );
      expect(cookieMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout', () => {
    it('clears the refresh cookie even when the token is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      const result = await authService.logout(undefined, mockResponse);

      expect(result).toEqual({ success: true });
      expect(clearCookieMock).toHaveBeenCalledTimes(1);
    });
  });
});
