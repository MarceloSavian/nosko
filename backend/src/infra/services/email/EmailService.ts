import { Resend } from 'resend';
import type { IEmailService } from '../../../data/domain/email/IEmailService.js';

export class EmailService implements IEmailService {
  private readonly client: Resend;

  constructor(apiKey: string, private readonly from: string) {
    this.client = new Resend(apiKey);
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    await this.client.emails.send({ from: this.from, to, subject, html });
  }
}
