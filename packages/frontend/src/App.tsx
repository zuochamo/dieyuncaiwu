import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import CustomerList from './pages/customer/CustomerList';
import FinanceModule from './pages/finance/FinanceModule';
import FinanceVoucher from './pages/finance/FinanceVoucher';
import FinanceBalance from './pages/finance/FinanceBalance';
import FinanceBalanceSheet from './pages/finance/FinanceBalanceSheet';
import FinanceIncome from './pages/finance/FinanceIncome';
import TaxBurden from './pages/tax/TaxBurden';
import ReportCashFlow from './pages/report/ReportCashFlow';
import Compliance from './pages/compliance/Compliance';
import UserSettings from './pages/settings/UserSettings';
import Login from './pages/auth/Login';
import RequireAuth from './auth/RequireAuth';

const App: React.FC = () => {
  return (
    <Routes>
      {/* 登录页（公开路由） */}
      <Route path="/login" element={<Login />} />

      {/* 需要登录的路由：RequireAuth 作为父 element，Layout 通过 <Outlet /> 渲染子页面 */}
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customer" element={<CustomerList />} />
        {/* 财务模块 */}
        <Route path="/finance" element={<FinanceModule />} />
        <Route path="/finance/voucher" element={<FinanceVoucher />} />
        <Route path="/finance/balance" element={<FinanceBalance />} />
        <Route path="/finance/balance-sheet" element={<FinanceBalanceSheet />} />
        <Route path="/finance/income" element={<FinanceIncome />} />
        {/* 税务 & 合规 */}
        <Route path="/tax/burden" element={<TaxBurden />} />
        <Route path="/tax/cash-flow" element={<ReportCashFlow />} />
        <Route path="/compliance/check" element={<Compliance />} />
        {/* 系统设置 */}
        <Route path="/settings/users" element={<UserSettings />} />
        {/* 兼容旧路径 */}
        <Route path="/tax" element={<Navigate to="/tax/burden" replace />} />
        <Route path="/compliance" element={<Navigate to="/compliance/check" replace />} />
        <Route path="/settings" element={<Navigate to="/settings/users" replace />} />
      </Route>

      {/* 兜底重定向 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
