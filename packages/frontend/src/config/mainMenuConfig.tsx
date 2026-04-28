import React from 'react';
import {
  DashboardOutlined,
  BarChartOutlined,
  AccountBookOutlined,
  TeamOutlined,
  UserOutlined,
  MoneyCollectOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';

/**
 * 管理端顶部频道 + 侧边栏菜单配置
 * 修改导航/菜单只需改此文件，不用动布局组件
 */
export type TopChannel = 'home' | 'customer' | 'finance' | 'tax' | 'compliance' | 'settings';

export const topTabs: Array<{ key: TopChannel; label: string; to: string }> = [
  { key: 'home', label: '首页', to: '/dashboard' },
  { key: 'customer', label: '客户', to: '/customer' },
  { key: 'finance', label: '财务', to: '/finance' },
  { key: 'tax', label: '税务', to: '/tax/burden' },
  { key: 'compliance', label: '合规', to: '/compliance/check' },
  { key: 'settings', label: '设置', to: '/settings/users' },
];

export const sideMenuByChannel: Record<TopChannel, any[]> = {
  home: [{ key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' }],
  customer: [{ key: '/customer', icon: <TeamOutlined />, label: '客户管理' }],
  finance: [
    { key: '/finance', icon: <AccountBookOutlined />, label: '财务模块' },
  ],
  tax: [
    { key: '/tax/burden', icon: <BarChartOutlined />, label: '税负分析' },
    { key: '/tax/cash-flow', icon: <MoneyCollectOutlined />, label: '现金流量表' },
  ],
  compliance: [
    { key: '/compliance/check', icon: <SafetyCertificateOutlined />, label: '合规检查' },
  ],
  settings: [
    { key: '/settings/users', icon: <UserOutlined />, label: '登录用户' },
  ],
};

/**
 * 根据路径判断当前频道
 */
export function getChannel(pathname: string): TopChannel {
  if (pathname.startsWith('/customer')) return 'customer';
  if (pathname.startsWith('/finance')) return 'finance';
  if (pathname.startsWith('/tax')) return 'tax';
  if (pathname.startsWith('/compliance')) return 'compliance';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'home';
}

/**
 * 获取频道的默认路径
 */
export function defaultPathForChannel(ch: TopChannel) {
  return topTabs.find(t => t.key === ch)?.to || '/dashboard';
}
