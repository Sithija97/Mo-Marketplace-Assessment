import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from './config/typeorm.config';
import { ProductsModule } from './products/products.module';
import { SeedModule } from './seed/seed.module';
import { VariantsModule } from './variants/variants.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    SeedModule,
    VariantsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
