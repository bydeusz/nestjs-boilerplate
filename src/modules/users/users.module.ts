import { Module } from '@nestjs/common';
import { QueueModule } from '../queue';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [QueueModule.register('producer')],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
