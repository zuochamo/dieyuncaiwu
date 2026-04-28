/**
 * 报表相关类型定义
 */

/** 资产负债表行（叠云格式） */
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
  totalLine: boolean;
}

/** 资产负债表行对（左资产/右负债） */
export interface DzBalanceSheetPairRow {
  key: string;
  left?: DzBalanceSheetRow;
  right?: DzBalanceSheetRow;
}

/** 利润表数据 */
export interface IncomeData {
  period: string;
  revenue: { code: string; name: string; balance: number }[];
  expenses: { code: string; name: string; balance: number }[];
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

/** 现金流量表行 */
export interface CashFlowRow {
  name: string;
  code?: string;
  amount: number;
}

/** 现金流量表数据 */
export interface CashFlowData {
  period: string;
  operating: { items: CashFlowRow[]; subtotal: number };
  investing: { items: CashFlowRow[]; subtotal: number };
  financing: { items: CashFlowRow[]; subtotal: number };
  netIncrease: number;
  beginningBalance: number;
  endingBalance: number;
}

/** 税负分析数据 */
export interface TaxBurdenData {
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

/** 合规检查问题 */
export interface ComplianceIssue {
  voucherId: string;
  voucherNo: string;
  type: string;
  severity: 'error' | 'warning';
  description: string;
  detail?: string;
}

/** 合规检查数据 */
export interface ComplianceData {
  period: string;
  totalVouchers: number;
  checkedVouchers: number;
  passCount: number;
  issues: ComplianceIssue[];
  score: number;
}

/** Dashboard 统计数据 */
export interface DashboardData {
  totalVouchers: number;
  postedVouchers: number;
  draftVouchers: number;
  totalInvoices: number;
  pendingInvoices: number;
  processedInvoices: number;
  latestVoucherDate: string | null;
}
