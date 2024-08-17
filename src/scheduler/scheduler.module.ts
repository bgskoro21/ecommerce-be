import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { join, resolve } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { SendEmailSchedulerService } from './email.scheduler';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MailerModule.forRoot({
      transport: {
        service: process.env.EMAIL_SERVICE,
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_FROM,
          pass: process.env.EMAIL_FROM_PASSWORD,
        },
      },
      defaults: {
        from: '"No Reply" <no-reply@example.com>', // Alamat email default
      },
      template: {
        dir:
          process.env.NODE_ENV === 'production'
            ? join(__dirname, './templates')
            : resolve('src/templates'),
        adapter: new HandlebarsAdapter(), // Menggunakan Handlebars sebagai template engine
        options: {
          strict: true,
        },
      },
      options: {
        partials: {
          dir:
            process.env.NODE_ENV === 'production'
              ? join(__dirname, './templates/partials')
              : resolve('src/templates/partials'),
        },
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [SendEmailSchedulerService],
  exports: [SendEmailSchedulerService],
})
export class SchedulerModule {}
