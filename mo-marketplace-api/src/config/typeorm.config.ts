import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbPort = Number(configService.getOrThrow<string>('DB_PORT'));

  if (Number.isNaN(dbPort)) {
    throw new Error('DB_PORT must be a valid number');
  }

  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';

  return {
    type: 'postgres',
    host: configService.getOrThrow<string>('DB_HOST'),
    port: dbPort,
    username: configService.getOrThrow<string>('DB_USERNAME'),
    password: configService.getOrThrow<string>('DB_PASSWORD'),
    database: configService.getOrThrow<string>('DB_NAME'),
    autoLoadEntities: true,
    synchronize: !isProduction,
  };
};
