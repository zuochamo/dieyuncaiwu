import React, { useEffect, useState } from 'react';
import { Table, Card, Typography, Tag, Space, Button, Input, DatePicker, Spin, message, Modal, Form, Select, Row, Col, Popconfirm } from 'antd';
import { SearchOutlined, PlusOutlined, CheckCircleOutlined, EditOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTenant } from '../../tenant/TenantContext';
import api from '../../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Voucher {
  id: string;
  voucherNo: string;
  date: string;
  period: string;
  status: string;
  entries?: any[];
}

const VoucherPage: React.FC = () => {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [keyword, setKeyword] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  // 凭证详情
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailVoucher, setDetailVoucher] = useState<any>(null);
  const [detailEntries, setDetailEntries] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchVouchers = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const params: any = { tenantId };
      if (keyword) params.keyword = keyword;
      if (statusFilter) params.status = statusFilter;
      if (dateRange && dateRange[0]) params.startDate = dateRange[0].format('YYYY-MM-DD');
      if (dateRange && dateRange[1]) params.endDate = dateRange[1].format('YYYY-MM-DD');
      const res = await api.get('/voucher/search', { params });
      setVouchers(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('获取凭证失败', e);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [tenantId]);

  const handleViewDetail = async (voucher: Voucher) => {
    setDetailOpen(true);
    setDetailVoucher(voucher);
    setDetailLoading(true);
    try {
      const res = await api.get(`/voucher/${voucher.id}/entries`);
      setDetailEntries(Array.isArray(res) ? res : []);
    } catch {
      setDetailEntries([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePost = async (voucherId: string) => {
    try {
      await api.post('/voucher/post', { voucherId });
      message.success('过账成功');
      fetchVouchers();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '过账失败');
    }
  };

  const columns = [
    {
      title: '凭证号',
      dataIndex: 'voucherNo',
      width: 120,
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: '日期',
      dataIndex: 'date',
      width: 120,
    },
    {
      title: '期间',
      dataIndex: 'period',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (s: string) => {
        if (s === 'posted') return <Tag color="green">已过账</Tag>;
        if (s === 'draft') return <Tag color="orange">草稿</Tag>;
        return <Tag>{s}</Tag>;
      },
    },
    {
      title: '摘要',
      width: 200,
      render: (_: any, row: Voucher) => row.entries?.[0]?.summary || '-',
    },
    {
      title: '操作',
      width: 220,
      render: (_: any, row: Voucher) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(row)}>查看</Button>
          {row.status === 'draft' && (
            <Button size="small" type="primary" onClick={() => handlePost(row.id)}>过账</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>凭证管理</Title>
        <Button type="primary" icon={<PlusOutlined />}>新增凭证</Button>
      </div>

      {/* 筛选区 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Input
              placeholder="搜索凭证号/摘要"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onPressEnter={fetchVouchers}
              style={{ width: 220 }}
            />
          </Col>
          <Col>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={v => setDateRange(v)}
              style={{ width: 260 }}
            />
          </Col>
          <Col>
            <Select
              placeholder="状态筛选"
              value={statusFilter}
              onChange={v => setStatusFilter(v)}
              allowClear
              style={{ width: 120 }}
            >
              <Select.Option value="draft">草稿</Select.Option>
              <Select.Option value="posted">已过账</Select.Option>
            </Select>
          </Col>
          <Col>
            <Button type="primary" onClick={fetchVouchers}>查询</Button>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={vouchers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15, showTotal: t => `共 ${t} 条凭证` }}
        />
      </Card>

      {/* 凭证详情弹窗 */}
      <Modal
        title={`凭证详情 - ${detailVoucher?.voucherNo || ''}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={720}
      >
        <Spin spinning={detailLoading}>
          {detailVoucher && (
            <div style={{ marginBottom: 16 }}>
              <Space size="large">
                <Text>日期：{detailVoucher.date}</Text>
                <Text>期间：{detailVoucher.period}</Text>
                <Tag color={detailVoucher.status === 'posted' ? 'green' : 'orange'}>
                  {detailVoucher.status === 'posted' ? '已过账' : '草稿'}
                </Tag>
              </Space>
            </div>
          )}
          <Table
            size="small"
            pagination={false}
            dataSource={detailEntries}
            rowKey="id"
            columns={[
              { title: '摘要', dataIndex: 'summary', width: 200 },
              { title: '科目', dataIndex: 'subjectName', width: 160 },
              { title: '借方金额', dataIndex: 'debit', width: 120, align: 'right', render: (v: number) => v ? v.toLocaleString() : '' },
              { title: '贷方金额', dataIndex: 'credit', width: 120, align: 'right', render: (v: number) => v ? v.toLocaleString() : '' },
            ]}
            summary={() => {
              const totalDebit = detailEntries.reduce((s, e) => s + (Number(e.debit) || 0), 0);
              const totalCredit = detailEntries.reduce((s, e) => s + (Number(e.credit) || 0), 0);
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}><Text strong>合计</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right"><Text strong>{totalDebit.toLocaleString()}</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right"><Text strong>{totalCredit.toLocaleString()}</Text></Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </Spin>
      </Modal>
    </div>
  );
};

export default VoucherPage;
