import type { StringValue } from 'ms';
import { ConfigService } from '@nestjs/config';

export const AUTH_CONFIG_KEYS = {
  jwtSecret: 'JWT_SECRET',
  jwtExpiresIn: 'JWT_EXPIRES_IN',
  jwtRefreshSecret: 'JWT_REFRESH_SECRET',
  jwtRefreshExpiresIn: 'JWT_REFRESH_EXPIRES_IN',
  nodeEnv: 'NODE_ENV',
} as const;

export const DEFAULT_ACCESS_EXPIRES_IN = '5m' as StringValue;
export const DEFAULT_REFRESH_EXPIRES_IN = '7d' as StringValue;

export const getAccessTokenSecret = (config: ConfigService) =>
  config.getOrThrow<string>(AUTH_CONFIG_KEYS.jwtSecret);

export const getRefreshTokenSecret = (config: ConfigService) =>
  config.get<string>(AUTH_CONFIG_KEYS.jwtRefreshSecret) ??
  getAccessTokenSecret(config);

export const getAccessTokenExpiresIn = (config: ConfigService) =>
  (config.get<string>(AUTH_CONFIG_KEYS.jwtExpiresIn) ??
    DEFAULT_ACCESS_EXPIRES_IN) as StringValue;

export const getRefreshTokenExpiresIn = (config: ConfigService) =>
  (config.get<string>(AUTH_CONFIG_KEYS.jwtRefreshExpiresIn) ??
    DEFAULT_REFRESH_EXPIRES_IN) as StringValue;

export const isProductionEnv = (config: ConfigService) =>
  config.get<string>(AUTH_CONFIG_KEYS.nodeEnv) === 'production';
