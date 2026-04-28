import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FixedAsset } from './entities/fixed-asset.entity';
import { AssetDepreciation } from './entities/asset-depreciation.entity';
import { CreateAssetDto, RunDepreciationDto } from './dto/asset.dto';
import { VoucherService } from '../voucher/voucher.service';

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);

  constructor(
    @InjectRepository(FixedAsset)
    private readonly assetRepo: Repository<FixedAsset>,
    @InjectRepository(AssetDepreciation)
    private readonly depreciationRepo: Repository<AssetDepreciation>,
    private readonly voucherService: VoucherService,
  ) {}

  async findAll(tenantId: string): Promise<FixedAsset[]> {
    return this.assetRepo.find({ where: { tenantId } });
  }

  async findOne(id: string): Promise<FixedAsset> {
    const asset = await this.assetRepo.findOne({ where: { id } });
    if (!asset) throw new NotFoundException('固定资产不存在');
    return asset;
  }

  async create(dto: CreateAssetDto): Promise<FixedAsset> {
    const asset = this.assetRepo.create(dto);
    return this.assetRepo.save(asset);
  }

  /**
   * 计算月折旧额
   * 月折旧额 = 原值 * (1 - 残值率) / 使用年限(月)
   */
  calcMonthlyDepreciation(asset: FixedAsset): number {
    return Number(asset.originalValue) * (1 - Number(asset.residualRate)) / asset.usefulLife;
  }

  /**
   * 运行折旧 - 为指定租户的所有资产计算指定期间的折旧
   */
  async runDepreciation(dto: RunDepreciationDto): Promise<AssetDepreciation[]> {
    const assets = await this.findAll(dto.tenantId);
    const results: AssetDepreciation[] = [];

    for (const asset of assets) {
      // 检查是否已计算过该期间
      const existing = await this.depreciationRepo.findOne({
        where: { assetId: asset.id, period: dto.period },
      });
      if (existing) continue;

      // 检查资产是否在该期间已启用
      const assetStart = asset.startDate.slice(0, 7);
      if (dto.period < assetStart) continue;

      const amount = this.calcMonthlyDepreciation(asset);
      const dep = this.depreciationRepo.create({
        assetId: asset.id,
        period: dto.period,
        amount,
      });
      const saved = await this.depreciationRepo.save(dep);
      results.push(saved);

      // 折旧自动生成凭证
      // 借：管理费用，金额 = 折旧额
      // 贷：累计折旧，金额 = 折旧额
      try {
        await this.generateDepreciationVoucher(dto.tenantId, dto.period + '-01', amount);
      } catch (err) {
        this.logger.warn(`折旧自动凭证生成失败，跳过: ${err.message}`);
      }
    }

    return results;
  }

  async getDepreciations(assetId: string): Promise<AssetDepreciation[]> {
    return this.depreciationRepo.find({ where: { assetId }, order: { period: 'ASC' } });
  }

  /**
   * 折旧自动生成凭证
   */
  private async generateDepreciationVoucher(tenantId: string, date: string, amount: number): Promise<void> {
    const expenseSubject = await this.voucherService.findSubjectByName(tenantId, '管理费用');
    const accumDepSubject = await this.voucherService.findSubjectByName(tenantId, '累计折旧');
    if (!expenseSubject || !accumDepSubject) {
      this.logger.warn('未找到管理费用或累计折旧科目，跳过折旧自动凭证');
      return;
    }

    const v = await this.voucherService.create({
      tenantId,
      date,
      sourceType: 'asset',
      entries: [
        { subjectId: expenseSubject.id, debit: amount, credit: 0, summary: '固定资产折旧' },
        { subjectId: accumDepSubject.id, debit: 0, credit: amount, summary: '固定资产折旧' },
      ],
    });
    // 自动过账，确保 ledger 与报表能生成数据
    await this.voucherService.post({ voucherId: v.id } as any);
  }
}
