import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, DatePicker, Button, Typography, Progress, Tag, Descriptions, Space } from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  AccountBookOutlined,
  FileTextOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useTenant } from '../../tenant/TenantContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface TaxBurdenData {
  period: string;
  revenue: number;
  outputTax: number;
  inputTax: number;
  vatPayable: number;
  incomeTax: number;
  totalTaxPayable: number;
  vatBurdenRate: string;
  totalTaxBurdenRate: string;
  invoices: { inputCount: number; outputCount: number; pendingCount: number };
}

const formatAmt = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TaxBurden: React.FC = () => {
  const { tenantId } = useTenant();
  const [data, setData] = useState<TaxBurdenData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<string>(new Date().toISOString().slice(0, 7));

  const fetch = (p: string) => {
    if (!tenantId) return;
    setLoading(true);
    import('../../api').then(({ default: api }) => {
      api.get('/report/tax-burden', { params: { tenantId, period: p } })
        .then((res: any) => setData(res))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    });
  };

  useEffect(() => { fetch(period); }, [tenantId, period]);

  // 税负率颜色
  const getVatColor = (rateStr: string) => {
    const rate = parseFloat(rateStr);
    if (rate <= 1) return '#52c41a';
    if (rate <= 3) return '#1890ff';
    if (rate <= 6) return '#faad14';
    return '#cf1322';
  };

  const getTotalColor = (rateStr: string) => {
    const rate = parseFloat(rateStr);
    if (rate <= 5) return '#52c41a';
    if (rate <= 15) return '#1890ff';
    if (rate <= 25) return '#faad14';
    return '#cf1322';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>📈 税负分析</Title>
        <Space>
          <DatePicker picker="month" value={period ? dayjs(period) : null}
            onChange={(d: any) => d && setPeriod(d.format('YYYY-MM'))}
          />
          <Button type="primary" onClick={() => fetch(period)}>查询</Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        {!tenantId ? (
          <Card>请先选择客户</Card>
        ) : !data ? (
          <Card><Text type="secondary">暂无数据，请先录入凭证并过账</Text></Card>
        ) : (
          <>
            {/* 核心指标卡片 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
              <Col span={4}>
                <Card size="small">
                  <Statistic title="营业收入" value={data.revenue} prefix={<RiseOutlined />} precision={2} />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small">
                  <Statistic title="销项税额" value={data.outputTax} valueStyle={{ color: '#cf1322' }} precision={2} />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small">
                  <Statistic title="进项税额" value={data.inputTax} valueStyle={{ color: '#3f8600' }} precision={2} />
                </Card>
              </Col>
              <Col span={3}>
                <Card size="small">
                  <Statistic title="应纳增值税" value={data.vatPayable} valueStyle={{ color: data.vatPayable > 0 ? '#faad14' : undefined }} precision={2} />
                </Card>
              </Col>
              <Col span={3}>
                <Card size="small">
                  <Statistic title="企业所得税" value={data.incomeTax} valueStyle={{ color: data.incomeTax > 0 ? '#faad14' : undefined }} precision={2} />
                </Card>
              </Col>
              <Col span={3}>
                <Card size="small">
                  <Statistic title="总税负" value={data.totalTaxPayable} valueStyle={{ color: '#cf1322', fontWeight: 700 }} precision={2} />
                </Card>
              </Col>
              <Col span={3}>
                <Card size="small" style={{ background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' }}>
                  <Statistic
                    title={<span>综合税率</span>}
                    value={data.totalTaxBurdenRate}
                    valueStyle={{ color: getTotalColor(data.totalTaxBurdenRate), fontWeight: 700 }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 详细分析 */}
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title={<span><AccountBookOutlined /> 增值税分析</span>} size="small">
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="营业收入">{formatAmt(data.revenue)}</Descriptions.Item>
                    <Descriptions.Item label="销项税额（应收取）"><Text type="danger">{formatAmt(data.outputTax)}</Text></Descriptions.Item>
                    <Descriptions.Item label="进项税额（可抵扣）"><Text type="success">{formatAmt(data.inputTax)}</Text></Descriptions.Item>
                    <Descriptions.Item label="应纳增值税">
                      <Tag color={data.vatPayable > 0 ? 'orange' : 'green'}>
                        {data.vatPayable > 0 ? `需缴纳 ${formatAmt(data.vatPayable)}` : '无需缴纳（进项≥销项）'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="增值税负率">
                      <Progress
                        percent={Math.min(parseFloat(data.vatBurdenRate) * 10, 100)}
                        strokeColor={getVatColor(data.vatBurdenRate)}
                        format={() => data.vatBurdenRate}
                        style={{ width: 200 }}
                      />
                    </Descriptions.Item>
                  </Descriptions>

                  <div style={{ marginTop: 16 }}>
                    <Title level={5}>💡 增值税负率参考</Title>
                    <ul style={{ fontSize: 13, lineHeight: 2.2, paddingLeft: 18, color: '#555' }}>
                      <li>一般纳税人标准：{`1%~6%`} 为正常区间</li>
                      <li>{`< 1%`}: 可能存在进项留抵较多或收入确认问题</li>
                      <li>{`> 6%`}: 需关注是否有未取得进项发票的情况</li>
                    </ul>
                  </div>
                </Card>
              </Col>

              <Col span={12}>
                <Card title={<span><FileTextOutlined /> 发票统计</span>} size="small" style={{ marginBottom: 16 }}>
                  <Row gutter={[12, 12]}>
                    <Col span={8}>
                      <Statistic title="进项发票" value={data.invoices.inputCount} prefix={<FallOutlined />} suffix="张" />
                    </Col>
                    <Col span={8}>
                      <Statistic title="销项发票" value={data.invoices.outputCount} prefix={<RiseOutlined />} suffix="张" />
                    </Col>
                    <Col span={8}>
                      <Statistic title="待处理" value={data.invoices.pendingCount}
                        valueStyle={{ color: data.invoices.pendingCount > 0 ? '#ff4d4f' : undefined }}
                        suffix="张"
                      />
                    </Col>
                  </Row>
                </Card>

                <Card title={<span><WarningOutlined /> 综合税负评估</span>} size="small">
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="综合税负率">
                      <Tag color={parseFloat(data.totalTaxBurdenRate) <= 10 ? 'green' : parseFloat(data.totalTaxBurdenRate) <= 20 ? 'blue' : 'orange'} style={{ fontSize: 16 }}>
                        {data.totalTaxBurdenRate}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="企业所得税">
                      {data.incomeTax > 0 ? `${formatAmt(data.incomeTax)} （建议核实）` : '暂无数据'}
                    </Descriptions.Item>
                    <Descriptions.Item label="风险评估">
                      {parseFloat(data.totalTaxBurdenRate) <= 10 ? (
                        <Tag icon={<CheckCircleOutlined />} color="success">正常偏低</Tag>
                      ) : parseFloat(data.totalTaxBurdenRate) <= 25 ? (
                        <Tag color="processing">正常范围</Tag>
                      ) : (
                        <Tag color="warning">偏高，建议核查</Tag>
                      )}
                    </Descriptions.Item>
                  </Descriptions>

                  <div style={{ marginTop: 16, padding: 12, background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ⚠️ 以上分析基于已过账凭证和发票数据计算，仅供参考。实际税负请以税务申报为准。
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Spin>
    </div>
  );
};

export default TaxBurden;
