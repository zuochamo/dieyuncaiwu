import React, { useEffect, useMemo } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Tabs, Space, Badge, Button } from 'antd';
import { CloseOutlined, LogoutOutlined } from '@ant-design/icons';
import { TenantProvider, useTenant } from './tenant/TenantContext';

// 拆分后的模块
import { sideMenuItems, defaultOpenKeys } from './config/financeMenuConfig';
import { useFinanceTabs } from './config/useFinanceTabs';
import FinanceRouter from './config/FinanceRouter';

const { Header, Sider, Content } = Layout;

// ─── 布局组件 ──────────────────────────────────────────
const FinanceLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId, setTenantId, allTenants } = useTenant();
  const { tabs, activeKey, handleTabChange, handleTabClose } = useFinanceTabs();

  // 初始化时从 localStorage 读取租户信息
  useEffect(() => {
    const savedId = localStorage.getItem('finance_tenant_id');
    if (savedId) {
      setTenantId(savedId);
    }
  }, [setTenantId]);

  // 获取当前租户名称
  const tenantName = useMemo(() => {
    const savedName = localStorage.getItem('finance_tenant_name');
    if (savedName) return savedName;
    const current = allTenants.find(t => t.id === tenantId);
    return current?.name || '未选择账套';
  }, [allTenants, tenantId]);

  // 退出账套
  const handleExit = () => {
    window.close();
  };

  // Tab items
  const tabItems = tabs.map(tab => ({
    key: tab.key,
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{tab.title}</span>
        {tab.closable !== false && (
          <CloseOutlined
            style={{ fontSize: 10, marginLeft: 4 }}
            onClick={(e: any) => handleTabClose(tab.key, e as unknown as React.MouseEvent)}
          />
        )}
      </span>
    ),
  }));

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部栏 */}
      <Header style={{
        padding: '0 20px',
        height: 56,
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="叠云会计服务" style={{ height: 36, width: 'auto' }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
            <Typography.Text strong style={{ fontSize: 16 }}>代理记账系统</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              叠云会计服务
            </Typography.Text>
          </div>
        </div>

        <Space>
          <Badge status="processing" text={tenantName} />
          <Button icon={<LogoutOutlined />} onClick={handleExit}>
            退出账套
          </Button>
        </Space>
      </Header>

      <Layout>
        {/* 侧边栏 */}
        <Sider
          theme="light"
          width={220}
          style={{ borderRight: '1px solid rgba(0,0,0,0.06)' }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            defaultOpenKeys={defaultOpenKeys}
            items={sideMenuItems}
            onClick={({ key }) => navigate(key)}
            style={{ padding: 8, height: 'calc(100vh - 56px)' }}
          />
        </Sider>

        <Content style={{ display: 'flex', flexDirection: 'column', padding: '16px 24px 0' }}>
          {/* 标签页导航 */}
          <div style={{
            background: '#fff',
            borderRadius: '14px 14px 0 0',
            padding: '12px 16px 0',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <Tabs
              activeKey={activeKey}
              onChange={handleTabChange}
              items={tabItems}
              size="small"
              style={{ marginBottom: -12 }}
            />
          </div>

          {/* 页面内容 */}
          <div style={{
            background: '#fff',
            borderRadius: '0 0 14px 14px',
            padding: 24,
            flex: 1,
            boxShadow: '0 18px 50px rgba(15, 23, 42, 0.06)'
          }}>
            <FinanceRouter pathname={location.pathname} />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

// ─── 入口组件 ──────────────────────────────────────────
const FinanceApp: React.FC = () => {
  return (
    <BrowserRouter>
      <TenantProvider>
        <FinanceLayout />
      </TenantProvider>
    </BrowserRouter>
  );
};

export default FinanceApp;
