/**
 * 发票相关类型定义
 */

/** 发票 */
export interface Invoice {
  id: string;
  type: string;
  date: string;
  amount: number;
  tax: number;
  customerName: string;
  status: string;
}
