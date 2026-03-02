import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MAIL_QUEUE } from './constants/queue.constants';
import { MailProcessor } from './processors/mail.processor';
import { QueueService } from './queue.service';

@Module({
  imports: [BullModule.registerQueue({ name: MAIL_QUEUE })],
  providers: [MailProcessor, QueueService],
  exports: [QueueService],
})
export class QueueModule {}
