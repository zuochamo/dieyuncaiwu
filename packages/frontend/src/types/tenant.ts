/**
 * 租户/客户相关类型定义
 */

/** 客户（租户） */
export interface Customer {
  id: string;
  name: string;
  industryType?: string;
  startPeriod?: string;
  status?: string;
  createdAt?: string;
  deletedAt?: string;
}

/** 租户上下文中的活跃租户 */
export interface ActiveTenant {
  id: string;
  name: string;
  status?: string;
}
