import React from 'react';
import {
  FileTextOutlined,
  InboxOutlined,
  BankOutlined,
  BarChartOutlined,
  SettingOutlined,
  BookOutlined,
  ContainerOutlined,
  SearchOutlined,
  AppstoreOutlined,
  FileDoneOutlined,
  UploadOutlined,
} from '@ant-design/icons';

/**
 * 账套端侧边栏菜单配置
 * 修改菜单只需改此文件，不用动布局组件
 */
export const sideMenuItems = [
  {
    key: '/home',
    icon: <FileTextOutlined />,
    label: '账套首页',
  },
  {
    key: '/voucher',
    icon: <FileTextOutlined />,
    label: '凭证管理',
    children: [
      { key: '/voucher', label: '凭证列表', icon: <ContainerOutlined /> },
      { key: '/voucher/create', label: '凭证录入', icon: <FileTextOutlined /> },
      { key: '/voucher/search', label: '凭证查找', icon: <SearchOutlined /> },
    ],
  },
  {
    key: '/invoice',
    icon: <FileDoneOutlined />,
    label: '发票管理',
    children: [
      { key: '/invoice', label: '发票列表', icon: <FileDoneOutlined /> },
    ],
  },
  { key: '/inventory', icon: <InboxOutlined />, label: '库存管理' },
  { key: '/asset', icon: <BankOutlined />, label: '固定资产' },
  {
    key: '/report',
    icon: <BarChartOutlined />,
    label: '报表',
    children: [
      { key: '/report/balance-sheet', label: '资产负债表' },
      { key: '/report/income', label: '利润表' },
      { key: '/report/cash-flow', label: '现金流量表' },
    ],
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '财务设置',
    children: [
      { key: '/settings/subject-balance', label: '科目与期初', icon: <BookOutlined /> },
      { key: '/settings/assistant', label: '辅助设置', icon: <AppstoreOutlined /> },
      { key: '/settings/legacy-import', label: '旧账迁入', icon: <UploadOutlined /> },
    ],
  },
];

/**
 * 默认展开的菜单组
 */
export const defaultOpenKeys = ['/report', '/voucher', '/settings', '/invoice'];
