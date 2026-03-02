import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { JobsOptions, Queue } from 'bullmq';
import { MAIL_QUEUE } from './constants/queue.constants';

@Injectable()
export class QueueService {
  constructor(@InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue) {}

  async addMailJob(
    name: string,
    data: Record<string, unknown>,
    options?: JobsOptions,
  ): Promise<void> {
    await this.mailQueue.add(name, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      ...options,
    });
  }
}
