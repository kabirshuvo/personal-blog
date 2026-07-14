import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;
  private readonly fromAddress: string;

  constructor() {
    const host = process.env.SMTP_HOST?.trim();

    if (!host) {
      this.transporter = null;
      this.fromAddress = process.env.SMTP_FROM?.trim() ?? 'noreply@localhost';
      return;
    }

    this.fromAddress =
      process.env.SMTP_FROM?.trim() ??
      process.env.SMTP_USER?.trim() ??
      'noreply@localhost';

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.send({
      to,
      subject: 'Welcome to Monalo Journal',
      text: `Hi ${name},\n\nThanks for creating an account. We're glad you're here.\n\n— Monalo Journal`,
      html: `<p>Hi ${this.escapeHtml(name)},</p><p>Thanks for creating an account. We're glad you're here.</p><p>— Monalo Journal</p>`,
    });
  }

  async sendNewsletterConfirmation(to: string): Promise<void> {
    await this.send({
      to,
      subject: 'Newsletter subscription confirmed',
      text: `Thanks for subscribing to Monalo Journal.\n\nYou'll receive new posts and updates at this address.`,
      html: `<p>Thanks for subscribing to <strong>Monalo Journal</strong>.</p><p>You'll receive new posts and updates at this address.</p>`,
    });
  }

  private async send(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    const payload = {
      from: this.fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    if (!this.transporter) {
      this.logger.log(
        `SMTP not configured — email to ${options.to}: ${options.subject}\n${options.text}`,
      );
      return;
    }

    await this.transporter.sendMail(payload);
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
