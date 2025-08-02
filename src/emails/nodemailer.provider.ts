import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { IEmailProvider } from './email-provider.interface';

@Injectable()
export class NodemailerProvider implements IEmailProvider {
  private readonly logger = new Logger(NodemailerProvider.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST'),
      port: Number(this.configService.get('EMAIL_PORT')),
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'),
      },
    });
  }

  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
  }): Promise<boolean> {
    let attempts = 0;
    const maxAttempts = 2;
    while (attempts < maxAttempts) {
      try {
        await this.transporter.sendMail({
          from: options.from || this.configService.get('EMAIL_FROM'),
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });
        this.logger.log(`Email sent to ${options.to}`);
        return true;
      } catch (error) {
        attempts++;
        this.logger.error(`Failed to send email to ${options.to} (attempt ${attempts}):`, error);
        if (attempts >= maxAttempts) return false;
      }
    }
    return false;
  }
}
