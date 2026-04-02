import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { RegisterDto } from './dto/register.dto/register.dto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

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

    const { password: _pw, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase();
    const { password } = dto;

    const user = await this.usersService.findByEmail(email);

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
      expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') ??
        '15m') as StringValue,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ??
        '7d') as StringValue,
    });

    return { accessToken, refreshToken };
  }

  async getProfile(id: number) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User account no longer exists');
    }
    const { password: _pw, ...profile } = user;
    return profile;
  }
}
