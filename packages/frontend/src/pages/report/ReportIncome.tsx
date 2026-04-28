import React, { useEffect, useState } from 'react';
import { Table, Input, Card, Statistic, Row, Col } from 'antd';
import api from '../../api';
import { useTenant } from '../../tenant/TenantContext';

interface IncomeData {
  period: string;
  revenue: { code: string; name: string; balance: number }[];
  expenses: { code: string; name: string; balance: number }[];
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

const ReportIncome: React.FC = () => {
  const [data, setData] = useState<IncomeData | null>(null);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const { tenantId } = useTenant();

  const fetchData = async (p: string) => {
    try {
      if (!tenantId) return;
      const res = await api.get(`/report/income?tenantId=${tenantId}&period=${p}`);
      setData(res as any);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(period); }, [tenantId]);

  const columns = [
    { title: '科目编码', dataIndex: 'code' },
    { title: '科目名称', dataIndex: 'name' },
    { title: '金额', dataIndex: 'balance', render: (v: number) => `¥${Number(v).toFixed(2)}` },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>利润表</h2>
        <Input.Search
          placeholder="输入期间 YYYY-MM"
          defaultValue={period}
          onSearch={(v) => { setPeriod(v); fetchData(v); }}
          style={{ width: 250 }}
        />
      </div>
      {data && (
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card><Statistic title="营业收入" value={data.totalRevenue} precision={2} prefix="¥" /></Card>
            </Col>
            <Col span={8}>
              <Card><Statistic title="营业成本" value={data.totalExpenses} precision={2} prefix="¥" /></Card>
            </Col>
            <Col span={8}>
              <Card><Statistic title="净利润" value={data.netProfit} precision={2} prefix="¥" valueStyle={{ color: data.netProfit >= 0 ? '#3f8600' : '#cf1322' }} /></Card>
            </Col>
          </Row>
          <Card title="收入明细" style={{ marginBottom: 16 }}>
            <Table columns={columns} dataSource={data.revenue} rowKey="code" pagination={false} size="small" />
          </Card>
          <Card title="费用明细">
            <Table columns={columns} dataSource={data.expenses} rowKey="code" pagination={false} size="small" />
          </Card>
        </>
      )}
    </div>
  );
};

export default ReportIncome;
