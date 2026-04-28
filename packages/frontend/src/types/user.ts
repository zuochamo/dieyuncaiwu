/**
 * 用户相关类型定义
 */

/** 用户 */
export interface UserItem {
  id: string;
  username: string;
  displayName: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 认证用户（登录态） */
export interface AuthUser {
  id?: string;
  username: string;
  displayName?: string;
  role?: string;
}
