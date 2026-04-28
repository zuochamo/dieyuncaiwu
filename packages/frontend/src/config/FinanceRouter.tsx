import React from 'react';
import FinanceHome from '../pages/finance/FinanceHome';
import VoucherList from '../pages/voucher/VoucherList';
import VoucherCreate from '../pages/voucher/VoucherCreate';
import VoucherDetail from '../pages/voucher/VoucherDetail';
import VoucherSearch from '../pages/voucher/VoucherSearch';
import InvoiceList from '../pages/invoice/InvoiceList';
import InventoryList from '../pages/inventory/InventoryList';
import AssetList from '../pages/asset/AssetList';
import ReportBalanceSheet from '../pages/report/ReportBalanceSheet';
import ReportIncome from '../pages/report/ReportIncome';
import ReportCashFlow from '../pages/report/ReportCashFlow';
import SubjectBalance from '../pages/settings/SubjectBalance';
import AssistantConfig from '../pages/settings/AssistantConfig';
import LegacyImport from '../pages/settings/LegacyImport';

/**
 * 路由 → 组件映射
 * 新增页面时在此处添加 case，以及 financeMenuConfig / financeTabConfig
 */
const FinanceRouter: React.FC<{ pathname: string }> = ({ pathname }) => {
  switch (pathname) {
    case '/home':
      return <FinanceHome />;
    case '/voucher':
      return <VoucherList />;
    case '/voucher/create':
      return <VoucherCreate />;
    case '/voucher/search':
      return <VoucherSearch />;
    case '/invoice':
      return <InvoiceList />;
    case '/inventory':
      return <InventoryList />;
    case '/asset':
      return <AssetList />;
    case '/report/balance-sheet':
      return <ReportBalanceSheet />;
    case '/report/income':
      return <ReportIncome />;
    case '/report/cash-flow':
      return <ReportCashFlow />;
    case '/settings/subject-balance':
      return <SubjectBalance />;
    case '/settings/assistant':
      return <AssistantConfig />;
    case '/settings/legacy-import':
      return <LegacyImport />;
    default:
      // /voucher/edit/:id 动态路由（复用录入界面）
      if (pathname.startsWith('/voucher/edit/')) {
        return <VoucherCreate />;
      }
      // /voucher/:id 等动态路由
      if (pathname.startsWith('/voucher/')) {
        return <VoucherDetail />;
      }
      return <VoucherList />;
  }
};

export default FinanceRouter;
