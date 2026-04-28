import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FixedAsset } from './entities/fixed-asset.entity';
import { AssetDepreciation } from './entities/asset-depreciation.entity';
import { AssetService } from './asset.service';
import { AssetController } from './asset.controller';
import { VoucherModule } from '../voucher/voucher.module';

@Module({
  imports: [TypeOrmModule.forFeature([FixedAsset, AssetDepreciation]), VoucherModule],
  controllers: [AssetController],
  providers: [AssetService],
  exports: [AssetService],
})
export class AssetModule {}
