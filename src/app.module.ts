import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import {
  RequestLoggingInterceptor,
  TransformInterceptor,
} from './common/interceptors';
import { AllExceptionsFilter } from './common/filters';
import { LoggerModule } from './common/logger';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { AppFeatureModule } from './modules/app/app.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [configuration],
      cache: true,
    }),
    LoggerModule,
    PrismaModule,
    AppFeatureModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
