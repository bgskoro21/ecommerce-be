import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { StoreModule } from './store/store.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ProductModule } from './product/product.module';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'storage/uploads'), // Direktori tempat file disimpan
      serveRoot: '/storage/uploads', // Path URL untuk mengakses file statis
    }),
    NestjsFormDataModule,
    CommonModule,
    UserModule,
    SchedulerModule,
    StoreModule,
    ProductModule,
  ],
})
export class AppModule {}
