import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  async sendText(to: string, subject: string, text: string) {
    const host = process.env.SMTP_HOST;
    if (!host) throw new Error('SMTP_HOST must be configured before sending email');
    const port = Number(process.env.SMTP_PORT ?? 587);
    const transport = nodemailer.createTransport({ host, port, secure: process.env.SMTP_SECURE === 'true', auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined });
    return transport.sendMail({ from: process.env.SMTP_FROM ?? 'noreply@example.invalid', to, subject, text });
  }
}
