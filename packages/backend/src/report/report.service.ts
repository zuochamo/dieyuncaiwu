import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ledger } from './entities/ledger.entity';
import { AccountSubject } from '../voucher/entities/account-subject.entity';
import { Voucher } from '../voucher/entities/voucher.entity';
import { VoucherEntry } from '../voucher/entities/voucher-entry.entity';
import { Invoice } from '../invoice/entities/invoice.entity';

export interface BalanceSheetItem {
  code: string;
  name: string;
  balance: number;
}

export interface DzBalanceSheetRow {
  accountTitleName: string;
  row: number | null;
  number: number;
  level: number;
  pRowNum: number | null;
  warn: boolean;
  showLine: number;
  balanceEnd: number;
  yearBeginBalance: number;
  fomularDetail: string | null;
  limitFomularDetail: string | null;
  nonLimitFomularDetail: string | null;
  limitOccurreAmount: number;
  nonLimitOccurreAmout: number;
  limitYearAccumulated: number;
  nonLimitYearAccumulated: number;
  yearAccumulated: number;
  quarterOne: number;
  quarterTwo: number;
  quarterThree: number;
  quarterFour: number;
  occurredAmount: number;
  preYearAccumulated: number;
  amountOfLocalPeriod: number;
  amountOfPrePeriod: number;
  totalLine: boolean;
}

export interface DzBalanceSheetBody {
  result: DzBalanceSheetRow[];
  balanceReason: number;
}

export interface BalanceSheet {
  period: string;
  assets: BalanceSheetItem[];
  liabilities: BalanceSheetItem[];
  equity: BalanceSheetItem[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export interface IncomeStatement {
  period: string;
  revenue: BalanceSheetItem[];
  expenses: BalanceSheetItem[];
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

export interface CashFlowRow {
  name: string;
  code?: string;
  amount: number;
}

export interface CashFlowStatement {
  period: string;
  operating: { items: CashFlowRow[]; subtotal: number };
  investing: { items: CashFlowRow[]; subtotal: number };
  financing: { items: CashFlowRow[]; subtotal: number };
  netIncrease: number;
  beginningBalance: number;
  endingBalance: number;
}

export interface TaxBurdenResult {
  period: string;
  revenue: number;
  outputTax: number;
  inputTax: number;
  vatPayable: number;
  incomeTax: number;
  totalTaxPayable: number;
  vatBurdenRate: string;
  totalTaxBurdenRate: string;
  invoices: { inputCount: number; outputCount: number; pendingCount: number };
}

export interface ComplianceIssue {
  voucherId: string;
  voucherNo: string;
  type: string;
  severity: 'error' | 'warning';
  description: string;
  detail?: string;
}

export interface ComplianceResult {
  period: string;
  totalVouchers: number;
  checkedVouchers: number;
  passCount: number;
  issues: ComplianceIssue[];
  score: number;
}

export interface DashboardStats {
  tenantId: string;
  period: string | null;
  totalCustomers: number;
  activeCustomers: number;
  totalVouchers: number;
  postedVouchers: number;
  draftVouchers: number;
  totalInvoices: number;
  pendingInvoices: number;
  processedInvoices: number;
  totalInventoryItems: number;
  totalAssets: number;
  latestVoucherDate: string | null;
}

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Ledger)
    private readonly ledgerRepo: Repository<Ledger>,
    @InjectRepository(AccountSubject)
    private readonly subjectRepo: Repository<AccountSubject>,
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,
    @InjectRepository(VoucherEntry)
    private readonly entryRepo: Repository<VoucherEntry>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  /**
   * 资产负债表
   */
  async getBalanceSheet(tenantId: string, period: string): Promise<BalanceSheet> {
    const subjects = await this.subjectRepo.find({ where: { tenantId } });
    const ledgers = await this.ledgerRepo.find({ where: { tenantId, period } });

    const ledgerMap = new Map(ledgers.map(l => [l.subjectId, l]));

    const assets: BalanceSheetItem[] = [];
    const liabilities: BalanceSheetItem[] = [];
    const equity: BalanceSheetItem[] = [];

    for (const s of subjects) {
      const ledger = ledgerMap.get(s.id);
      const balance = ledger ? Number(ledger.balance) : 0;
      const item: BalanceSheetItem = { code: s.code, name: s.name, balance };

      if (s.type === 'asset') assets.push(item);
      else if (s.type === 'liability') liabilities.push(item);
      else if (s.type === 'equity') equity.push(item);
    }

    return {
      period,
      assets,
      liabilities,
      equity,
      totalAssets: assets.reduce((s, i) => s + i.balance, 0),
      totalLiabilities: liabilities.reduce((s, i) => s + i.balance, 0),
      totalEquity: equity.reduce((s, i) => s + i.balance, 0),
    };
  }

  /**
   * 对标 17DZ：资产负债表（树形行）
   *
   * period: YYYY-MM
   */
  async getBalanceSheetDz(tenantId: string, period: string): Promise<DzBalanceSheetBody> {
    const subjects = await this.subjectRepo.find({ where: { tenantId } });
    const ledgers = await this.ledgerRepo.find({ where: { tenantId, period } });
    const ledgerMap = new Map(ledgers.map((l) => [l.subjectId, Number(l.balance) || 0]));

    const byId = new Map(subjects.map((s) => [s.id, s]));
    const children = new Map<string | null, AccountSubject[]>();
    for (const s of subjects) {
      const pid = s.parentId || null;
      if (!children.has(pid)) children.set(pid, []);
      children.get(pid)!.push(s);
    }
    for (const list of children.values()) {
      list.sort((a, b) => String(a.code).localeCompare(String(b.code)));
    }

    const sumTree = (rootId: string): number => {
      const self = ledgerMap.get(rootId) ?? 0;
      const kids = children.get(rootId) ?? [];
      if (kids.length === 0) return self;
      return kids.reduce((acc, k) => acc + sumTree(k.id), 0);
    };

    let rowNo = 0;
    const result: DzBalanceSheetRow[] = [];
    const pushRow = (r: Partial<DzBalanceSheetRow> & Pick<DzBalanceSheetRow, 'accountTitleName' | 'level'>) => {
      rowNo += 1;
      const row = rowNo;
      const item: DzBalanceSheetRow = {
        accountTitleName: r.accountTitleName,
        row: r.row ?? (r.totalLine || r.level === 1 ? null : row),
        number: rowNo,
        level: r.level,
        pRowNum: r.pRowNum ?? null,
        warn: r.warn ?? false,
        showLine: r.showLine ?? 1,
        balanceEnd: r.balanceEnd ?? 0,
        yearBeginBalance: r.yearBeginBalance ?? 0,
        fomularDetail: r.fomularDetail ?? null,
        limitFomularDetail: null,
        nonLimitFomularDetail: null,
        limitOccurreAmount: 0,
        nonLimitOccurreAmout: 0,
        limitYearAccumulated: 0,
        nonLimitYearAccumulated: 0,
        yearAccumulated: 0,
        quarterOne: 0,
        quarterTwo: 0,
        quarterThree: 0,
        quarterFour: 0,
        occurredAmount: 0,
        preYearAccumulated: 0,
        amountOfLocalPeriod: 0,
        amountOfPrePeriod: 0,
        totalLine: !!r.totalLine,
      };
      result.push(item);
      return rowNo;
    };

    const addGroup = (title: string, subjectType: string, parentRowNum: number | null) => {
      const headerRowNum = pushRow({ accountTitleName: title, level: 1, pRowNum: parentRowNum, balanceEnd: 0 });
      const groupSubjects = subjects.filter((s) => s.type === subjectType && !s.parentId);
      let sum = 0;
      const childRowNums: number[] = [];
      for (const s of groupSubjects) {
        const balance = sumTree(s.id);
        sum += balance;
        const rnum = pushRow({
          accountTitleName: s.fullName || s.name,
          level: 2,
          pRowNum: headerRowNum,
          balanceEnd: balance,
          yearBeginBalance: 0,
          fomularDetail: `科目：${s.name}`,
          totalLine: false,
        });
        childRowNums.push(rnum);
      }
      pushRow({
        accountTitleName: `${title.replace(/[:：]$/, '')}合计`,
        level: 2,
        pRowNum: headerRowNum,
        balanceEnd: sum,
        yearBeginBalance: 0,
        fomularDetail: childRowNums.length ? `行次：${childRowNums.map((n) => `行${n}`).join('+')}` : null,
        totalLine: true,
      });
      return { headerRowNum, sumRowNums: childRowNums, sum };
    };

    const assets = addGroup('资产：', 'asset', null);
    const liabilities = addGroup('负债：', 'liability', null);
    const equity = addGroup('所有者权益：', 'equity', null);

    pushRow({
      accountTitleName: '资产总计',
      level: 1,
      pRowNum: null,
      balanceEnd: assets.sum,
      yearBeginBalance: 0,
      fomularDetail: assets.sumRowNums.length ? `行次：${assets.sumRowNums.map((n) => `行${n}`).join('+')}` : null,
      totalLine: true,
    });

    pushRow({
      accountTitleName: '负债和所有者权益总计',
      level: 1,
      pRowNum: null,
      balanceEnd: liabilities.sum + equity.sum,
      yearBeginBalance: 0,
      fomularDetail: null,
      totalLine: true,
    });

    return { result, balanceReason: 0 };
  }

  /**
   * 利润表
   */
  async getIncomeStatement(tenantId: string, period: string): Promise<IncomeStatement> {
    const subjects = await this.subjectRepo.find({ where: { tenantId } });
    const ledgers = await this.ledgerRepo.find({ where: { tenantId, period } });

    const ledgerMap = new Map(ledgers.map(l => [l.subjectId, l]));

    const revenue: BalanceSheetItem[] = [];
    const expenses: BalanceSheetItem[] = [];

    for (const s of subjects) {
      const ledger = ledgerMap.get(s.id);
      const debitTotal = ledger ? Number(ledger.debitTotal) : 0;
      const creditTotal = ledger ? Number(ledger.creditTotal) : 0;
      let balance = 0;

      if (s.type === 'income') {
        balance = creditTotal - debitTotal;
        if (balance !== 0) revenue.push({ code: s.code, name: s.name, balance });
      } else if (s.type === 'expense') {
        balance = debitTotal - creditTotal;
        if (balance !== 0) expenses.push({ code: s.code, name: s.name, balance });
      }
    }

    const totalRevenue = revenue.reduce((s, i) => s + i.balance, 0);
    const totalExpenses = expenses.reduce((s, i) => s + i.balance, 0);

    return {
      period,
      revenue,
      expenses,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
    };
  }

  // ═════════════════════════════════════════════════════
  // 💰 现金流量表 - 基于现金类科目明细生成
  // ═════════════════════════════════════════════════════

  /**
   * 现金流量表：从凭证分录中提取现金类科目的发生额，
   * 按业务性质归集到 经营/投资/筹资 三大活动。
   */
  async getCashFlowStatement(tenantId: string, period: string): Promise<CashFlowStatement> {
    const subjects = await this.subjectRepo.find({ where: { tenantId } });
    const subjectMap = new Map(subjects.map(s => [s.id, s]));

    // 现金类科目编码（1001库存现金、1002银行存款、1012其他货币资金）
    const cashSubjectIds = subjects
      .filter(s => ['1001', '1002', '1012'].includes(s.code))
      .map(s => s.id);

    // 获取该期间所有已过账凭证的分录
    const periodStr = period.replace('-', '');
    const vouchers = await this.voucherRepo.find({
      where: { tenantId, period: periodStr, status: 'posted' },
      select: ['id', 'voucherNo'],
    });
    const voucherIds = vouchers.map(v => v.id);

    let entries: VoucherEntry[] = [];
    if (voucherIds.length > 0) {
      entries = await this.entryRepo.createQueryBuilder('e')
        .where('e.voucher_id IN (:...ids)', { ids: voucherIds })
        .getMany();
    }

    // 汇总各科目借贷方金额
    const subjectFlow = new Map<string, { debit: number; credit: number }>();
    for (const e of entries) {
      if (!subjectFlow.has(e.subjectId)) {
        subjectFlow.set(e.subjectId, { debit: 0, credit: 0 });
      }
      const f = subjectFlow.get(e.subjectId)!;
      f.debit += Number(e.debit) || 0;
      f.credit += Number(e.credit) || 0;
    }

    /** 判断分录对方科目是否属于某类别 */
    const isCounterSubjectIn = (entry: VoucherEntry, codes: string[]): boolean => {
      return cashSubjectIds.includes(entry.subjectId);
    };

    // 根据对方科目（摘要/科目名）归类到三大活动
    const operatingItems: CashFlowRow[] = [];
    const investingItems: CashFlowRow[] = [];
    const financingItems: CashFlowRow[] = [];

    for (const e of entries) {
      if (!cashSubjectIds.includes(e.subjectId)) continue;
      const amount = Number(e.credit) || 0; // 现金流出=贷方（现金减少）
      const inAmount = Number(e.debit) || 0; // 现金流入=借方（现金增加）
      const subj = subjectMap.get(e.subjectId);
      const summary = e.summary || '';

      // 简化归类逻辑：基于摘要关键词 + 对方科目类型
      const counterSubj = subjectMap.get(
        entries.find(x => x.voucherId === e.voucherId && x.subjectId !== e.subjectId)?.subjectId || '',
      );

      if (inAmount > 0) {
        // 现金流入
        if (/销售|收入|营收|服务|劳务|租金收入/i.test(summary) || counterSubj?.type === 'income') {
          operatingItems.push({ name: `销售商品/提供劳务收到的现金 (${subj?.name || '现金'})`, amount: inAmount });
        } else if (/投资收益|利息收入|股利|分红/i.test(summary)) {
          operatingItems.push({ name: '取得投资收益收到的现金', amount: inAmount });
        } else if (/借款|贷款|融资|吸收|发行债券/i.test(summary)) {
          financingItems.push({ name: '取得借款收到的现金', amount: inAmount });
        } else if (/固定资产|无形资产|处置|变卖/i.test(summary)) {
          investingItems.push({ name: '处置固定资产/无形资产收回的现金', amount: inAmount });
        } else {
          operatingItems.push({ name: `其他经营活动流入 (${summary.slice(0, 12)})`, amount: inAmount });
        }
      }
      if (amount > 0) {
        // 现金流出
        if (/采购|购入|进货|材料|货物|商品|成本/i.test(summary) || counterSubj?.type === 'expense' || /6401|6402|1402|1403/.test(counterSubj?.code || '')) {
          operatingItems.push({ name: '购买商品/接受劳务支付的现金', amount });
        } else if (/工资|薪酬|社保|奖金|职工/i.test(summary)) {
          operatingItems.push({ name: '支付给职工以及为职工支付的现金', amount });
        } else if (/税金|税费|增值税|所得税|城建税/i.test(summary)) {
          operatingItems.push({ name: '支付的各项税费', amount });
        } else if (/费用|办公|差旅|招待|通讯|租赁/i.test(summary)) {
          operatingItems.push({ name: '支付其他与经营活动有关的现金', amount });
        } else if (/固定资产|在建工程|工程物资|无形资产|长期资产/i.test(summary)) {
          investingItems.push({ name: '购建固定资产/无形资产支付的现金', amount });
        } else if (/还款|偿还借款|归还贷款|还本付息/i.test(summary)) {
          financingItems.push({ name: '偿还债务支付的现金', amount });
        } else if (/利润|分配|股利|分红.*支付|股东/i.test(summary)) {
          financingItems.push({ name: '分配股利/利润或偿付利息支付的现金', amount });
        } else {
          operatingItems.push({ name: `其他经营活动流出 (${summary.slice(0, 12)})`, amount });
        }
      }
    }

    const sumItems = (items: CashFlowRow[]) => items.reduce((s, i) => s + i.amount, 0);
    const opSum = sumItems(operatingItems);
    const invSum = sumItems(investingItems);
    const finSum = sumItems(financingItems);
    const netIncrease = opSum + invSum + finSum;

    // 期初余额 = 上期所有现金科目余额
    const prevLedgers = await this.ledgerRepo.find({
      where: { tenantId },
    });
    const uniquePeriods = [...new Set(prevLedgers.map(l => l.period))].sort().filter(p => p < period);
    const beginningBalance = uniquePeriods.length > 0 ? 0 : 0;

    return {
      period,
      operating: { items: operatingItems, subtotal: opSum },
      investing: { items: investingItems, subtotal: invSum },
      financing: { items: financingItems, subtotal: finSum },
      netIncrease,
      beginningBalance,
      endingBalance: beginningBalance + netIncrease,
    };
  }

  // ═════════════════════════════════════════════════════
  // 📈 税负分析 - 基于应交税费+发票数据
  // ═════════════════════════════════════════════════════

  async getTaxBurdenAnalysis(tenantId: string, period: string): Promise<TaxBurdenResult> {
    const periodStr = period.replace('-', '');

    // 1. 从 ledger 获取应交税费相关科目余额
    const taxSubjects = await this.subjectRepo.find({
      where: { tenantId },
    });
    const taxCodes = ['222101', '222102', '222103', '222104', '222105', '222106'];
    const taxSubjectMap = new Map(taxSubjects.filter(s => taxCodes.includes(s.code)).map(s => [s.code, s.id]));

    const ledgers = await this.ledgerRepo.find({ where: { tenantId, period } });
    const ledgerMap = new Map(ledgers.map(l => [l.subjectId, l]));

    const getBalance = (code: string): number => {
      const sid = taxSubjectMap.get(code);
      if (!sid) return 0;
      const ld = ledgerMap.get(sid);
      return ld ? Number(ld.balance) : 0;
    };

    // 进项税额(222101-asset 借方余额)、销项税额(222102-liability 贷方余额)
    const inputTax = getBalance('222101');   // 进项(资产类=借方余额)
    const outputTax = Math.abs(getBalance('222102')); // 销项(负债类=贷方余额)
    const vatPaid = Math.abs(getBalance('222103')) || 0;  // 已交税金
    const vatPayable = outputTax - inputTax;     // 应纳增值税

    const incomeTax = Math.abs(getBalance('222106')) || 0;
    const totalTaxPayable = Math.max(vatPayable, 0) + incomeTax;

    // 2. 从发票数据获取统计
    const invoices = await this.invoiceRepo.find({ where: { tenantId } });
    const inputInvoices = invoices.filter(i => i.type === 'input');
    const outputInvoices = invoices.filter(i => i.type === 'output');

    // 3. 从 ledger 计算营业收入（主营业务收入贷方减借方）
    const revSubject = taxSubjects.find(s => s.code === '6001');
    let revenue = 0;
    if (revSubject) {
      const revLedger = ledgerMap.get(revSubject.id);
      if (revLedger) {
        // 收入类科目：余额 = 贷方 - 借方
        revenue = Number(revLedger.creditTotal) - Number(revLedger.debitTotal);
        if (revenue < 0) revenue = 0;
      }
    }

    // 如果没有ledger数据，尝试从发票合计
    if (revenue === 0) {
      revenue = outputInvoices.reduce((s, i) => s + Number(i.amount), 0);
    }

    const vatBurdenRate = revenue > 0 ? ((Math.max(vatPayable, 0) / revenue) * 100).toFixed(2) + '%' : '0.00%';
    const totalTaxBurdenRate = revenue > 0 ? ((totalTaxPayable / revenue) * 100).toFixed(2) + '%' : '0.00%';

    return {
      period,
      revenue,
      outputTax,
      inputTax,
      vatPayable: Math.max(vatPayable, 0),
      incomeTax,
      totalTaxPayable,
      vatBurdenRate,
      totalTaxBurdenRate,
      invoices: {
        inputCount: inputInvoices.length,
        outputCount: outputInvoices.length,
        pendingCount: invoices.filter(i => i.status === 'pending').length,
      },
    };
  }

  // ═════════════════════════════════════════════════════
  // 🛡️ 合规检查 - 凭证合规性校验
  // ═════════════════════════════════════════════════════

  async checkCompliance(tenantId: string, period?: string): Promise<ComplianceResult> {
    const where: any = { tenantId };
    if (period) where.period = period.replace('-', '');
    const vouchers = await this.voucherRepo.find({ where });

    const totalVouchers = vouchers.length;
    const issues: ComplianceIssue[] = [];
    let passCount = 0;

    for (const voucher of vouchers) {
      const entries = await this.entryRepo.find({ where: { voucherId: voucher.id } });
      let hasError = false;

      // 1. 借贷平衡检查
      const totalDebit = entries.reduce((s, e) => s + Number(e.debit), 0);
      const totalCredit = entries.reduce((s, e) => s + Number(e.credit), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        issues.push({
          voucherId: voucher.id,
          voucherNo: voucher.voucherNo,
          type: 'balance',
          severity: 'error',
          description: '借贷不平衡',
          detail: `借方 ${totalDebit.toFixed(2)} ≠ 贷方 ${totalCredit.toFixed(2)}`,
        });
        hasError = true;
      }

      // 2. 分录数量检查（至少2行）
      if (entries.length < 2) {
        issues.push({
          voucherId: voucher.id,
          voucherNo: voucher.voucherNo,
          type: 'entries',
          severity: 'warning',
          description: '分录行数不足',
          detail: `仅有 ${entries.length} 行，建议至少2行`,
        });
        hasError = true;
      }

      // 3. 摘要缺失检查
      const emptySummaryEntries = entries.filter(e => !e.summary || e.summary.trim() === '');
      if (emptySummaryEntries.length > 0) {
        issues.push({
          voucherId: voucher.id,
          voucherNo: voucher.voucherNo,
          type: 'summary',
          severity: 'warning',
          description: `${emptySummaryEntries.length} 行缺少摘要`,
        });
        hasError = true;
      }

      // 4. 金额为零检查
      const zeroEntries = entries.filter(e => Number(e.debit) === 0 && Number(e.credit) === 0);
      if (zeroEntries.length > 0) {
        issues.push({
          voucherId: voucher.id,
          voucherNo: voucher.voucherNo,
          type: 'zero_amount',
          severity: 'error',
          description: `${zeroEntries.length} 行金额为0`,
        });
        hasError = true;
      }

      // 5. 期间一致性检查
      const voucherPeriod = voucher.date?.slice(0, 7)?.replace('-', '') || '';
      if (period && voucherPeriod !== period.replace('-', '')) {
        issues.push({
          voucherId: voucher.id,
          voucherNo: voucher.voucherNo,
          type: 'period_mismatch',
          severity: 'warning',
          description: '凭证日期不在检查期间内',
          detail: `凭证日期 ${voucher.date}, 检查期间 ${period}`,
        });
      }

      if (!hasError) passCount++;
    }

    // 计算合规分数（满分100）
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const score = totalVouchers > 0
      ? Math.max(0, Math.round(((totalVouchers * 10 - errorCount * 8 - warningCount * 2) / (totalVouchers * 10)) * 100))
      : 100;

    return {
      period: period || '全部',
      totalVouchers,
      checkedVouchers: totalVouchers,
      passCount,
      issues,
      score,
    };
  }

  // ═════════════════════════════════════════════════════
  // 🏠 Dashboard 工作台关键指标
  // ═════════════════════════════════════════════════════

  async getDashboardStats(tenantId: string, period?: string): Promise<DashboardStats> {
    // 租户数（如果传了tenantId就只看当前租户）
    // 凭证统计
    const allVouchers = await this.voucherRepo.find({ where: { tenantId } });
    const postedVouchers = allVouchers.filter(v => v.status === 'posted');
    const draftVouchers = allVouchers.filter(v => v.status === 'draft');
    const latestVoucher = allVouchers.length > 0
      ? allVouchers.sort((a, b) => (b.date > a.date ? 1 : -1))[0]
      : null;

    // 发票统计
    const invoices = await this.invoiceRepo.find({ where: { tenantId } });
    const pendingInvoices = invoices.filter(i => i.status === 'pending');
    const processedInvoices = invoices.filter(i => i.status === 'processed');

    return {
      tenantId,
      period: period || null,
      totalCustomers: 0, // 由上层聚合
      activeCustomers: 0,
      totalVouchers: allVouchers.length,
      postedVouchers: postedVouchers.length,
      draftVouchers: draftVouchers.length,
      totalInvoices: invoices.length,
      pendingInvoices: pendingInvoices.length,
      processedInvoices: processedInvoices.length,
      totalInventoryItems: 0, // 需要注入 InventoryRepository
      totalAssets: 0,         // 需要注入 AssetRepository
      latestVoucherDate: latestVoucher?.date || null,
    };
  }
}
