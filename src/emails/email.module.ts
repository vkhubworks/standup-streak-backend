import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { NodemailerProvider } from './nodemailer.provider';
import { ConfigService } from '@nestjs/config';
import { IEmailProvider } from './email-provider.interface';

@Module({
  imports: [ConfigModule],
  providers: [
    NodemailerProvider,
    {
      provide: 'IEmailProvider',
      useExisting: NodemailerProvider, // Swap with SendGridProvider, SESProvider, etc. for production
    },
    {
      provide: EmailService,
      useFactory: (configService: ConfigService, emailProvider: IEmailProvider) =>
        new EmailService(configService, emailProvider),
      inject: [ConfigService, 'IEmailProvider'],
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
