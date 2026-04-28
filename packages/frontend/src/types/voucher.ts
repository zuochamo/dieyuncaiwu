/**
 * 凭证相关类型定义
 */

/** 凭证主表 */
export interface Voucher {
  id: string;
  voucherNo: string;
  docType?: string;
  number?: string;
  tenantId: string;
  period?: string;
  attachmentsCount?: number;
  date: string;
  sourceType: string;
  status: string;
  sourceId?: string | null;
}

/** 凭证分录 */
export interface VoucherEntry {
  id: string;
  voucherId: string;
  subjectId: string;
  assistantType?: string | null;
  assistantId?: string | null;
  quantity?: number | null;
  unit?: string | null;
  fcurCode?: string | null;
  exchangeRate?: number | null;
  fcurAmount?: number | null;
  summary?: string;
  debit: string | number;
  credit: string | number;
}

/** 会计科目 */
export interface AccountTitle {
  id: string;
  code: string;
  name: string;
  fullName: string;
  direction: 1 | -1;
  level: number;
  last: boolean;
  useAssistant: boolean;
  assistantType?: string;
  auxiliaryTypes?: string[];
  useAuxiliary: boolean;
  useQuantity: boolean;
  unit?: string | null;
  useFcur: boolean;
  fcurCode?: string | null;
  pinYinInitial?: string;
}

/** 辅助核算项 */
export interface AssistantItem {
  id: number;
  code: string;
  name: string;
  pinYinInitial?: string;
  unit?: string | null;
  categoryFullName?: string | null;
  licenseNumber?: string | null;
  inventoryType?: string | null;
}
