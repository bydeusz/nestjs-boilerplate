import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MAIL_JOB_SEND, MAIL_QUEUE } from '../constants/queue.constants';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  async process(job: Job<Record<string, unknown>>): Promise<void> {
    switch (job.name) {
      case MAIL_JOB_SEND:
        await this.handleSendMail(job);
        return;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleSendMail(job: Job<Record<string, unknown>>): Promise<void> {
    this.logger.log(`Processing mail job ${job.id}`);
    // Mail service integratie volgt in Ticket 29.
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    const jobId = job?.id ?? 'unknown';
    this.logger.error(`Job ${jobId} failed: ${error.message}`, error.stack);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job ${job.id} completed`);
  }
}
