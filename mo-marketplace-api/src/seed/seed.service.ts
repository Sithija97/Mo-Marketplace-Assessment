import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity/user.entity';
import { UserRole } from 'src/common/enums';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.createAdminIfNotExists();
  }

  private async createAdminIfNotExists() {
    const admin = await this.userRepo.findOne({
      where: { role: UserRole.ADMIN },
    });

    if (admin) {
      console.log('Admin already exists');
      return;
    }

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error(
        'Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment variables',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = this.userRepo.create({
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    await this.userRepo.save(newAdmin);

    console.log('Admin user created ✅');
  }
}
