import { Module, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logLevel = configService.get<string>('log.level') ?? 'debug';
        const isDevelopment =
          (configService.get<string>('nodeEnv') ?? 'development') ===
          'development';

        return {
          forRoutes: [{ path: '*path', method: RequestMethod.ALL }],
          pinoHttp: {
            genReqId: (req) => req.id,
            level: logLevel,
            autoLogging: true,
            redact: ['req.headers.authorization', 'req.headers.cookie'],
            transport: {
              targets: [
                ...(isDevelopment
                  ? [
                      {
                        target: 'pino-pretty',
                        level: logLevel,
                        options: {
                          colorize: true,
                          singleLine: true,
                          translateTime: 'SYS:standard',
                        },
                      },
                    ]
                  : [
                      {
                        target: 'pino/file',
                        level: 'info',
                        options: { destination: 1 },
                      },
                    ]),
                {
                  target: 'pino-roll',
                  level: logLevel,
                  options: {
                    file: 'logs/app',
                    frequency: 'daily',
                    dateFormat: 'yyyy-MM-dd',
                    limit: { count: 7 },
                    mkdir: true,
                  },
                },
              ],
            },
          },
        };
      },
    }),
  ],
})
export class LoggerModule {}
