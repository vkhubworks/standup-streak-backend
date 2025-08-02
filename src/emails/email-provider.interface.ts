export interface IEmailProvider {
  sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
  }): Promise<boolean>;
}
