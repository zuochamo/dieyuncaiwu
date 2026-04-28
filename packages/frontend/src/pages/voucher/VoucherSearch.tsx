import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Select, Button, Table, Space, Card } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../api';
import { useTenant } from '../../tenant/TenantContext';

const { RangePicker } = DatePicker;

interface VoucherSearchItem {
  id: string;
  voucherNo: string;
  date: string;
  status: string;
  sourceType: string;
  attachmentsCount: number;
}

const VoucherSearch: React.FC = () => {
  const { tenantId } = useTenant();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [data, setData] = useState<VoucherSearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (values: any) => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { tenantId };
      if (values.keyword) params.keyword = values.keyword;
      if (values.status) params.status = values.status;
      if (values.dateRange) {
        params.startDate = values.dateRange[0].format('YYYY-MM-DD');
        params.endDate = values.dateRange[1].format('YYYY-MM-DD');
      }
      const res = await api.get('/voucher/search', { params });
      setData((res as any) || []);
    } catch (e) {
      console.error('搜索失败', e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setData([]);
  };

  const columns = [
    { title: '凭证号', dataIndex: 'voucherNo', width: 120 },
    { title: '日期', dataIndex: 'date', width: 120, render: (v: string) => v },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: string) => (v === 'posted' ? '已过账' : '草稿'),
    },
    { title: '来源', dataIndex: 'sourceType', width: 100, render: (t: string) => ({ manual: '手动', invoice: '发票', inventory: '库存', asset: '资产', 'legacy-import': '旧账导入' } as any)[t] || t },
    {
      title: '操作',
      width: 100,
      render: (_: any, row: VoucherSearchItem) => (
        <Button size="small" type="link" onClick={() => navigate(`/voucher/edit/${row.id}`)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>凭证查找</h2>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} onFinish={handleSearch} layout="inline">
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="凭证号/摘要" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择" allowClear style={{ width: 120 }}>
              <Select.Option value="draft">草稿</Select.Option>
              <Select.Option value="posted">已过账</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit" loading={loading}>
                查找
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Table
        columns={columns as any}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default VoucherSearch;
