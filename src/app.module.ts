import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [CommonModule, UserModule, SchedulerModule],
})
export class AppModule {}
