import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(data: Partial<User>) {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string) {
    return this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        password: true,
      },
    });
  }

  async findById(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByIdWithRefreshToken(id: number) {
    return this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        refreshToken: true,
      },
    });
  }

  async updateRefreshToken(userId: number, token: string | null) {
    await this.userRepository.update(userId, {
      refreshToken: token,
    });
  }
}
