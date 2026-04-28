import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Tag, Progress, Space, Divider } from 'antd';
import {
  FileTextOutlined,
  BarChartOutlined,
  FundOutlined,
  MoneyCollectOutlined,
  ReconciliationOutlined,
  AccountBookOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
  CalendarOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../tenant/TenantContext';
import api from '../../api';

const { Title, Text } = Typography;

/* ── 快捷入口 ── */
const shortcuts = [
  { icon: <FileTextOutlined style={{ fontSize: 26, color: '#FF6A00' }} />, title: '查凭证', desc: '查看与管理凭证', bg: '#FFF7E6', border: '#FFD591', path: '/voucher' },
  { icon: <BarChartOutlined style={{ fontSize: 26, color: '#52c41a' }} />, title: '余额表', desc: '科目余额汇总', bg: '#F6FFED', border: '#B7EB8F', path: '/settings/subject-balance' },
  { icon: <FundOutlined style={{ fontSize: 26, color: '#1890ff' }} />, title: '资产负债表', desc: '资产=负债+权益', bg: '#E6F7FF', border: '#91D5FF', path: '/report/balance-sheet' },
  { icon: <MoneyCollectOutlined style={{ fontSize: 26, color: '#722ed1' }} />, title: '利润表', desc: '收入-费用=利润', bg: '#F9F0FF', border: '#D3ADF7', path: '/report/income' },
];

const FinanceHome: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId, allTenants } = useTenant();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const currentPeriod = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const currentTenant = useMemo(() => {
    const savedName = localStorage.getItem('finance_tenant_name');
    const found = allTenants.find(t => t.id === tenantId);
    return found?.name || savedName || '未选择账套';
  }, [allTenants, tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    api.get('/report/dashboard', { params: { tenantId, period: currentPeriod } })
      .then((res: any) => setStats(res))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [tenantId, currentPeriod]);

  const postedRate = stats && stats.totalVouchers > 0
    ? Math.round(((stats.postedVouchers || 0) / stats.totalVouchers) * 100) : 0;

  return (
    <div style={{ padding: 0 }}>
      {/* 顶部欢迎 */}
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{currentTenant}</Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          <CalendarOutlined style={{ marginRight: 6 }} />
          当前期间：{currentPeriod}
          <Tag color="green" style={{ marginLeft: 12 }}>已建账</Tag>
        </Text>
      </div>

      {/* 快捷入口 4 卡片 */}
      <Row gutter={14} style={{ marginBottom: 20 }}>
        {shortcuts.map((s, i) => (
          <Col span={6} key={i}>
            <Card
              hoverable
              bordered={false}
              style={{
                borderRadius: 10,
                borderLeft: `3px solid ${s.border}`,
                background: s.bg,
                cursor: 'pointer',
                height: 88,
              }}
              bodyStyle={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}
              onClick={() => navigate(s.path)}
            >
              {s.icon}
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{s.title}</div>
                <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 2 }}>{s.desc}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={14}>
        {/* 左侧：记账助手 + 常用功能 */}
        <Col span={14}>
          {/* 记账助手 */}
          <Card
            style={{ borderRadius: 10, marginBottom: 14, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
            bodyStyle={{ padding: 24 }}
          >
            <Row align="middle" gutter={20}>
              <Col flex="auto">
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>📋 智能记账助手</div>
                <div style={{ fontSize: 13, opacity: 0.85, color: '#fff', lineHeight: 1.7 }}>
                  自动识别发票、生成凭证、一键过账<br />
                  把重复的账交给AI，把重要的决策留给自己
                </div>
              </Col>
              <Col>
                <div
                  onClick={() => navigate('/voucher/create')}
                  style={{
                    background: 'rgba(255,255,255,0.22)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: 10,
                    padding: '12px 28px',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.35)',
                    color: '#fff',
                    transition: 'background .2s',
                    textAlign: 'center',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.38)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
                >
                  开始记账 →
                </div>
              </Col>
            </Row>
          </Card>

          {/* 常用功能 */}
          <Card
            title={<span style={{ fontWeight: 700, fontSize: 14 }}>常用功能</span>}
            style={{ borderRadius: 10 }}
            bodyStyle={{ padding: '8px 16px' }}
          >
            <Row gutter={[8, 8]}>
              {[
                { icon: <ReconciliationOutlined style={{ fontSize: 16, color: '#FF6A00' }} />, label: '凭证列表', path: '/voucher' },
                { icon: <FileTextOutlined style={{ fontSize: 16, color: '#FF6A00' }} />, label: '凭证录入', path: '/voucher/create' },
                { icon: <AccountBookOutlined style={{ fontSize: 16, color: '#52c41a' }} />, label: '科目余额表', path: '/settings/subject-balance' },
                { icon: <FundOutlined style={{ fontSize: 16, color: '#1890ff' }} />, label: '资产负债表', path: '/report/balance-sheet' },
                { icon: <MoneyCollectOutlined style={{ fontSize: 16, color: '#722ed1' }} />, label: '利润表', path: '/report/income' },
                { icon: <MoneyCollectOutlined style={{ fontSize: 16, color: '#eb2f96' }} />, label: '现金流量表', path: '/report/cash-flow' },
                { icon: <BarChartOutlined style={{ fontSize: 16, color: '#13c2c2' }} />, label: '发票管理', path: '/invoice' },
                { icon: <SafetyCertificateOutlined style={{ fontSize: 16, color: '#faad14' }} />, label: '辅助设置', path: '/settings/assistant' },
              ].map((item, idx) => (
                <Col span={6} key={idx}>
                  <div
                    onClick={() => navigate(item.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {item.icon}
                    <Text style={{ fontSize: 13 }}>{item.label}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* 右侧：本期财税指标 */}
        <Col span={10}>
          <Card
            title={<span style={{ fontWeight: 700, fontSize: 14 }}>📊 本期财税指标</span>}
            style={{ borderRadius: 10 }}
            bodyStyle={{ padding: '14px 18px' }}
          >
            <Spin spinning={loading}>
              {/* 凭证统计 */}
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>凭证处理</Text>
                <Row gutter={10}>
                  <Col span={8}>
                    <Statistic title="总凭证" value={stats?.totalVouchers ?? 0} valueStyle={{ fontSize: 20, fontWeight: 700 }} />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="已过账"
                      value={stats?.postedVouchers ?? 0}
                      valueStyle={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}
                      prefix={<CheckCircleOutlined style={{ fontSize: 13 }} />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="草稿"
                      value={stats?.draftVouchers ?? 0}
                      valueStyle={{ fontSize: 20, fontWeight: 700, color: '#faad14' }}
                      prefix={<ClockCircleOutlined style={{ fontSize: 13 }} />}
                    />
                  </Col>
                </Row>
                {stats && stats.totalVouchers > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <Progress percent={postedRate} size="small" strokeColor="#52c41a" />
                    <Text type="secondary" style={{ fontSize: 11 }}>过账率 {postedRate}%</Text>
                  </div>
                )}
              </div>

              <Divider style={{ margin: '10px 0' }} />

              {/* 发票统计 */}
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>发票处理</Text>
                <Row gutter={10}>
                  <Col span={8}>
                    <Statistic title="总发票" value={stats?.totalInvoices ?? 0} valueStyle={{ fontSize: 20, fontWeight: 700 }} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="已处理" value={stats?.processedInvoices ?? 0} valueStyle={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="待处理" value={stats?.pendingInvoices ?? 0} valueStyle={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f' }} />
                  </Col>
                </Row>
              </div>

              <Divider style={{ margin: '10px 0' }} />

              {/* 最新动态 */}
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>最新动态</Text>
                {stats?.latestVoucherDate ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileProtectOutlined style={{ color: '#1890ff' }} />
                    <Text style={{ fontSize: 13 }}>最近凭证日期：{stats.latestVoucherDate}</Text>
                  </div>
                ) : (
                  <Text type="secondary" style={{ fontSize: 13 }}>暂无凭证数据</Text>
                )}
              </div>
            </Spin>
          </Card>

          {/* 提示卡片 */}
          <Card
            style={{ borderRadius: 10, marginTop: 14, background: '#fafafa', border: '1px dashed #d9d9d9' }}
            bodyStyle={{ padding: 14 }}
          >
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>💡 快捷提示</Text>
              <Text style={{ fontSize: 13 }}>· 点击左侧菜单切换到凭证、报表等模块</Text>
              <Text style={{ fontSize: 13 }}>· 发票自动识别后可一键生成凭证</Text>
              <Text style={{ fontSize: 13 }}>· 资产负债表、利润表支持一键导出</Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <style>{`
        .ant-statistic-title { font-size: 12px !important; }
      `}</style>
    </div>
  );
};

export default FinanceHome;
