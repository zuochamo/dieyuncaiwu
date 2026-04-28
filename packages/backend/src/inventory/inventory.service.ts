import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryTxn } from './entities/inventory-txn.entity';
import { CreateInventoryItemDto, CreateInventoryTxnDto } from './dto/inventory.dto';
import { VoucherService } from '../voucher/voucher.service';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,
    @InjectRepository(InventoryTxn)
    private readonly txnRepo: Repository<InventoryTxn>,
    private readonly voucherService: VoucherService,
  ) {}

  // 商品管理
  async findAllItems(tenantId: string): Promise<InventoryItem[]> {
    return this.itemRepo.find({ where: { tenantId } });
  }

  async createItem(dto: CreateInventoryItemDto): Promise<InventoryItem> {
    const item = this.itemRepo.create(dto);
    return this.itemRepo.save(item);
  }

  // 库存流水
  async stockIn(dto: CreateInventoryTxnDto): Promise<InventoryTxn> {
    const txn = this.txnRepo.create({ ...dto, type: 'in' });
    const saved = await this.txnRepo.save(txn);

    // 入库自动生成凭证
    // 借：库存商品，金额 = amount
    // 贷：应付账款，金额 = amount
    try {
      await this.generateStockInVoucher(dto.tenantId, dto.date, Number(dto.amount));
    } catch (err) {
      this.logger.warn(`入库自动凭证生成失败，跳过: ${err.message}`);
    }

    return saved;
  }

  async stockOut(dto: CreateInventoryTxnDto): Promise<InventoryTxn> {
    // 用移动平均法计算出库成本
    const { unitCost } = await this.calcMovingAvgCost(dto.tenantId, dto.itemId);
    const outCost = Number(dto.qty) * unitCost;

    const txn = this.txnRepo.create({
      ...dto,
      type: 'out',
      amount: outCost, // 用移动平均成本覆盖金额
    });
    const saved = await this.txnRepo.save(txn);

    // 出库自动生成凭证
    // 借：主营业务成本，金额 = 出库成本
    // 贷：库存商品，金额 = 出库成本
    try {
      await this.generateStockOutVoucher(dto.tenantId, dto.date, outCost);
    } catch (err) {
      this.logger.warn(`出库自动凭证生成失败，跳过: ${err.message}`);
    }

    return saved;
  }

  async getTransactions(tenantId: string, itemId?: string): Promise<InventoryTxn[]> {
    const where: any = { tenantId };
    if (itemId) where.itemId = itemId;
    return this.txnRepo.find({ where, order: { date: 'DESC' } });
  }

  /**
   * 获取库存数量和金额
   */
  async getStock(tenantId: string, itemId: string): Promise<{ qty: number; amount: number }> {
    const txns = await this.txnRepo.find({ where: { tenantId, itemId }, order: { date: 'ASC', createdAt: 'ASC' } });
    let qty = 0, amount = 0;
    for (const t of txns) {
      if (t.type === 'in') {
        qty += Number(t.qty);
        amount += Number(t.amount);
      } else {
        qty -= Number(t.qty);
        amount -= Number(t.amount);
      }
    }
    return { qty, amount };
  }

  /**
   * 移动平均法计算出库单位成本
   * 单位成本 = 当前库存总金额 / 当前库存总数量
   */
  async calcMovingAvgCost(tenantId: string, itemId: string): Promise<{ unitCost: number; qty: number; totalAmount: number }> {
    const { qty, amount } = await this.getStock(tenantId, itemId);
    const unitCost = qty > 0 ? amount / qty : 0;
    return { unitCost, qty, totalAmount: amount };
  }

  /**
   * 入库自动生成凭证
   */
  private async generateStockInVoucher(tenantId: string, date: string, amount: number): Promise<void> {
    const inventorySubject = await this.voucherService.findSubjectByName(tenantId, '库存商品');
    const payableSubject = await this.voucherService.findSubjectByName(tenantId, '应付账款');
    if (!inventorySubject || !payableSubject) {
      this.logger.warn('未找到库存商品或应付账款科目，跳过入库自动凭证');
      return;
    }

    const v = await this.voucherService.create({
      tenantId,
      date,
      sourceType: 'inventory',
      entries: [
        { subjectId: inventorySubject.id, debit: amount, credit: 0, summary: '库存入库' },
        { subjectId: payableSubject.id, debit: 0, credit: amount, summary: '库存入库' },
      ],
    });
    // 自动过账，确保 ledger 与报表能生成数据
    await this.voucherService.post({ voucherId: v.id } as any);
  }

  /**
   * 出库自动生成凭证
   */
  private async generateStockOutVoucher(tenantId: string, date: string, cost: number): Promise<void> {
    const costSubject = await this.voucherService.findSubjectByName(tenantId, '主营业务成本');
    const inventorySubject = await this.voucherService.findSubjectByName(tenantId, '库存商品');
    if (!costSubject || !inventorySubject) {
      this.logger.warn('未找到主营业务成本或库存商品科目，跳过出库自动凭证');
      return;
    }

    const v = await this.voucherService.create({
      tenantId,
      date,
      sourceType: 'inventory',
      entries: [
        { subjectId: costSubject.id, debit: cost, credit: 0, summary: '库存出库成本' },
        { subjectId: inventorySubject.id, debit: 0, credit: cost, summary: '库存出库成本' },
      ],
    });
    // 自动过账，确保 ledger 与报表能生成数据
    await this.voucherService.post({ voucherId: v.id } as any);
  }
}
