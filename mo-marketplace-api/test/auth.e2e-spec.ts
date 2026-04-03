import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';

describe('Auth Endpoints (e2e)', () => {
  let app: INestApplication<App>;
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123';

  let accessTokenA1: string;
  let refreshTokenR1: string;
  let accessTokenA2: string;
  let refreshTokenR2: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Flow', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: testEmail, password: testPassword })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(testEmail);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    it('should reject duplicate registration', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: testEmail, password: testPassword })
        .expect(409); // Conflict
    });

    it('should login and return access & refresh tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      accessTokenA1 = response.body.accessToken;

      // Extract refresh token from cookie
      const setCookieHeader = response.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();
      const refreshCookie = setCookieHeader.find((c: string) =>
        c.startsWith('refreshToken='),
      );
      expect(refreshCookie).toBeDefined();
      refreshTokenR1 = refreshCookie.split('refreshToken=')[1].split(';')[0];

      expect(accessTokenA1).toBeDefined();
      expect(refreshTokenR1).toBeDefined();
    });

    it('should get profile with valid access token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessTokenA1}`)
        .expect(200);

      expect(response.body.email).toBe(testEmail);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('role');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    it('should reject profile request without bearer token', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('should refresh and get new tokens (first refresh with R1)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshTokenR1}`)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      accessTokenA2 = response.body.accessToken;

      // Extract new refresh token from cookie
      const setCookieHeader = response.headers['set-cookie'];
      const refreshCookie = setCookieHeader.find((c: string) =>
        c.startsWith('refreshToken='),
      );
      refreshTokenR2 = refreshCookie.split('refreshToken=')[1].split(';')[0];

      expect(accessTokenA2).toBeDefined();
      expect(refreshTokenR2).toBeDefined();
      // New tokens should be different from old ones
      expect(refreshTokenR2).not.toBe(refreshTokenR1);
    });

    it('should use new access token A2 successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessTokenA2}`)
        .expect(200);

      expect(response.body.email).toBe(testEmail);
    });

    it('CRITICAL: should reject refresh with old token R1 (token rotation check)', async () => {
      // This is the key test: old refresh token should NOT work after rotation
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshTokenR1}`)
        .expect(401); // Should be Unauthorized

      expect(response.body.message).toContain('Invalid refresh token');
    });

    it('should accept refresh with current token R2', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshTokenR2}`)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
    });

    it('should logout successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessTokenA2}`)
        .expect(201);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject access after logout', async () => {
      // Token should still be valid JWT-wise, but refreshToken should be cleared
      // Try to get profile - this should still work since the old access token is still valid
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessTokenA2}`)
        .expect(200); // Access token is still valid

      // But refresh should fail (no valid refresh token stored)
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshTokenR2}`)
        .expect(401); // Refresh token no longer valid after logout
    });
  });
});
