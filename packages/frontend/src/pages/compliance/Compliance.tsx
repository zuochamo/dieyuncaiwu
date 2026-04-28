import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Progress, Table, Tag, Button, Typography, Spin, DatePicker, Statistic, Empty, Descriptions } from 'antd';
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useTenant } from '../../tenant/TenantContext';

const { Title, Text } = Typography;

interface ComplianceIssue {
  voucherId: string;
  voucherNo: string;
  type: string;
  severity: 'error' | 'warning';
  description: string;
  detail?: string;
}

interface ComplianceData {
  period: string;
  totalVouchers: number;
  checkedVouchers: number;
  passCount: number;
  issues: ComplianceIssue[];
  score: number;
}

const severityIcon = {
  error: <CloseCircleOutlined style={{ color: '#cf1322' }} />,
  warning: <WarningOutlined style={{ color: '#faad14' }} />,
};

const severityColor = { error: 'error', warning: 'warning' } as const;

const typeLabel: Record<string, string> = {
  balance: '借贷不平衡',
  entries: '分录不足',
  summary: '摘要缺失',
  zero_amount: '金额为零',
  period_mismatch: '期间不一致',
};

const Compliance: React.FC = () => {
  const { tenantId } = useTenant();
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<string>(new Date().toISOString().slice(0, 7));

  const fetch = (p?: string) => {
    if (!tenantId) return;
    setLoading(true);
    import('../../api').then(({ default: api }) => {
      api.get('/report/compliance', { params: { tenantId, period: p || undefined } })
        .then((res: any) => setData(res))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    });
  };

  useEffect(() => { fetch(period); }, [tenantId]);

  const errorCount = data?.issues.filter(i => i.severity === 'error').length || 0;
  const warningCount = data?.issues.filter(i => i.severity === 'warning').length || 0;

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 70) return '#1890ff';
    if (score >= 50) return '#faad14';
    return '#cf1322';
  };

  const columns = [
    {
      title: '凭证号',
      dataIndex: 'voucherNo',
      key: 'voucherNo',
      width: 140,
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (v: string) => <Tag>{typeLabel[v] || v}</Tag>,
    },
    {
      title: '级别',
      dataIndex: 'severity',
      key: 'severity',
      width: 80,
      render: (v: 'error' | 'warning') => (
        <Tag icon={severityIcon[v]} color={severityColor[v]}>
          {v === 'error' ? '错误' : '警告'}
        </Tag>
      ),
    },
    {
      title: '问题描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '详情',
      dataIndex: 'detail',
      key: 'detail',
      width: 260,
      render: (v: string) => v ? <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text> : '-',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>🛡️ 合规检查</Title>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <DatePicker picker="month" placeholder="选择期间（可选）"
            onChange={(d: any) => d && setPeriod(d.format('YYYY-MM'))}
          />
          <Button icon={<ReloadOutlined />} onClick={() => fetch(period)}>检查</Button>
        </div>
      </div>

      <Spin spinning={loading}>
        {!tenantId ? (
          <Card><Empty description="请先选择客户" /></Card>
        ) : !data ? (
          <Card><Empty description="暂无数据，请先录入凭证" /></Card>
        ) : (
          <>
            {/* 合规评分 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
              <Col span={6}>
                <Card style={{ textAlign: 'center', borderRadius: 12 }}>
                  <Progress
                    type="dashboard"
                    percent={data.score}
                    strokeColor={getScoreColor(data.score)}
                    format={(p) => <span style={{ fontSize: 28, fontWeight: 700, color: getScoreColor(data.score) }}>{p}</span>}
                    size={120}
                  />
                  <div style={{ marginTop: 8, fontSize: 14, color: '#666' }}>
                    {data.score >= 90 ? '合规状况优秀 ✅' : data.score >= 70 ? '合规状况良好 👍' : data.score >= 50 ? '合规状况一般 ⚠️' : '合规状况较差 ❌'}
                  </div>
                </Card>
              </Col>
              <Col span={18}>
                <Row gutter={[12, 12]}>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic title="检查凭证总数" value={data.totalVouchers} prefix={<SafetyCertificateOutlined />} />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic title="通过凭证" value={data.passCount} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic title="错误数" value={errorCount} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#cf1322' }} />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic title="警告数" value={warningCount} prefix={<WarningOutlined />} valueStyle={{ color: '#faad14' }} />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic title="通过率"
                        value={data.totalVouchers > 0 ? (data.passCount / data.totalVouchers * 100).toFixed(1) : '0'}
                        suffix="%"
                        valueStyle={{ color: data.totalVouchers > 0 && data.passCount / data.totalVouchers > 0.8 ? '#52c41a' : '#faad14' }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic title="检查期间" value={data.period} />
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>

            {/* 问题明细 */}
            <Card title={<span>📋 合规问题明细 {data.issues.length > 0 && <Tag color="red">{data.issues.length}</Tag>}</span>}>
              {data.issues.length === 0 ? (
                <Empty description="🎉 所有凭证均通过合规检查！" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Table
                  dataSource={data.issues}
                  columns={columns}
                  rowKey={(r) => `${r.voucherId}-${r.type}-${r.description}`}
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              )}
            </Card>

            {/* 合规说明 */}
            <Card style={{ marginTop: 16 }} size="small">
              <Title level={5}>检查项目说明</Title>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="借贷平衡">
                  <Tag color="error">错误</Tag> 每张凭证借方合计必须等于贷方合计
                </Descriptions.Item>
                <Descriptions.Item label="分录数量">
                  <Tag color="warning">警告</Tag> 每张凭证至少应有2行分录
                </Descriptions.Item>
                <Descriptions.Item label="摘要完整性">
                  <Tag color="warning">警告</Tag> 每行分录应填写摘要说明
                </Descriptions.Item>
                <Descriptions.Item label="金额校验">
                  <Tag color="error">错误</Tag> 分录金额不应为零
                </Descriptions.Item>
                <Descriptions.Item label="期间一致性">
                  <Tag color="warning">警告</Tag> 凭证日期应在检查期间内
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </>
        )}
      </Spin>
    </div>
  );
};

export default Compliance;
