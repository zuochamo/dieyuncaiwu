import React, { useMemo } from 'react';
import { Layout, Menu, Select, Space, Typography, Button, Dropdown } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTenant } from '../tenant/TenantContext';
import { useAuth } from '../auth/AuthContext';
import { topTabs, sideMenuByChannel, getChannel, defaultPathForChannel, TopChannel } from '../config/mainMenuConfig';

const { Header, Sider, Content } = Layout;

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeTenants, tenantId, setTenantId, loading } = useTenant();
  const { user, logout } = useAuth();
  const channel = useMemo(() => getChannel(location.pathname), [location.pathname]);
  const sideItems = useMemo(() => sideMenuByChannel[channel], [channel]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="top-bar" style={{ padding: '0 20px', height: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 300 }}>
            <img src="/logo.png" alt="叠云会计服务" style={{ height: 36, width: 'auto' }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
              <Typography.Text className="top-bar-title" style={{ fontSize: 16 }}>代理记账系统</Typography.Text>
              <Typography.Text className="top-bar-subtitle">叠云会计服务</Typography.Text>
            </div>
          </div>
          <Menu
            className="top-nav"
            mode="horizontal"
            selectedKeys={[channel]}
            items={topTabs.map(t => ({ key: t.key, label: t.label }))}
            onClick={({ key }) => {
              const next = key as TopChannel;
              navigate(defaultPathForChannel(next));
            }}
            style={{ borderBottom: 'none', flex: 1, justifyContent: 'center' } as any}
          />
          <Space style={{ minWidth: 320, justifyContent: 'flex-end' }}>
            <Typography.Text className="top-bar-muted">当前客户</Typography.Text>
            <Select
              style={{ width: 200 }}
              placeholder="选择客户"
              loading={loading}
              value={tenantId || undefined}
              options={activeTenants.map(t => ({ value: t.id, label: t.name }))}
              onChange={(v) => setTenantId(v)}
            />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text" icon={<UserOutlined />} style={{ color: '#595959' }}>
                {user?.username || '用户'}
              </Button>
            </Dropdown>
          </Space>
        </div>
      </Header>

      <Layout>
        <Sider theme="light" width={220} style={{ borderRight: '1px solid rgba(0,0,0,0.06)' }}>
          <Menu
            className="side-nav"
            theme="light"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={sideItems}
            onClick={({ key }) => navigate(key)}
            style={{ padding: 8 }}
          />
        </Sider>

        <Content style={{ padding: '16px 24px 0' }}>
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: 24,
            minHeight: 'calc(100vh - 88px)',
            boxShadow: '0 18px 50px rgba(15, 23, 42, 0.06)'
          }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
