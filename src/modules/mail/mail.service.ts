import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Handlebars from 'handlebars';
import nodemailer, { type Transporter } from 'nodemailer';
import type { SendMailOptions } from './interfaces/send-mail-options.interface';

interface SendRawMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly templatesPath = join(__dirname, 'templates');

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('mail.host', 'localhost');
    const port = this.configService.get<number>('mail.port', 1025);
    const secure = this.configService.get<boolean>('mail.secure', false);
    const user = this.configService.get<string>('mail.user', '');
    const password = this.configService.get<string>('mail.password', '');

    this.from = this.configService.get<string>(
      'mail.from',
      'noreply@example.com',
    );

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && password ? { user, pass: password } : undefined,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`SMTP verification failed: ${message}`);
    }
  }

  onModuleDestroy(): void {
    this.logger.log('Closing SMTP transporter...');
    this.transporter.close();
    this.logger.log('SMTP transporter closed');
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const html = await this.renderTemplate(options.template, options.context);

    await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html,
    });
  }

  async sendRawMail(options: SendRawMailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }

  private async renderTemplate(
    templateName: string,
    context: Record<string, unknown> = {},
  ): Promise<string> {
    const templatePath = join(this.templatesPath, `${templateName}.hbs`);
    const templateFile = await readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateFile);

    return template(context);
  }
}
