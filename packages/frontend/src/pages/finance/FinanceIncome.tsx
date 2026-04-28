import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, DatePicker, Spin, Row, Col, Statistic, Button, Tag, Descriptions } from 'antd';
import { MoneyCollectOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTenant } from '../../tenant/TenantContext';
import api from '../../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const FinanceIncomePage: React.FC = () => {
  const { tenantId } = useTenant();
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await api.get('/report/income', { params: { tenantId, period } });
      setData(res);
    } catch (e) {
      console.error('获取利润表失败', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [tenantId, period]);

  const renderItemRows = (items: any[] = [], prefix: string = '') => {
    return items.map((item, i) => ({
      key: `${prefix}-${i}`,
      name: (
        <span style={{ paddingLeft: item.children ? 0 : 16 }}>
          {item.name || item.subjectName || '—'}
        </span>
      ),
      amount: item.amount || item.balance || 0,
      isTotal: item.isTotal || false,
    }));
  };

  const allRows = [
    ...(renderItemRows(data?.revenue, 'rev')),
    {
      key: 'rev-total',
      name: <Text strong style={{ color: '#52c41a' }}>一、营业收入合计</Text>,
      amount: data?.totalRevenue || 0,
      isTotal: true,
    },
    ...(renderItemRows(data?.expenses, 'exp')),
    {
      key: 'exp-total',
      name: <Text strong style={{ color: '#f5222d' }}>二、营业成本/费用合计</Text>,
      amount: data?.totalExpenses || 0,
      isTotal: true,
    },
    {
      key: 'net',
      name: <Text strong style={{ fontSize: 15, color: '#722ed1' }}>三、净利润</Text>,
      amount: data?.netProfit || 0,
      isTotal: true,
    },
  ];

  const columns = [
    {
      title: '项目',
      dataIndex: 'name',
      width: 350,
    },
    {
      title: '本期金额（元）',
      dataIndex: 'amount',
      align: 'right' as const,
      render: (v: number, row: any) => {
        if (row.isTotal) {
          return (
            <Text strong style={{ fontSize: 14, color: v >= 0 ? '#52c41a' : '#f5222d' }}>
              ¥{Math.abs(v).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </Text>
          );
        }
        return v ? `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : '';
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}><MoneyCollectOutlined /> 利润表</Title>
        <div>
          <DatePicker picker="month" value={dayjs(period)} onChange={(d) => d && setPeriod(d.format('YYYY-MM'))} />
          <Button icon={<PrinterOutlined />} style={{ marginLeft: 8 }}>打印</Button>
          <Button icon={<DownloadOutlined />} style={{ marginLeft: 8 }}>导出</Button>
        </div>
      </div>

      <Spin spinning={loading}>
        {/* 汇总指标 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="营业收入"
                value={data?.totalRevenue || 0}
                prefix="¥"
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="营业成本/费用"
                value={data?.totalExpenses || 0}
                prefix="¥"
                precision={2}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="净利润"
                value={data?.netProfit || 0}
                prefix="¥"
                precision={2}
                valueStyle={{ color: (data?.netProfit || 0) >= 0 ? '#52c41a' : '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <Table
            columns={columns as any}
            dataSource={allRows}
            pagination={false}
            size="small"
            rowClassName={(record: any) => record.isTotal ? 'row-total' : ''}
          />
        </Card>

        {!data && !loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
            <Text type="secondary">请选择客户和期间查看利润表</Text>
          </div>
        )}
      </Spin>

      <style>{`
        .row-total { background: #fafafa; }
        .row-total:hover > td { background: #f0f0f0 !important; }
      `}</style>
    </div>
  );
};

export default FinanceIncomePage;
