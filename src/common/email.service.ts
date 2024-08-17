import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { EmailConfig } from 'src/model/email.model';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(emailConfig: EmailConfig) {
    await this.mailerService.sendMail({
      to: emailConfig.email,
      subject: emailConfig.subject,
      template: emailConfig.template,
      context: {
        url: emailConfig.url,
        logoUrl:
          'https://t3.ftcdn.net/jpg/02/47/48/00/360_F_247480017_ST4hotATsrcErAja0VzdUsrrVBMIcE4u.jpg',
      },
    });
  }
}
