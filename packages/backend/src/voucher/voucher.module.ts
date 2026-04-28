import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from './entities/voucher.entity';
import { VoucherEntry } from './entities/voucher-entry.entity';
import { VoucherRule } from './entities/voucher-rule.entity';
import { AccountSubject } from './entities/account-subject.entity';
import { AssistantItem } from './entities/assistant-item.entity';
import { TitleBalanceLimit } from './entities/title-balance-limit.entity';
import { Ledger } from '../report/entities/ledger.entity';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { LegacyImportService } from './legacy-import.service';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [TypeOrmModule.forFeature([Voucher, VoucherEntry, VoucherRule, AccountSubject, AssistantItem, TitleBalanceLimit, Ledger]), TenantModule],
  controllers: [VoucherController],
  providers: [VoucherService, LegacyImportService],
  exports: [VoucherService],
})
export class VoucherModule {}
