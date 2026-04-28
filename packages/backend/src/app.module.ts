import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { TenantModule } from './tenant/tenant.module';
import { VoucherModule } from './voucher/voucher.module';
import { InvoiceModule } from './invoice/invoice.module';
import { InventoryModule } from './inventory/inventory.module';
import { AssetModule } from './asset/asset.module';
import { ReportModule } from './report/report.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      username: process.env.POSTGRES_USER || 'accounting',
      password: process.env.POSTGRES_PASSWORD || 'accounting123',
      database: process.env.POSTGRES_DB || 'accounting',
      autoLoadEntities: true,
      // 开发环境自动同步实体到数据库，避免频繁写迁移
      synchronize: process.env.TYPEORM_SYNC === 'true' || process.env.NODE_ENV !== 'production',
    }),
    MulterModule.register({
      dest: './uploads',
    }),
    TenantModule,
    VoucherModule,
    InvoiceModule,
    InventoryModule,
    AssetModule,
    ReportModule,
    UserModule,
  ],
})
export class AppModule {}
