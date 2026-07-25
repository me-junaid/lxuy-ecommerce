import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

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
    refreshTokenHash: '$2b$12$hashedrefreshtokenplaceholder',
    prevRefreshTokenHash: null,
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
      findByIdWithRefreshHash: jest.fn(),
      updateRefreshToken: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
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
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshTokenHash');
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
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        'user-id-123',
        'refresh-token',
        null,
        true,
      );
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: expect.any(Object),
      });
    });
  });

  describe('refreshTokens', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByIdWithRefreshHash.mockResolvedValue(null);

      await expect(
        authService.refreshTokens('user-id-123', 'old-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should succeed with valid current refresh token', async () => {
      usersService.findByIdWithRefreshHash.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockImplementation((token, hash) => {
        return Promise.resolve(hash === mockUser.refreshTokenHash);
      });
      jwtService.sign.mockReturnValueOnce('new-access-token').mockReturnValueOnce('new-refresh-token');
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await authService.refreshTokens('user-id-123', 'valid-refresh-token');

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        'user-id-123',
        'new-refresh-token',
        mockUser.refreshTokenHash,
      );
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should succeed with valid previous refresh token (grace window)', async () => {
      const userWithPrevHash = {
        ...mockUser,
        refreshTokenHash: '$2b$12$newhash',
        prevRefreshTokenHash: '$2b$12$oldhash',
      };
      usersService.findByIdWithRefreshHash.mockResolvedValue(userWithPrevHash as any);
      mockedBcrypt.compare.mockImplementation((token, hash) => {
        return Promise.resolve(hash === userWithPrevHash.prevRefreshTokenHash);
      });
      jwtService.sign.mockReturnValueOnce('new-access-token').mockReturnValueOnce('new-refresh-token');
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await authService.refreshTokens('user-id-123', 'old-refresh-token');

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        'user-id-123',
        'new-refresh-token',
        null,
      );
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw UnauthorizedException with completely mismatched token', async () => {
      usersService.findByIdWithRefreshHash.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        authService.refreshTokens('user-id-123', 'wrong-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should invalidate token hash in database', async () => {
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      await authService.logout('user-id-123');

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith('user-id-123', null);
    });
  });
});
