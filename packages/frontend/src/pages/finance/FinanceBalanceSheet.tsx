import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, DatePicker, Spin, Row, Col, Statistic, Button, Descriptions, Tag } from 'antd';
import { FundOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTenant } from '../../tenant/TenantContext';
import api from '../../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface BalanceSheetItem {
  name: string;
  amount: number;
}

interface BalanceSheetData {
  period: string;
  assets: BalanceSheetItem[];
  liabilities: BalanceSheetItem[];
  equity: BalanceSheetItem[];
  totalAssets: number;
  totalLiabilitiesAndEquity: number;
}

const FinanceBalanceSheetPage: React.FC = () => {
  const { tenantId } = useTenant();
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BalanceSheetData | null>(null);

  const fetchData = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await api.get<BalanceSheetData, BalanceSheetData>('/report/balance-sheet', { params: { tenantId, period } });
      setData(res || null);
    } catch (e) {
      console.error('获取资产负债表失败', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [tenantId, period]);

  // 渲报表格式行
  const renderRows = (items: BalanceSheetItem[] | undefined, level: number = 0): any[] => {
    if (!items) return [];
    return items.map((item, i) => ({
      key: `${level}-${i}`,
      name: (
        <span style={{ paddingLeft: level * 20, fontWeight: item.amount === 0 ? 400 : 600 }}>
          {item.name}
        </span>
      ),
      amount: item.amount ? (
        <Text strong style={{ color: item.amount >= 0 ? '#f5222d' : '#f5222d' }}>
          {Math.abs(item.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </Text>
      ) : '',
    }));
  };

  const columns = [
    { title: '项目', dataIndex: 'name', width: 350 },
    { title: '期末余额（元）', dataIndex: 'amount', align: 'right' as const },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}><FundOutlined /> 资产负债表</Title>
        <div>
          <DatePicker picker="month" value={dayjs(period)} onChange={(d) => d && setPeriod(d.format('YYYY-MM'))} />
          <Button icon={<PrinterOutlined />} style={{ marginLeft: 8 }}>打印</Button>
          <Button icon={<DownloadOutlined />} style={{ marginLeft: 8 }}>导出</Button>
        </div>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {/* 资产 */}
          <Col span={12}>
            <Card
              size="small"
              title={<><Tag color="#fa8c16">资产</Tag> <Text type="secondary" style={{ fontSize: 13 }}>{data?.period}</Text></>}
            >
              <Table
                columns={columns}
                dataSource={renderRows(data?.assets)}
                pagination={false}
                size="small"
                showHeader={false}
                summary={() => data && (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}><Text strong>资产合计</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong>{data.totalAssets.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            </Card>
          </Col>

          {/* 负债 + 权益 */}
          <Col span={12}>
            <Card
              size="small"
              title={<><Tag color="#1890ff">负债</Tag></>}
            >
              <Table
                columns={columns}
                dataSource={renderRows(data?.liabilities)}
                pagination={false}
                size="small"
                showHeader={false}
                summary={() => data && (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}><Text strong>负债合计</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong>{(data.totalLiabilitiesAndEquity / 2).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            </Card>

            <Card size="small" title={<><Tag color="#52c41a">所有者权益</Tag></>} style={{ marginTop: 12 }}>
              <Table
                columns={columns}
                dataSource={renderRows(data?.equity)}
                pagination={false}
                size="small"
                showHeader={false}
                summary={() => data && (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}><Text strong>所有者权益合计</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong>{(data.totalLiabilitiesAndEquity / 2).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            </Card>

            <Card size="small" style={{ marginTop: 12, background: '#fafafa' }} bodyStyle={{ padding: '8px 16px' }}>
              <Row justify="space-between">
                <Text strong>负债和所有者权益合计：</Text>
                <Text strong style={{ fontSize: 16, color: '#f5222d' }}>
                  {data?.totalLiabilitiesAndEquity.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </Text>
              </Row>
            </Card>
          </Col>
        </Row>

        {!data && !loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
            <Text type="secondary">请选择客户和期间查看资产负债表</Text>
          </div>
        )}
      </Spin>
    </div>
  );
};

export default FinanceBalanceSheetPage;
