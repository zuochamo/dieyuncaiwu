import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Row, Col, Statistic, Spin, DatePicker, Button, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useTenant } from '../../tenant/TenantContext';
import dayjs from 'dayjs';

const { Title } = Typography;

interface CashFlowRow {
  name: string;
  code?: string;
  amount: number;
}

interface CashFlowData {
  period: string;
  operating: { items: CashFlowRow[]; subtotal: number };
  investing: { items: CashFlowRow[]; subtotal: number };
  financing: { items: CashFlowRow[]; subtotal: number };
  netIncrease: number;
  beginningBalance: number;
  endingBalance: number;
}

const formatAmount = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const columns = [
  { title: '项目', dataIndex: 'name', key: 'name', width: 320 },
  {
    title: '金额（元）',
    dataIndex: 'amount',
    key: 'amount',
    align: 'right' as const,
    render: (v: number) => (
      <span style={{ color: v > 0 ? '#cf1322' : v < 0 ? '#3f8600' : undefined }}>
        {v > 0 ? '' : v < 0 ? '-' : ''}{formatAmount(Math.abs(v))}
      </span>
    ),
  },
];

const ReportCashFlow: React.FC = () => {
  const { tenantId } = useTenant();
  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<string>(new Date().toISOString().slice(0, 7));

  const fetchCashFlow = (p: string) => {
    if (!tenantId) return;
    setLoading(true);
    import('../../api').then(({ default: api }) => {
      api.get('/report/cash-flow', { params: { tenantId, period: p } })
        .then((res: any) => setData(res))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    });
  };

  useEffect(() => { fetchCashFlow(period); }, [tenantId, period]);

  const buildRows = (title: string, items: CashFlowRow[], subtotal: number): any[] => [
    { name: <strong>{title}</strong>, amount: null },
    ...items.map(i => ({ name: `　　${i.name}`, amount: i.amount })),
    { name: <strong style={{ color: '#1890ff' }}>　　{title} 小计</strong>, amount: subtotal },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>💰 现金流量表</Title>
        <Space>
          <DatePicker picker="month" value={period ? dayjs(period) : null}
            onChange={(d: any) => d && setPeriod(d.format('YYYY-MM'))}
          />
          <Button type="primary" onClick={() => fetchCashFlow(period)}>查询</Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        {!tenantId ? (
          <Card>请先选择客户</Card>
        ) : !data ? (
          <Card><Typography.Text type="secondary">暂无数据，请先录入凭证并过账</Typography.Text></Card>
        ) : (
          <>
            {/* 三大活动汇总 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="经营活动净流量"
                    value={data.operating.subtotal}
                    prefix={data.operating.subtotal >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    valueStyle={{ color: data.operating.subtotal >= 0 ? '#3f8600' : '#cf1322' }}
                    precision={2}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="投资活动净流量"
                    value={data.investing.subtotal}
                    prefix={data.investing.subtotal >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    valueStyle={{ color: data.investing.subtotal >= 0 ? '#3f8600' : '#cf1322' }}
                    precision={2}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="筹资活动净流量"
                    value={data.financing.subtotal}
                    prefix={data.financing.subtotal >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    valueStyle={{ color: data.financing.subtotal >= 0 ? '#3f8600' : '#cf1322' }}
                    precision={2}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
                  <Statistic
                    title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>现金净增加额</span>}
                    value={data.netIncrease}
                    prefix={data.netIncrease >= 0 ? <ArrowUpOutlined style={{ color: '#fff' }} /> : <ArrowDownOutlined style={{ color: '#fff' }} />}
                    valueStyle={{ color: '#fff', fontWeight: 700 }}
                    precision={2}
                  />
                </Card>
              </Col>
            </Row>

            {/* 明细表格 */}
            <Card>
              <Table<CashFlowRow>
                pagination={false}
                showHeader={false}
                dataSource={[
                  ...buildRows('一、经营活动产生的现金流量', data.operating.items, data.operating.subtotal),
                  { name: '', amount: null },
                  ...buildRows('二、投资活动产生的现金流量', data.investing.items, data.investing.subtotal),
                  { name: '', amount: null },
                  ...buildRows('三、筹资活动产生的现金流量', data.financing.items, data.financing.subtotal),
                  { name: '', amount: null },
                  { name: <strong>四、现金及现金等价物净增加额</strong>, amount: data.netIncrease },
                  { name: <strong>加：期初现金余额</strong>, amount: data.beginningBalance },
                  { name: <strong style={{ fontSize: 15 }}>五、期末现金余额</strong>, amount: data.endingBalance },
                ]}
                columns={columns as any}
                rowClassName={(r: any) =>
                  r.amount === null ? 'empty-row'
                    : typeof r.name?.props?.children === 'string' && r.name.props.children.includes('小计')
                      ? 'subtotal-row'
                      : r.name?.props?.children && String(r.name.props.children).includes('期末')
                        ? 'total-row'
                        : ''
                }
              />
            </Card>
          </>
        )}
      </Spin>

      <style>{`
        .empty-row td { background: transparent !important; padding: 4px 12px !important; }
        .subtotal-row td { background: #fafafa !important; font-weight: 600; }
        .total-row td { background: #e6f7ff !important; font-weight: 700; font-size: 14px; }
      `}</style>
    </div>
  );
};

export default ReportCashFlow;
