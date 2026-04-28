import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Typography, Tag, List, Empty } from 'antd';
import {
  TeamOutlined,
  FileTextOutlined,
  FileDoneOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  BankOutlined,
  ArrowUpOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { useTenant } from '../../tenant/TenantContext';

interface DashboardData {
  totalVouchers: number;
  postedVouchers: number;
  draftVouchers: number;
  totalInvoices: number;
  pendingInvoices: number;
  processedInvoices: number;
  latestVoucherDate: string | null;
}

const Dashboard: React.FC = () => {
  const { tenantId } = useTenant();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const currentPeriod = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    import('../../api').then(({ default: api }) => {
      api.get('/report/dashboard', { params: { tenantId, period: currentPeriod } })
        .then((res: any) => setData(res))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    });
  }, [tenantId]);

  if (!tenantId) {
    return (
      <div>
        <Typography.Title level={4} style={{ marginBottom: 24 }}>📊 工作台</Typography.Title>
        <Empty description="请先在右上角选择客户" />
      </div>
    );
  }

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>📊 工作台</Typography.Title>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card hoverable style={{ borderRadius: 12 }}>
              <Statistic
                title="本月凭证"
                value={data?.totalVouchers || 0}
                prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                suffix={
                  <span style={{ fontSize: 12, color: '#999' }}>
                    ({data?.postedVouchers || 0} 已过账)
                  </span>
                }
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card hoverable style={{ borderRadius: 12 }}>
              <Statistic
                title="待处理凭证"
                value={data?.draftVouchers || 0}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={data?.draftVouchers ? { color: '#faad14' } : undefined}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card hoverable style={{ borderRadius: 12 }}>
              <Statistic
                title="待处理发票"
                value={data?.pendingInvoices || 0}
                prefix={<FileDoneOutlined style={{ color: '#ff4d4f' }} />}
                suffix={
                  <span style={{ fontSize: 12, color: '#999' }}>
                    (共 {data?.totalInvoices || 0} 张)
                  </span>
                }
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card hoverable style={{ borderRadius: 12 }}>
              <Statistic
                title="已处理发票"
                value={data?.processedInvoices || 0}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Card title="📋 快捷操作" style={{ borderRadius: 12 }}>
              <List
                size="small"
                dataSource={[
                  { title: '查看现金流量表', desc: '分析资金流动情况', path: 'cash-flow' },
                  { title: '税负分析', desc: '计算增值税/所得税税负率', path: 'tax-burden' },
                  { title: '合规检查', desc: '凭证合规性校验', path: 'compliance' },
                ]}
                renderItem={(item) => (
                  <List.Item style={{ cursor: 'pointer' }} extra={<Tag color="blue">进入</Tag>}>
                    <List.Item.Meta
                      title={item.title}
                      description={item.desc}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="📈 数据概览" style={{ borderRadius: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>凭证过账率</span>
                  <span style={{ fontWeight: 600, color: data?.totalVouchers ? (data.postedVouchers / data.totalVouchers * 100 > 80 ? '#52c41a' : '#faad14') : '#999' }}>
                    {data?.totalVouchers ? (data.postedVouchers / data.totalVouchers * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>发票处理率</span>
                  <span style={{ fontWeight: 600, color: data?.totalInvoices ? (data.processedInvoices / data.totalInvoices * 100 > 80 ? '#52c41a' : '#faad14') : '#999' }}>
                    {data?.totalInvoices ? (data.processedInvoices / data.totalInvoices * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>最新凭证日期</span>
                  <span style={{ fontWeight: 600 }}>{data?.latestVoucherDate || '暂无'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>当前期间</span>
                  <Tag color="blue">{currentPeriod}</Tag>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard;
