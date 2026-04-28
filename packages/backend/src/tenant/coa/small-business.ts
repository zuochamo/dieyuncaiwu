export type SmallBizCoaItem = {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  direction: 'debit' | 'credit';
  parentCode?: string;
};

/**
 * 小企业会计准则（常用科目表，覆盖凭证与报表场景）
 * - 以“常见/默认可用”为目标，不做行业专用的极端细分
 * - code 为主键进行 upsert
 */
export const SMALL_BIZ_COA: SmallBizCoaItem[] = [
  // ===== 资产 =====
  { code: '1001', name: '库存现金', type: 'asset', direction: 'debit' },
  { code: '1002', name: '银行存款', type: 'asset', direction: 'debit' },
  { code: '1012', name: '其他货币资金', type: 'asset', direction: 'debit' },

  { code: '1101', name: '短期投资', type: 'asset', direction: 'debit' },
  { code: '1121', name: '应收票据', type: 'asset', direction: 'debit' },
  { code: '1122', name: '应收账款', type: 'asset', direction: 'debit' },
  { code: '1123', name: '预付账款', type: 'asset', direction: 'debit' },
  { code: '1131', name: '应收股利', type: 'asset', direction: 'debit' },
  { code: '1132', name: '应收利息', type: 'asset', direction: 'debit' },
  { code: '1221', name: '其他应收款', type: 'asset', direction: 'debit' },
  { code: '1401', name: '材料采购', type: 'asset', direction: 'debit' },
  { code: '1402', name: '在途物资', type: 'asset', direction: 'debit' },
  { code: '1403', name: '原材料', type: 'asset', direction: 'debit' },
  { code: '1404', name: '材料成本差异', type: 'asset', direction: 'debit' },
  { code: '1405', name: '库存商品', type: 'asset', direction: 'debit' },
  { code: '1406', name: '发出商品', type: 'asset', direction: 'debit' },
  { code: '1407', name: '商品进销差价', type: 'asset', direction: 'debit' },
  { code: '1408', name: '委托加工物资', type: 'asset', direction: 'debit' },
  { code: '1411', name: '周转材料', type: 'asset', direction: 'debit' },
  { code: '1461', name: '融资租赁资产', type: 'asset', direction: 'debit' },

  { code: '1501', name: '长期债券投资', type: 'asset', direction: 'debit' },
  { code: '1511', name: '长期股权投资', type: 'asset', direction: 'debit' },

  { code: '1601', name: '固定资产', type: 'asset', direction: 'debit' },
  { code: '1602', name: '累计折旧', type: 'asset', direction: 'credit' },
  { code: '1604', name: '固定资产清理', type: 'asset', direction: 'debit' },
  { code: '1605', name: '在建工程', type: 'asset', direction: 'debit' },
  { code: '1606', name: '工程物资', type: 'asset', direction: 'debit' },

  { code: '1701', name: '无形资产', type: 'asset', direction: 'debit' },
  { code: '1702', name: '累计摊销', type: 'asset', direction: 'credit' },
  { code: '1801', name: '长期待摊费用', type: 'asset', direction: 'debit' },

  { code: '1901', name: '待处理财产损溢', type: 'asset', direction: 'debit' },

  // ===== 负债 =====
  { code: '2001', name: '短期借款', type: 'liability', direction: 'credit' },
  { code: '2101', name: '应付票据', type: 'liability', direction: 'credit' },
  { code: '2201', name: '应付账款', type: 'liability', direction: 'credit' },
  { code: '2202', name: '预收账款', type: 'liability', direction: 'credit' },
  { code: '2211', name: '应付职工薪酬', type: 'liability', direction: 'credit' },

  { code: '2221', name: '应交税费', type: 'liability', direction: 'credit' },
  { code: '222101', name: '应交税费-进项税额', type: 'asset', direction: 'debit', parentCode: '2221' },
  { code: '222102', name: '应交税费-销项税额', type: 'liability', direction: 'credit', parentCode: '2221' },
  { code: '222103', name: '应交税费-已交税金', type: 'asset', direction: 'debit', parentCode: '2221' },
  { code: '222104', name: '应交税费-未交增值税', type: 'liability', direction: 'credit', parentCode: '2221' },
  { code: '222105', name: '应交税费-应交增值税', type: 'liability', direction: 'credit', parentCode: '2221' },
  { code: '222106', name: '应交税费-应交企业所得税', type: 'liability', direction: 'credit', parentCode: '2221' },

  { code: '2231', name: '应付利息', type: 'liability', direction: 'credit' },
  { code: '2232', name: '应付利润', type: 'liability', direction: 'credit' },
  { code: '2241', name: '其他应付款', type: 'liability', direction: 'credit' },
  { code: '2501', name: '长期借款', type: 'liability', direction: 'credit' },
  { code: '2701', name: '长期应付款', type: 'liability', direction: 'credit' },
  { code: '2801', name: '递延收益', type: 'liability', direction: 'credit' },

  // ===== 所有者权益 =====
  { code: '4001', name: '实收资本', type: 'equity', direction: 'credit' },
  { code: '4002', name: '资本公积', type: 'equity', direction: 'credit' },
  { code: '4101', name: '盈余公积', type: 'equity', direction: 'credit' },
  { code: '4103', name: '本年利润', type: 'equity', direction: 'credit' },
  { code: '4104', name: '利润分配', type: 'equity', direction: 'credit' },

  // ===== 成本 =====
  { code: '5001', name: '生产成本', type: 'expense', direction: 'debit' },
  { code: '5101', name: '制造费用', type: 'expense', direction: 'debit' },
  { code: '5201', name: '劳务成本', type: 'expense', direction: 'debit' },

  // ===== 损益（收入）=====
  { code: '6001', name: '主营业务收入', type: 'income', direction: 'credit' },
  { code: '6051', name: '其他业务收入', type: 'income', direction: 'credit' },
  { code: '6101', name: '公允价值变动收益', type: 'income', direction: 'credit' },
  { code: '6111', name: '投资收益', type: 'income', direction: 'credit' },
  { code: '6301', name: '营业外收入', type: 'income', direction: 'credit' },

  // ===== 损益（成本/费用）=====
  { code: '6401', name: '主营业务成本', type: 'expense', direction: 'debit' },
  { code: '6402', name: '其他业务成本', type: 'expense', direction: 'debit' },
  { code: '6403', name: '营业税金及附加', type: 'expense', direction: 'debit' },
  { code: '6601', name: '销售费用', type: 'expense', direction: 'debit' },
  { code: '6602', name: '管理费用', type: 'expense', direction: 'debit' },
  { code: '6603', name: '财务费用', type: 'expense', direction: 'debit' },
  { code: '6701', name: '资产减值损失', type: 'expense', direction: 'debit' },
  { code: '6801', name: '所得税费用', type: 'expense', direction: 'debit' },
  { code: '6901', name: '以前年度损益调整', type: 'expense', direction: 'debit' },
  { code: '6711', name: '营业外支出', type: 'expense', direction: 'debit' },
];

