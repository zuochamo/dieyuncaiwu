/**
 * 标签页配置
 * 新增路由页面时，在此处添加标签页标题即可
 */
export interface TabItem {
  key: string;
  title: string;
  closable?: boolean;
}

export const tabConfig: Record<string, { title: string; closable?: boolean }> = {
  '/home': { title: '账套首页', closable: false },
  '/voucher': { title: '凭证列表' },
  '/voucher/create': { title: '凭证录入' },
  '/voucher/search': { title: '凭证查找' },
  '/invoice': { title: '发票管理' },
  '/inventory': { title: '库存管理' },
  '/asset': { title: '固定资产' },
  '/report/balance-sheet': { title: '资产负债表' },
  '/report/income': { title: '利润表' },
  '/report/cash-flow': { title: '现金流量表' },
  '/settings/subject-balance': { title: '科目与期初' },
  '/settings/assistant': { title: '辅助设置' },
  '/settings/legacy-import': { title: '旧账迁入' },
};
