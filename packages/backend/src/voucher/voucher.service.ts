import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher } from './entities/voucher.entity';
import { VoucherEntry } from './entities/voucher-entry.entity';
import { VoucherRule } from './entities/voucher-rule.entity';
import { AccountSubject } from './entities/account-subject.entity';
import { AssistantItem } from './entities/assistant-item.entity';
import { TitleBalanceLimit } from './entities/title-balance-limit.entity';
import { Ledger } from '../report/entities/ledger.entity';
import { CreateVoucherDto, PostVoucherDto, UpdateVoucherDto } from './dto/voucher.dto';

@Injectable()
export class VoucherService {
  private readonly logger = new Logger(VoucherService.name);

  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,
    @InjectRepository(VoucherEntry)
    private readonly entryRepo: Repository<VoucherEntry>,
    @InjectRepository(VoucherRule)
    private readonly ruleRepo: Repository<VoucherRule>,
    @InjectRepository(AccountSubject)
    private readonly subjectRepo: Repository<AccountSubject>,
    @InjectRepository(AssistantItem)
    private readonly assistantRepo: Repository<AssistantItem>,
    @InjectRepository(TitleBalanceLimit)
    private readonly limitRepo: Repository<TitleBalanceLimit>,
    @InjectRepository(Ledger)
    private readonly ledgerRepo: Repository<Ledger>,
  ) {}

  async findAll(tenantId: string): Promise<Voucher[]> {
    return this.voucherRepo.find({
      where: { tenantId },
      order: { date: 'DESC', voucherNo: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Voucher> {
    const voucher = await this.voucherRepo.findOne({ where: { id } });
    if (!voucher) throw new NotFoundException('凭证不存在');
    return voucher;
  }

  async search(
    tenantId: string,
    filters: { keyword?: string; startDate?: string; endDate?: string; status?: string },
  ) {
    const qb = this.voucherRepo.createQueryBuilder('v').where('v.tenant_id = :tenantId', { tenantId });

    if (filters.keyword) {
      qb.andWhere('v.voucher_no ILIKE :keyword', { keyword: `%${filters.keyword}%` });
    }
    if (filters.startDate) {
      qb.andWhere('v.date >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      qb.andWhere('v.date <= :endDate', { endDate: filters.endDate });
    }
    if (filters.status) {
      qb.andWhere('v.status = :status', { status: filters.status });
    }

    qb.orderBy('v.date', 'DESC').addOrderBy('v.voucher_no', 'DESC');
    return qb.getMany();
  }

  async getEntries(voucherId: string): Promise<VoucherEntry[]> {
    return this.entryRepo.find({ where: { voucherId } });
  }

  async update(id: string, dto: UpdateVoucherDto): Promise<Voucher> {
    const voucher = await this.findOne(id);
    if (voucher.tenantId !== dto.tenantId) {
      throw new BadRequestException('租户不匹配');
    }
    if (voucher.status === 'posted') {
      // 为避免 ledger/报表不一致，已过账凭证暂不支持直接修改
      throw new BadRequestException('凭证已过账，不能修改');
    }

    // 只允许在同一期间内改日期（避免凭证号/期间规则复杂化）
    const oldPeriod = voucher.period;
    const newPeriod = dto.date.replaceAll('-', '').slice(0, 6);
    if (oldPeriod && newPeriod && oldPeriod !== newPeriod) {
      throw new BadRequestException('不支持跨期间修改记账日期');
    }

    // 校验借贷平衡
    const totalDebit = dto.entries.reduce((sum, e) => sum + Number(e.debit), 0);
    const totalCredit = dto.entries.reduce((sum, e) => sum + Number(e.credit), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException('借贷不平衡');
    }

    voucher.date = dto.date;
    voucher.attachmentsCount = dto.attachmentsCount ?? voucher.attachmentsCount ?? 0;
    const saved = await this.voucherRepo.save(voucher);

    // 替换分录
    await this.entryRepo.delete({ voucherId: saved.id });
    for (const entry of dto.entries) {
      const e = this.entryRepo.create({
        voucherId: saved.id,
        subjectId: entry.subjectId,
        assistantType: (entry as any).assistantType ?? null,
        assistantId: (entry as any).assistantId ?? null,
        quantity: (entry as any).quantity ?? null,
        unit: (entry as any).unit ?? null,
        fcurCode: (entry as any).fcurCode ?? null,
        exchangeRate: (entry as any).exchangeRate ?? null,
        fcurAmount: (entry as any).fcurAmount ?? null,
        debit: entry.debit,
        credit: entry.credit,
        summary: entry.summary,
      });
      await this.entryRepo.save(e);
    }

    return saved;
  }

  async create(dto: CreateVoucherDto): Promise<Voucher> {
    // 校验借贷平衡
    const totalDebit = dto.entries.reduce((sum, e) => sum + Number(e.debit), 0);
    const totalCredit = dto.entries.reduce((sum, e) => sum + Number(e.credit), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException('借贷不平衡');
    }

    const docType = dto.docType || 'JI';
    const period = dto.date.replaceAll('-', '').slice(0, 6); // YYYYMM

    // 生成凭证号（同期间同凭证字内）
    const nextNumber = await this.getNextVoucherNumber(dto.tenantId, period, docType);
    const voucherNo = `${docType}-${nextNumber}`;

    const voucher = this.voucherRepo.create({
      tenantId: dto.tenantId,
      period,
      docType,
      number: nextNumber,
      voucherNo,
      date: dto.date,
      attachmentsCount: dto.attachmentsCount ?? 0,
      sourceType: dto.sourceType || 'manual',
      sourceId: dto.sourceId,
      status: 'draft',
    });
    const saved = await this.voucherRepo.save(voucher);

    for (const entry of dto.entries) {
      const e = this.entryRepo.create({
        voucherId: saved.id,
        subjectId: entry.subjectId,
        assistantType: (entry as any).assistantType ?? null,
        assistantId: (entry as any).assistantId ?? null,
        quantity: (entry as any).quantity ?? null,
        unit: (entry as any).unit ?? null,
        fcurCode: (entry as any).fcurCode ?? null,
        exchangeRate: (entry as any).exchangeRate ?? null,
        fcurAmount: (entry as any).fcurAmount ?? null,
        debit: entry.debit,
        credit: entry.credit,
        summary: entry.summary,
      });
      await this.entryRepo.save(e);
    }

    return saved;
  }

  async getNumberMax(tenantId: string, period: string, docType: string): Promise<number> {
    const rows = await this.voucherRepo.find({
      where: { tenantId, period, docType },
      select: ['number'],
    });
    let max = 0;
    for (const r of rows) {
      const n = Number.parseInt(String(r.number), 10);
      if (!Number.isNaN(n)) max = Math.max(max, n);
    }
    return max;
  }

  async getBreakNumber(tenantId: string, period: string, docType: string): Promise<string> {
    return this.getNextVoucherNumber(tenantId, period, docType);
  }

  async getTitleAndAssistantLimit(tenantId: string, docType: string) {
    const list = await this.limitRepo.find({ where: { tenantId } });
    return {
      titleBalanceLimitList: list.map((x) => ({
        titleCode: x.titleCode,
        titleName: x.titleName,
        balanceLimitLower: Number(x.balanceLimitLower),
        balanceLimitHigh: Number(x.balanceLimitHigh),
      })),
      limitAssistantLength: 500,
      limitSubjectLength: 500,
      type: docType,
    };
  }

  async getCachedTitleAndAssistant(tenantId: string) {
    const subjects = await this.subjectRepo.find({ where: { tenantId }, order: { code: 'ASC' } });
    const assistants = await this.assistantRepo.find({ where: { tenantId }, order: { type: 'ASC' as any, code: 'ASC' } });

    // 简单版本号：用科目+辅助核算项数量生成（不做强一致 hash）
    const version = `${subjects.length}-${assistants.length}`;

    const assistantMap: Record<string, any[]> = {};
    for (const a of assistants) {
      if (!assistantMap[a.type]) assistantMap[a.type] = [];
      assistantMap[a.type].push({
        id: Number(a.id),
        code: a.code,
        longCode: null,
        repeatCode: 0,
        name: a.name,
        freezeStatus: a.freezeStatus ?? '0',
        pinYinInitial: a.pinYinInitial ?? '',
        unit: a.unit ?? null,
        categoryId: a.categoryId ?? null,
        categoryFullName: a.categoryFullName ?? null,
        licenseNumber: a.licenseNumber ?? null,
        inventoryType: a.inventoryType ?? null,
      });
    }

    const titleList = subjects.map((s) => ({
      openingBalance: null,
      id: s.id,
      type: s.type,
      code: s.code,
      name: s.name,
      fullName: s.fullName || s.name,
      direction: s.direction === 'credit' ? -1 : 1,
      pCode: '',
      pId: s.parentId ?? null,
      level: s.level ?? 1,
      last: s.last ?? true,
      freezeStatus: null,
      assistantType: s.assistantType ?? '',
      auxiliaryTypes: s.auxiliaryTypes ?? [],
      status: '1',
      source: 'local',
      accountSetId: null,
      unit: s.unit ?? null,
      fcurCode: s.fcurCode ?? null,
      fcurCodes: null,
      useAssistant: !!s.useAssistant,
      useQuantity: !!s.useQuantity,
      useFcur: !!s.useFcur,
      customerId: null,
      remark: null,
      children: null,
      assistants: null,
      pinYinInitial: s.pinYinInitial ?? '',
      inventoryTypes: null,
      logicalUseQuantityMultiAuxiliary: !!(s.useQuantity && s.useAuxiliary),
      useAuxiliary: !!s.useAuxiliary,
      logicalUseQuantity: !!s.useQuantity,
    }));

    return {
      version,
      changed: true,
      data: { titleList, assistantMap },
    };
  }

  /**
   * 计算辅助核算余额（按期间 & 已过账凭证）
   * key: `${subjectId}-${assistantType}-${assistantId}`
   */
  async getAssistantBalanceMap(tenantId: string, period: string) {
    const vouchers = await this.voucherRepo.find({
      where: { tenantId, period, status: 'posted' },
      select: ['id'],
    });
    if (vouchers.length === 0) return {};

    const voucherIds = vouchers.map((v) => v.id);
    const entries = await this.entryRepo
      .createQueryBuilder('e')
      .where('e.voucher_id IN (:...ids)', { ids: voucherIds })
      .getMany();

    const subjects = await this.subjectRepo.find({ where: { tenantId } });
    const subjectDirection = new Map(subjects.map((s) => [s.id, s.direction]));

    const map: Record<
      string,
      {
        balance: number;
        balanceQ: number;
        balanceF: number;
      }
    > = {};

    for (const e of entries) {
      if (!e.assistantType || !e.assistantId) continue;
      const key = `${e.subjectId}-${e.assistantType}-${e.assistantId}`;
      if (!map[key]) map[key] = { balance: 0, balanceQ: 0, balanceF: 0 };

      const debit = Number(e.debit) || 0;
      const credit = Number(e.credit) || 0;
      const dir = subjectDirection.get(e.subjectId) || 'debit';
      const delta = dir === 'credit' ? credit - debit : debit - credit;
      map[key].balance += delta;

      const q = Number(e.quantity) || 0;
      map[key].balanceQ += q;

      const f = Number(e.fcurAmount) || 0;
      map[key].balanceF += f;
    }

    return map;
  }

  private async getNextVoucherNumber(tenantId: string, period: string, docType: string): Promise<string> {
    const rows = await this.voucherRepo.find({
      where: { tenantId, period, docType },
      select: ['number'],
    });
    const nums = rows
      .map((r) => Number.parseInt(String(r.number), 10))
      .filter((x) => !Number.isNaN(x))
      .sort((a, b) => a - b);

    let candidate = 1;
    for (const n of nums) {
      if (n === candidate) candidate += 1;
      else if (n > candidate) break;
    }

    return String(candidate).padStart(3, '0');
  }

  async post(dto: PostVoucherDto): Promise<Voucher> {
    const voucher = await this.findOne(dto.voucherId);
    if (voucher.status === 'posted') {
      throw new BadRequestException('凭证已过账');
    }
    voucher.status = 'posted';
    const saved = await this.voucherRepo.save(voucher);

    // 过账后更新 ledger
    try {
      await this.updateLedger(voucher);
    } catch (err) {
      this.logger.warn(`更新 ledger 失败: ${err.message}`);
    }

    return saved;
  }

  /**
   * 自动凭证引擎 - 根据规则自动生成凭证
   */
  async autoGenerate(tenantId: string, bizType: string, data: Record<string, any>): Promise<Voucher> {
    const rules = await this.ruleRepo.find({ where: { tenantId, bizType } });
    if (rules.length === 0) {
      throw new BadRequestException(`未找到业务类型 ${bizType} 的凭证规则`);
    }

    const entries = [];
    for (const rule of rules) {
      const amount = this.evaluateFormula(rule.formula, data);
      if (rule.debitSubjectId) {
        entries.push({ subjectId: rule.debitSubjectId, debit: amount, credit: 0, summary: `自动生成-${bizType}` });
      }
      if (rule.creditSubjectId) {
        entries.push({ subjectId: rule.creditSubjectId, debit: 0, credit: amount, summary: `自动生成-${bizType}` });
      }
    }

    return this.create({ tenantId, date: data.date || new Date().toISOString().slice(0, 10), sourceType: bizType, entries });
  }

  private evaluateFormula(formula: string, data: Record<string, any>): number {
    if (!formula) return Number(data.amount) || 0;
    try {
      const fn = new Function(...Object.keys(data), `return ${formula}`);
      return fn(...Object.values(data));
    } catch {
      return Number(data.amount) || 0;
    }
  }

  /**
   * 根据科目名称查找科目
   */
  async findSubjectByName(tenantId: string, name: string): Promise<AccountSubject | null> {
    return this.subjectRepo.findOne({ where: { tenantId, name } });
  }

  /**
   * 凭证过账时更新 ledger 明细账
   */
  private async updateLedger(voucher: Voucher): Promise<void> {
    const entries = await this.entryRepo.find({ where: { voucherId: voucher.id } });
    const period = voucher.date.slice(0, 7); // YYYY-MM

    for (const entry of entries) {
      const subject = await this.subjectRepo.findOne({ where: { id: entry.subjectId } });
      if (!subject) continue;

      const debit = Number(entry.debit) || 0;
      const credit = Number(entry.credit) || 0;

      // 查找已有 ledger 记录
      let ledger = await this.ledgerRepo.findOne({
        where: { tenantId: voucher.tenantId, subjectId: entry.subjectId, period },
      });

      if (ledger) {
        ledger.debitTotal = Number(ledger.debitTotal) + debit;
        ledger.creditTotal = Number(ledger.creditTotal) + credit;
      } else {
        ledger = this.ledgerRepo.create({
          tenantId: voucher.tenantId,
          subjectId: entry.subjectId,
          period,
          debitTotal: debit,
          creditTotal: credit,
          balance: 0,
        });
      }

      // 计算余额
      const dt = Number(ledger.debitTotal);
      const ct = Number(ledger.creditTotal);
      switch (subject.type) {
        case 'asset':
        case 'expense':
          ledger.balance = dt - ct;
          break;
        case 'liability':
        case 'equity':
        case 'income':
          ledger.balance = ct - dt;
          break;
        default:
          ledger.balance = dt - ct;
      }

      await this.ledgerRepo.save(ledger);
    }
  }
}
