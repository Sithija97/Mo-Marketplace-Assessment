import { createHash, randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto/register.dto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto/login.dto';
import {
  getAccessTokenExpiresIn,
  getRefreshTokenExpiresIn,
  getRefreshTokenSecret,
} from './auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const { password } = dto;

    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
    });

    const { password: _pw, refreshToken: _rt, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase();
    const { password } = dto;

    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user) {
      throw new UnauthorizedException(
        'No account found for this email address',
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('The password you entered is incorrect');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: getAccessTokenExpiresIn(this.config),
    });

    const refreshToken = this.jwtService.sign(
      { ...payload, jti: randomUUID() },
      {
        secret: getRefreshTokenSecret(this.config),
        expiresIn: getRefreshTokenExpiresIn(this.config),
      },
    );

    const hashedRefreshToken = this.hashToken(refreshToken);

    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return { accessToken, refreshToken };
  }

  async getProfile(id: number) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User account no longer exists');
    }
    const { password: _pw, refreshToken: _rt, ...profile } = user;
    return profile;
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{ sub: number }>(refreshToken, {
        secret: getRefreshTokenSecret(this.config),
      });

      const user = await this.usersService.findByIdWithRefreshToken(
        payload.sub,
      );

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException(
          'Invalid refresh token - user not found',
        );
      }

      const isMatch = this.hashToken(refreshToken) === user.refreshToken;

      if (!isMatch) {
        throw new UnauthorizedException(
          'Invalid refresh token - token mismatch',
        );
      }

      // rotation
      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: getAccessTokenExpiresIn(this.config),
      });

      const newRefreshToken = this.jwtService.sign(
        { ...newPayload, jti: randomUUID() },
        {
          secret: getRefreshTokenSecret(this.config),
          expiresIn: getRefreshTokenExpiresIn(this.config),
        },
      );

      const hashedRefreshToken = this.hashToken(newRefreshToken);

      await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }

      throw new UnauthorizedException(
        'Invalid refresh token - verification failed',
      );
    }
  }
}
