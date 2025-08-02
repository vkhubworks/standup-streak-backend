import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailProvider } from './email-provider.interface';

@Injectable()
export class EmailService {
  constructor(
    private configService: ConfigService,
    @Inject('IEmailProvider') private emailProvider: IEmailProvider,
  ) {}

  async sendTeamInvite(
    email: string,
    teamName: string,
    inviterName: string,
    inviteToken: string,
  ): Promise<boolean> {
    const inviteUrl = `${this.configService.get('FRONTEND_URL')}/invite/accept?token=${inviteToken}`;
    const subject = `You've been invited to join ${teamName} on Standup!`;
    const html = this.getInviteEmailTemplate(teamName, inviterName, inviteUrl);
    const text = `${inviterName} invited you to join the team "${teamName}" on Standup. Accept here: ${inviteUrl}`;
    return this.emailProvider.sendMail({
      to: email,
      subject,
      html,
      text,
      from: `"${this.configService.get('APP_NAME')}" <${this.configService.get('EMAIL_FROM')}>`,
    });
  }

  // For larger projects, move this template to src/emails/templates/invite.html and use a template engine like Handlebars.
  private getInviteEmailTemplate(teamName: string, inviterName: string, inviteUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Team Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .content { background: #f8fafc; padding: 30px; border-radius: 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📊 Standup</div>
          </div>
          <div class="content">
            <h2>You've been invited to join a team!</h2>
            <p>Hi there!</p>
            <p><strong>${inviterName}</strong> has invited you to join the <strong>"${teamName}"</strong> team on Standup.</p>
            <p>Standup helps teams stay connected with daily check-ins, track goals, and improve collaboration.</p>
            <div style="text-align: center;">
              <a href="${inviteUrl}" class="button">Accept Invitation</a>
            </div>
            <p><small>This invitation will expire in 7 days. If you don't have an account, you'll be able to create one after accepting.</small></p>
          </div>
          <div class="footer">
            <p>© 2025 Standup. All rights reserved.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
