import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import * as path from 'path';
import * as xlsx from 'xlsx';
import { Voucher } from './entities/voucher.entity';
import { VoucherEntry } from './entities/voucher-entry.entity';
import { AccountSubject } from './entities/account-subject.entity';
import { AssistantItem } from './entities/assistant-item.entity';
import { Ledger } from '../report/entities/ledger.entity';
import { TenantService } from '../tenant/tenant.service';

type ImportMode = 'replace' | 'skip' | 'fail';

type VoucherRow = {
  date: string;
  voucherType: string;
  number: string;
  rowNo: string;
  summary: string;
  subjectCode: string;
  subjectName: string;
  debit: number;
  credit: number;
  fcurCode?: string;
  debitFcurAmount?: number;
  creditFcurAmount?: number;
  exchangeRate?: number;
  unit?: string;
  quantity?: number;
  customerCode?: string;
  customerName?: string;
  supplierCode?: string;
  supplierName?: string;
};

type ImportResult = {
  fileUsed: string;
  mode: ImportMode;
  periods: string[];
  voucherCount: number;
  entryCount: number;
  replacedVoucherCount: number;
  assistantUpserts: { created: number; reused: number };
  ledgerUpserts: { created: number; updated: number };
  warnings: string[];
};

@Injectable()
export class LegacyImportService {
  private readonly logger = new Logger(LegacyImportService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantService: TenantService,
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,
    @InjectRepository(VoucherEntry)
    private readonly entryRepo: Repository<VoucherEntry>,
    @InjectRepository(AccountSubject)
    private readonly subjectRepo: Repository<AccountSubject>,
    @InjectRepository(AssistantItem)
    private readonly assistantRepo: Repository<AssistantItem>,
    @InjectRepository(Ledger)
    private readonly ledgerRepo: Repository<Ledger>,
  ) {}

  private resolveDefaultXlsPath(): string {
    // dev: packages/backend -> repo root has 2026.xls
    return path.resolve(process.cwd(), '..', '..', '2026.xls');
  }

  private mapDocType(xlsType: string): string {
    const t = String(xlsType || '').trim();
    if (t === '记') return 'JI';
    if (!t) return 'JI';
    // 保底：直接用原值（但会影响 voucherNo 展示）
    return t.toUpperCase();
  }

  private safeNumber(v: unknown): number {
    if (v === '' || v === null || v === undefined) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  private parseVoucherRows(wb: xlsx.WorkBook): VoucherRow[] {
    const ws = wb.Sheets['凭证序时簿'];
    if (!ws) throw new BadRequestException('Excel 缺少工作表：凭证序时簿');
    const aoa = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
    if (aoa.length < 4) return [];

    // 第 3 行为表头
    const header = aoa[2].map((x) => String(x || '').trim());
    const col = (name: string) => header.indexOf(name);
    const idx = {
      date: col('记账日期'),
      voucherType: col('凭证类型'),
      number: col('凭证号'),
      rowNo: col('分录行号'),
      summary: col('摘要'),
      subjectCode: col('科目编码'),
      subjectName: col('科目名称'),
      debit: col('借方金额'),
      credit: col('贷方金额'),
      fcurCode: col('外币代码'),
      debitFcurAmount: col('借方外币金额'),
      creditFcurAmount: col('贷方外币金额'),
      exchangeRate: col('汇率'),
      unit: col('计量单位'),
      quantity: col('数量'),
      customerCode: col('客户编码'),
      customerName: col('客户名称'),
      supplierCode: col('供应商编码'),
      supplierName: col('供应商名称'),
    };

    const required = ['date', 'voucherType', 'number', 'subjectCode', 'debit', 'credit'];
    for (const k of required) {
      if ((idx as any)[k] < 0) throw new BadRequestException(`Excel 凭证序时簿缺少列：${k}`);
    }

    const rows: VoucherRow[] = [];
    for (let i = 3; i < aoa.length; i++) {
      const r = aoa[i];
      const date = String(r[idx.date] || '').trim();
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

      rows.push({
        date,
        voucherType: String(r[idx.voucherType] || '').trim(),
        number: String(r[idx.number] || '').trim(),
        rowNo: String(r[idx.rowNo] || '').trim(),
        summary: String(r[idx.summary] || '').trim(),
        subjectCode: String(r[idx.subjectCode] || '').trim(),
        subjectName: String(r[idx.subjectName] || '').trim(),
        debit: this.safeNumber(r[idx.debit]),
        credit: this.safeNumber(r[idx.credit]),
        fcurCode: String(r[idx.fcurCode] || '').trim() || undefined,
        debitFcurAmount: this.safeNumber(r[idx.debitFcurAmount]) || undefined,
        creditFcurAmount: this.safeNumber(r[idx.creditFcurAmount]) || undefined,
        exchangeRate: this.safeNumber(r[idx.exchangeRate]) || undefined,
        unit: String(r[idx.unit] || '').trim() || undefined,
        quantity: this.safeNumber(r[idx.quantity]) || undefined,
        customerCode: String(r[idx.customerCode] || '').trim() || undefined,
        customerName: String(r[idx.customerName] || '').trim() || undefined,
        supplierCode: String(r[idx.supplierCode] || '').trim() || undefined,
        supplierName: String(r[idx.supplierName] || '').trim() || undefined,
      });
    }
    return rows;
  }

  private parseLedgerRows(wb: xlsx.WorkBook): Array<{
    period: string; // YYYY-MM
    subjectCode: string;
    assistantType?: string;
    endingDebit: number;
    endingCredit: number;
  }> {
    const ws = wb.Sheets['科目余额表'];
    if (!ws) return [];
    const aoa = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
    if (aoa.length < 6) return [];

    // row 3/4: header, data starts row 5
    const rows: Array<{ period: string; subjectCode: string; assistantType?: string; endingDebit: number; endingCredit: number }> = [];
    for (let i = 4; i < aoa.length; i++) {
      const r = aoa[i];
      const periodRaw = String(r[0] || '').trim(); // 2026年第1期
      const subjectCode = String(r[1] || '').trim();
      const assistantType = String(r[5] || '').trim() || undefined; // 客户/供应商...
      if (!periodRaw || !subjectCode) continue;

      const m = periodRaw.match(/^(\d{4})年第(\d{1,2})期$/);
      if (!m) continue;
      const period = `${m[1]}-${String(m[2]).padStart(2, '0')}`;

      const endingDebit = this.safeNumber(r[23]);
      const endingCredit = this.safeNumber(r[26]);
      rows.push({ period, subjectCode, assistantType, endingDebit, endingCredit });
    }
    return rows;
  }

  async import2026Xls(params: { tenantId: string; mode: ImportMode; filePath?: string }): Promise<ImportResult> {
    const { tenantId, mode } = params;
    const fileUsed = params.filePath || this.resolveDefaultXlsPath();

    // 确保科目存在（至少把标准科目表补齐）
    await this.tenantService.initSmallBusinessCoa(tenantId, { mode: 'append' });

    let wb: xlsx.WorkBook;
    try {
      wb = xlsx.readFile(fileUsed, { cellDates: true });
    } catch (e: any) {
      throw new BadRequestException(`读取 Excel 失败：${e?.message || e}`);
    }

    const voucherRows = this.parseVoucherRows(wb);
    if (voucherRows.length === 0) {
      throw new BadRequestException('凭证序时簿无有效数据行');
    }

    const ledgerRows = this.parseLedgerRows(wb);

    // 预加载科目映射（缺失的二级/末级科目会在事务内按 Excel 自动补齐）
    const subjects = await this.subjectRepo.find({ where: { tenantId } });
    const subjectByCode = new Map(subjects.map((s) => [String(s.code), s]));

    const periodsSet = new Set<string>();
    const voucherKeyToRows = new Map<string, VoucherRow[]>();
    for (const r of voucherRows) {
      const docType = this.mapDocType(r.voucherType);
      const period = r.date.replaceAll('-', '').slice(0, 6);
      periodsSet.add(`${period.slice(0, 4)}-${period.slice(4, 6)}`); // YYYY-MM
      const number = String(r.number).padStart(3, '0');
      const key = `${r.date}|${docType}|${number}`;
      if (!voucherKeyToRows.has(key)) voucherKeyToRows.set(key, []);
      voucherKeyToRows.get(key)!.push({ ...r, number });
    }

    const warnings: string[] = [];
    const assistantCache = new Map<string, AssistantItem>(); // type|code
    let assistantCreated = 0;
    let assistantReused = 0;

    const upsertAssistant = async (type: 'c' | 's', code: string, name: string) => {
      const k = `${type}|${code}`;
      const cached = assistantCache.get(k);
      if (cached) return cached;
      let item = await this.assistantRepo.findOne({ where: { tenantId, type, code } });
      if (!item) {
        item = this.assistantRepo.create({ tenantId, type, code, name, freezeStatus: '0', pinYinInitial: null });
        item = await this.assistantRepo.save(item);
        assistantCreated += 1;
      } else {
        assistantReused += 1;
      }
      assistantCache.set(k, item);
      return item;
    };

    const voucherNos = Array.from(voucherKeyToRows.keys()).map((k) => {
      const [, docType, number] = k.split('|');
      return `${docType}-${number}`;
    });

    let replacedVoucherCount = 0;
    let ledgerCreated = 0;
    let ledgerUpdated = 0;

    await this.dataSource.transaction(async (manager) => {
      // --- 自动补齐 Excel 中出现但系统缺少的科目（尽量从父科目继承 type/direction） ---
      const desired = new Map<string, string>(); // code -> name
      for (const r of voucherRows) {
        if (r.subjectCode) desired.set(r.subjectCode, r.subjectName || r.subjectCode);
      }
      for (const r of ledgerRows) {
        // 科目余额表里不一定有“科目名称”列的真实名称，避免覆盖凭证序时簿里已拿到的名称
        if (r.subjectCode && !desired.has(r.subjectCode)) desired.set(r.subjectCode, r.subjectCode);
      }

      const repo = manager.getRepository(AccountSubject);
      const existing = await repo.find({ where: { tenantId } });
      const byCode = new Map(existing.map((s) => [String(s.code), s]));

      const getParent = (code: string) => {
        // 向上找最近的前缀父科目：100201 -> 1002 -> 100
        for (let cut = code.length - 2; cut >= 2; cut -= 2) {
          const p = code.slice(0, cut);
          const parent = byCode.get(p);
          if (parent) return parent;
        }
        return null;
      };

      const guessTypeDirection = (code: string, name: string) => {
        const n = String(name || '').trim();
        if (n.includes('收入')) return { type: 'income', direction: 'credit' };
        if (n.includes('成本') || n.includes('费用') || n.includes('支出')) return { type: 'expense', direction: 'debit' };
        if (n.includes('应付') || code.startsWith('2')) return { type: 'liability', direction: 'credit' };
        if (n.includes('权益') || code.startsWith('3')) return { type: 'equity', direction: 'credit' };
        if (n.includes('应收') || code.startsWith('1')) return { type: 'asset', direction: 'debit' };
        // 默认按资产处理
        return { type: 'asset', direction: 'debit' };
      };

      for (const [code, name] of desired.entries()) {
        const existed = byCode.get(code);
        if (existed) {
          // 如果之前用“编码当名称”创建过科目，且现在拿到了更好的名称，则纠正
          const desiredName = String(name || '').trim();
          if (desiredName && desiredName !== code && (existed.name === code || existed.fullName === code)) {
            existed.name = desiredName;
            existed.fullName = existed.parentId ? (existed.fullName === code ? desiredName : existed.fullName) : desiredName;
            await repo.save(existed);
          }
          continue;
        }
        const parent = getParent(code);
        const base = parent
          ? { type: parent.type, direction: parent.direction, parentId: parent.id, level: (parent.level || 1) + 1, fullNamePrefix: parent.fullName || parent.name }
          : { ...guessTypeDirection(code, name), parentId: null, level: 1, fullNamePrefix: '' };

        if (parent && parent.last) {
          parent.last = false;
          await repo.save(parent);
        }

        const fullName = base.fullNamePrefix ? `${base.fullNamePrefix}-${name || code}` : `${name || code}`;

        const created = repo.create({
          tenantId,
          code,
          name: name || code,
          fullName,
          type: base.type,
          direction: base.direction,
          parentId: base.parentId,
          level: base.level,
          last: true,
          useAssistant: false,
          assistantType: null,
          auxiliaryTypes: null,
          useAuxiliary: false,
          useQuantity: false,
          unit: null,
          useFcur: false,
          fcurCode: null,
          pinYinInitial: null,
        });
        const saved = await repo.save(created);
        byCode.set(code, saved);
        subjectByCode.set(code, saved);
      }

      if (mode === 'replace') {
        const existing = await manager.getRepository(Voucher).find({
          where: { tenantId, voucherNo: In(voucherNos) },
          select: ['id'],
        });
        const ids = existing.map((v) => v.id);
        if (ids.length > 0) {
          await manager.getRepository(VoucherEntry).delete({ voucherId: In(ids) as any });
          await manager.getRepository(Voucher).delete({ id: In(ids) as any });
          replacedVoucherCount = ids.length;
        }
        // 先清掉期间 ledger，后续用“科目余额表”覆盖写入
        const periods = Array.from(periodsSet);
        if (periods.length > 0) {
          await manager.getRepository(Ledger).delete({ tenantId, period: In(periods) as any });
        }
      } else if (mode === 'fail') {
        const existing = await manager.getRepository(Voucher).findOne({
          where: { tenantId, voucherNo: In(voucherNos) as any },
          select: ['id'],
        });
        if (existing) throw new BadRequestException('检测到已存在凭证，导入中止（fail 模式）');
      }

      // 创建/覆盖导入凭证
      for (const [key, rows] of voucherKeyToRows.entries()) {
        const [date, docType, number] = key.split('|');
        const period = date.replaceAll('-', '').slice(0, 6);
        const voucherNo = `${docType}-${number}`;

        // skip 模式：存在则跳过
        if (mode === 'skip') {
          const existed = await manager.getRepository(Voucher).findOne({ where: { tenantId, voucherNo }, select: ['id'] });
          if (existed) continue;
        }

        const voucher = manager.getRepository(Voucher).create({
          tenantId,
          period,
          docType,
          number,
          voucherNo,
          date,
          attachmentsCount: 0,
          sourceType: 'legacy-import',
          sourceId: null,
          status: 'posted',
        });
        const saved = await manager.getRepository(Voucher).save(voucher);

        let debitSum = 0;
        let creditSum = 0;

        for (const r of rows) {
          const subject = subjectByCode.get(r.subjectCode);
          if (!subject) {
            warnings.push(`凭证 ${voucherNo} 分录缺少科目 ${r.subjectCode}（${r.subjectName}），已跳过该行`);
            continue;
          }
          const debit = Number(r.debit) || 0;
          const credit = Number(r.credit) || 0;
          debitSum += debit;
          creditSum += credit;

          let assistantType: string | null = null;
          let assistantId: string | null = null;
          if (r.customerCode && r.customerName) {
            const item = await upsertAssistant('c', r.customerCode, r.customerName);
            assistantType = 'c';
            assistantId = item.id;
          } else if (r.supplierCode && r.supplierName) {
            const item = await upsertAssistant('s', r.supplierCode, r.supplierName);
            assistantType = 's';
            assistantId = item.id;
          }

          const fcurAmount =
            r.fcurCode && (r.debitFcurAmount || r.creditFcurAmount)
              ? Number(r.debitFcurAmount || r.creditFcurAmount)
              : null;

          const entry = manager.getRepository(VoucherEntry).create({
            voucherId: saved.id,
            subjectId: subject.id,
            assistantType,
            assistantId,
            quantity: r.quantity ? Number(r.quantity) : null,
            unit: r.unit || null,
            fcurCode: r.fcurCode || null,
            exchangeRate: r.exchangeRate ? Number(r.exchangeRate) : null,
            fcurAmount: fcurAmount ?? null,
            debit,
            credit,
            summary: r.summary || null,
          });
          await manager.getRepository(VoucherEntry).save(entry);
        }

        if (Math.abs(debitSum - creditSum) > 0.01) {
          warnings.push(`凭证 ${voucherNo} 借贷不平衡（${debitSum} vs ${creditSum}），已按源数据导入`);
        }
      }

      // 用“科目余额表”的期末余额覆盖写入 ledger（仅取无辅助维度的汇总行）
      const ledgerPeriodRows = ledgerRows.filter((r) => !r.assistantType);
      const byPeriod = new Map<string, typeof ledgerPeriodRows>();
      for (const r of ledgerPeriodRows) {
        if (!byPeriod.has(r.period)) byPeriod.set(r.period, []);
        byPeriod.get(r.period)!.push(r);
      }

      for (const [period, rows] of byPeriod.entries()) {
        for (const r of rows) {
          const subject = subjectByCode.get(r.subjectCode);
          if (!subject) continue;

          const debitTotal = Number(r.endingDebit) || 0;
          const creditTotal = Number(r.endingCredit) || 0;

          // 与 updateLedger 的逻辑保持一致
          let balance = 0;
          switch (subject.type) {
            case 'asset':
            case 'expense':
              balance = debitTotal - creditTotal;
              break;
            case 'liability':
            case 'equity':
            case 'income':
              balance = creditTotal - debitTotal;
              break;
            default:
              balance = debitTotal - creditTotal;
          }

          const repo = manager.getRepository(Ledger);
          const existed = await repo.findOne({ where: { tenantId, subjectId: subject.id, period } });
          if (existed) {
            existed.debitTotal = debitTotal;
            existed.creditTotal = creditTotal;
            existed.balance = balance;
            await repo.save(existed);
            ledgerUpdated += 1;
          } else {
            await repo.save(
              repo.create({
                tenantId,
                subjectId: subject.id,
                period,
                debitTotal,
                creditTotal,
                balance,
              }),
            );
            ledgerCreated += 1;
          }
        }
      }
    });

    const periods = Array.from(periodsSet).sort();
    const voucherCount = voucherKeyToRows.size;
    const entryCount = voucherRows.length;

    this.logger.log(`Legacy import done: tenant=${tenantId} vouchers=${voucherCount} entries=${entryCount} file=${fileUsed}`);

    return {
      fileUsed,
      mode,
      periods,
      voucherCount,
      entryCount,
      replacedVoucherCount,
      assistantUpserts: { created: assistantCreated, reused: assistantReused },
      ledgerUpserts: { created: ledgerCreated, updated: ledgerUpdated },
      warnings,
    };
  }
}

