import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './index.css';
import { TenantProvider } from './tenant/TenantContext';
import { AuthProvider } from './auth/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#FF6A00',
          colorInfo: '#FF6A00',
          colorLink: '#FF6A00',
          borderRadius: 10,
          fontSize: 14,
          colorBgLayout: '#F6F7FB',
        },
        components: {
          Layout: {
            headerBg: '#FFFFFF',
            bodyBg: '#F6F7FB',
            siderBg: '#FFFFFF',
          },
          Menu: {
            itemBorderRadius: 8,
            itemSelectedColor: '#FF6A00',
            itemSelectedBg: 'rgba(255, 106, 0, 0.10)',
            itemActiveBg: 'rgba(255, 106, 0, 0.08)',
          },
          Button: {
            borderRadius: 10,
            primaryShadow: '0 10px 26px rgba(255, 106, 0, 0.22)',
          },
          Card: {
            borderRadiusLG: 14,
          },
          Table: {
            borderRadiusLG: 14,
          },
        },
      }}
    >
      <AuthProvider>
        <TenantProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </TenantProvider>
      </AuthProvider>
    </ConfigProvider>
  </React.StrictMode>,
);
