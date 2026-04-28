import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ledger } from './entities/ledger.entity';
import { AccountSubject } from '../voucher/entities/account-subject.entity';
import { Voucher } from '../voucher/entities/voucher.entity';
import { VoucherEntry } from '../voucher/entities/voucher-entry.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ledger, AccountSubject, Voucher, VoucherEntry, Invoice])],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
