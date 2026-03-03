import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Fatal = 'fatal',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsOptional()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(65535)
  REDIS_PORT: number = 6379;

  @IsNumber()
  @IsOptional()
  @Min(0)
  CACHE_TTL: number = 60000;

  @IsString()
  @IsOptional()
  SMTP_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(65535)
  SMTP_PORT: number = 1025;

  @IsBoolean()
  @IsOptional()
  SMTP_SECURE: boolean = false;

  @IsString()
  @IsOptional()
  SMTP_USER: string = '';

  @IsString()
  @IsOptional()
  SMTP_PASSWORD: string = '';

  @IsString()
  @IsOptional()
  MAIL_FROM: string = 'noreply@example.com';

  @IsString()
  @IsOptional()
  S3_ENDPOINT: string = 'http://localhost:9000';

  @IsString()
  @IsOptional()
  S3_ACCESS_KEY: string = 'minioadmin';

  @IsString()
  @IsOptional()
  S3_SECRET_KEY: string = 'minioadmin';

  @IsString()
  @IsOptional()
  S3_BUCKET: string = 'uploads';

  @IsString()
  @IsOptional()
  API_PREFIX: string = 'api';

  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN: string;

  @IsEnum(LogLevel)
  @IsOptional()
  LOG_LEVEL: LogLevel = LogLevel.Debug;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRATION: string = '1h';

  @IsNumber()
  @IsOptional()
  @Min(1000)
  THROTTLE_TTL: number = 60000;

  @IsNumber()
  @IsOptional()
  @Min(1)
  THROTTLE_LIMIT: number = 60;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRATION: string = '7d';

  @IsString()
  @IsNotEmpty()
  ALLOWED_EMAIL_DOMAINS: string;

  @IsBoolean()
  @IsOptional()
  REGISTRATION_ENABLED: boolean = false;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
