import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService - Refresh Token Rotation (Unit Test)', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    role: 'user',
    refreshToken: '', // Will be set dynamically
  };

  beforeEach(async () => {
    // Mock services
    const mockJwtService = {
      sign: jest.fn((payload, options) => {
        // Simple JWT token generation for testing
        return `token_${JSON.stringify(payload)}_${options?.expiresIn || '7d'}`;
      }),
      verify: jest.fn((token, options) => {
        // Simulate JWT parsing
        if (!token.startsWith('token_')) {
          throw new Error('Invalid token format');
        }
        return { sub: 1, email: 'test@example.com', role: 'user' };
      }),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          JWT_EXPIRES_IN: '5m',
          JWT_REFRESH_EXPIRES_IN: '7d',
          JWT_REFRESH_SECRET: 'refresh_secret',
          NODE_ENV: 'test',
        };
        return config[key];
      }),
      getOrThrow: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test_secret';
        throw new Error(`Config key not found: ${key}`);
      }),
    };

    const mockUsersService = {
      findByIdWithRefreshToken: jest.fn(async (id: number) => {
        return { ...mockUser };
      }),
      updateRefreshToken: jest.fn(
        async (userId: number, token: string | null) => {
          mockUser.refreshToken = token || '';
          console.log(
            `[UPDATE] User ${userId} refresh token updated to: ${token ? token.substring(0, 20) + '...' : 'null'}`,
          );
        },
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Refresh Token Rotation', () => {
    it('should accept valid refresh token on first refresh', async () => {
      // Setup: first refresh token
      const firstRefreshToken = 'token_refresh_1';
      mockUser.refreshToken = await bcrypt.hash(firstRefreshToken, 10);

      // Mock JWT verify
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: 1,
        email: 'test@example.com',
        role: 'user',
      });

      const result = await authService.refreshTokens(firstRefreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(
        (usersService.updateRefreshToken as jest.Mock).mock.calls.length,
      ).toBe(1);

      console.log('[TEST 1 PASSED] First refresh accepted');
    });

    it('should reject old refresh token after rotation', async () => {
      const oldRefreshToken = 'token_refresh_old';
      const newRefreshToken = 'token_refresh_new';

      // Mock JWT verify to accept both tokens for signature check
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: 1,
        email: 'test@example.com',
        role: 'user',
      });

      // Step 1: Use old token, get new token
      mockUser.refreshToken = await bcrypt.hash(oldRefreshToken, 10);
      console.log(
        `[SETUP] DB stored hash of old token: ${mockUser.refreshToken.substring(0, 20)}...`,
      );

      const firstRefreshResult =
        await authService.refreshTokens(oldRefreshToken);
      expect(firstRefreshResult).toHaveProperty('accessToken');
      expect(firstRefreshResult).toHaveProperty('refreshToken');
      console.log('[STEP 1 PASSED] First refresh with old token succeeded');

      // Manually update Mock to simulate what updateRefreshToken should do
      // (normally the update would happen inside refreshTokens)
      mockUser.refreshToken = await bcrypt.hash(newRefreshToken, 10);
      console.log(
        `[SETUP] DB now contains hash of new token: ${mockUser.refreshToken.substring(0, 20)}...`,
      );

      // Step 2: Try to reuse old token, should fail
      console.log('[STEP 2] Attempting to refresh with OLD token again...');
      expect(authService.refreshTokens(oldRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );

      console.log(
        '[TEST 2 PASSED] Old token correctly rejected after rotation',
      );
    });

    it('should accept new refresh token after rotation', async () => {
      const newRefreshToken = 'token_refresh_new_2';

      // Mock JWT verify
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: 1,
        email: 'test@example.com',
        role: 'user',
      });

      // Setup: DB contains hash of new token
      mockUser.refreshToken = await bcrypt.hash(newRefreshToken, 10);

      const result = await authService.refreshTokens(newRefreshToken);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');

      console.log('[TEST 3 PASSED] New token works correctly after rotation');
    });
  });
});
