import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { EmailConfig } from 'src/model/email.model';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(emailConfig: EmailConfig) {
    const url = `${process.env.APP_URL}/verify?token=${emailConfig.token}`;

    await this.mailerService.sendMail({
      to: emailConfig.email,
      subject: emailConfig.subject,
      template: emailConfig.template,
      context: {
        url,
      },
    });
  }
}
