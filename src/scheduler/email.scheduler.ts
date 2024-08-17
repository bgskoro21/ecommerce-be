import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { EmailService } from 'src/common/email.service';
import { PrismaService } from 'src/common/prisma.service';
import { EmailConfig, EmailType } from 'src/model/email.model';
import { Logger } from 'winston';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class SendEmailSchedulerService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly emailService: EmailService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkPendingEmails() {
    this.logger.debug('checkPendingEmails is running');
    const pendingEmails = await this.prismaService.emailLog.findMany({
      where: {
        AND: [{ status: 'Pending' }],
      },
    });

    for (const log of pendingEmails) {
      try {
        switch (log.type) {
          case EmailType.EMAIL_VERIFICATION:
            await this.emailService.sendEmail({
              email: log.email,
              subject: 'Email Verification',
              template: './verification',
              url: `${process.env.APP_URL}/verify?token=${this.generateToken(log.userId)}`,
            } as EmailConfig);
            break;
          case EmailType.FORGOT_PASSWORD:
            await this.emailService.sendEmail({
              email: log.email,
              subject: 'Forgot Password',
              template: './forgot_password',
              url: `${process.env.APP_URL}/reset-password?token=${this.generateToken(log.userId)}`,
            } as EmailConfig);
            break;
          default:
            this.logger.warn(`Unknown email type: ${log.type}`);
            continue;
        }

        await this.prismaService.emailLog.update({
          where: { id: log.id },
          data: { status: 'sent' },
        });
      } catch (error) {
        console.log(`Error : ${error}`);
        await this.prismaService.emailLog.update({
          where: { id: log.id },
          data: { status: 'failed' },
        });
      }
    }
  }

  private generateToken(userId: string): string {
    const secretKey = process.env.JWT_SECRET;
    const expiresIn = '1h';

    return jwt.sign({ userId }, secretKey, { expiresIn });
  }
}
