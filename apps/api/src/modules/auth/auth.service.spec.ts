import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// Mock bcrypt module-wide to avoid "Cannot redefine property: compare" error.
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let mockedBcrypt: jest.Mocked<typeof bcrypt>;

  const mockUser = {
    _id: { toString: () => 'user-id-123' },
    email: 'test@example.com',
    password: '$2b$12$hashedpasswordplaceholderhere',
    firstName: 'John',
    lastName: 'Doe',
    role: 'customer',
    isActive: true,
    isEmailVerified: true,
    sessions: [
      {
        tokenId: 'session-id-123',
        refreshTokenHash: '$2b$12$hashedrefreshtokenplaceholder',
        prevRefreshTokenHash: null,
        prevTokenExpiresAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lastActive: new Date(),
      },
    ],
    toJSON: function () {
      return {
        id: 'user-id-123',
        email: this.email,
        firstName: this.firstName,
        lastName: this.lastName,
        role: this.role,
        isActive: this.isActive,
      };
    },
  };

  beforeEach(async () => {
    mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
    mockedBcrypt.compare.mockReset();
    mockedBcrypt.hash.mockReset();
    mockedBcrypt.genSalt.mockReset();

    const mockUsersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByIdWithSessions: jest.fn(),
      addSession: jest.fn(),
      updateSession: jest.fn(),
      removeSession: jest.fn(),
      clearAllSessions: jest.fn(),
      clearPasswordResetToken: jest.fn(),
      setEmailVerificationToken: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockEmailService = {
      sendPasswordResetEmail: jest.fn(),
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'secret';
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        if (key === 'JWT_EXPIRATION') return '15m';
        if (key === 'JWT_REFRESH_EXPIRATION') return '7d';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    it('should create and return a sanitised user document', async () => {
      usersService.create.mockResolvedValue(mockUser as any);

      const dto = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = await authService.register(dto);

      expect(usersService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        id: 'user-id-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
        isActive: true,
      });
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException on invalid email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'wrong@example.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        authService.login({ email: 'test@example.com', password: 'WrongPassword!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should succeed and return tokens + user on valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      usersService.addSession.mockResolvedValue(undefined);
      mockedBcrypt.genSalt.mockResolvedValue('salt' as never);
      mockedBcrypt.hash.mockResolvedValue('hashed-refresh-token' as never);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(usersService.addSession).toHaveBeenCalledWith(
        'user-id-123',
        expect.objectContaining({
          tokenId: expect.any(String),
          refreshTokenHash: 'hashed-refresh-token',
        }),
      );
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: expect.any(Object),
      });
    });
  });

  describe('refreshTokens', () => {
    it('should throw UnauthorizedException if token verification fails', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Verify failed');
      });

      await expect(
        authService.refreshTokens('user-id-123', 'invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should succeed with valid current refresh token', async () => {
      jwtService.verify.mockReturnValue({ tokenId: 'session-id-123' });
      usersService.findByIdWithSessions.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValueOnce('new-access-token').mockReturnValueOnce('new-refresh-token');
      usersService.updateSession.mockResolvedValue(undefined);
      mockedBcrypt.genSalt.mockResolvedValue('salt' as never);
      mockedBcrypt.hash.mockResolvedValue('new-hash' as never);

      const result = await authService.refreshTokens('user-id-123', 'valid-refresh-token');

      expect(usersService.updateSession).toHaveBeenCalledWith(
        'user-id-123',
        'session-id-123',
        expect.objectContaining({
          refreshTokenHash: 'new-hash',
          prevRefreshTokenHash: '$2b$12$hashedrefreshtokenplaceholder',
        }),
      );
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw UnauthorizedException with completely mismatched token', async () => {
      jwtService.verify.mockReturnValue({ tokenId: 'session-id-123' });
      usersService.findByIdWithSessions.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);
      usersService.removeSession.mockResolvedValue(undefined);

      await expect(
        authService.refreshTokens('user-id-123', 'wrong-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
      expect(usersService.removeSession).toHaveBeenCalledWith('user-id-123', 'session-id-123');
    });
  });

  describe('logout', () => {
    it('should remove session from database', async () => {
      usersService.removeSession.mockResolvedValue(undefined);

      await authService.logout('user-id-123', 'session-id-123');

      expect(usersService.removeSession).toHaveBeenCalledWith('user-id-123', 'session-id-123');
    });
  });

  describe('logoutAll', () => {
    it('should clear all sessions in database', async () => {
      usersService.clearAllSessions.mockResolvedValue(undefined);

      await authService.logoutAll('user-id-123');

      expect(usersService.clearAllSessions).toHaveBeenCalledWith('user-id-123');
    });
  });
});
