import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { EmailService } from 'src/common/email.service';
import { PrismaService } from 'src/common/prisma.service';
import { EmailConfig } from 'src/model/email.model';
import { Logger } from 'winston';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class EmailVerificationScheduler {
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
        AND: [{ status: 'Pending' }, { type: 'EmailVerification' }],
      },
    });

    for (const log of pendingEmails) {
      try {
        await this.emailService.sendEmail({
          email: log.email,
          token: this.generateVerificationToken(log.userId),
          subject: 'Email Verification',
          template: './verification',
        } as EmailConfig);

        await this.prismaService.emailLog.update({
          where: { id: log.id },
          data: { status: 'sent' },
        });
      } catch (error) {
        await this.prismaService.emailLog.update({
          where: { id: log.id },
          data: { status: 'failed' },
        });
      }
    }
  }

  private generateVerificationToken(userId: string): string {
    const secretKey = process.env.JWT_SECRET;
    const expiresIn = '1h';

    return jwt.sign({ userId }, secretKey, { expiresIn });
  }
}
