import React, { useState } from 'react';
import { Table, Button, Space, Typography, Card, Tag, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, DeleteOutlined, UndoOutlined, EditOutlined, BankOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useTenant } from '../../tenant/TenantContext';

interface Customer {
  id: string;
  name: string;
  industryType?: string;
  startPeriod?: string;
  status?: string;
  createdAt?: string;
  deletedAt?: string;
}

const FinanceModule: React.FC = () => {
  const { allTenants, loading, refreshTenants, setTenantId } = useTenant();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 建立账务
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupForm] = Form.useForm();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [setupSubmitting, setSetupSubmitting] = useState(false);

  const customers = allTenants as Customer[];

  const getStatusTag = (status?: string) => {
    if (status === 'active') return <Tag color="green">已建账</Tag>;
    if (status === 'pending') return <Tag color="orange">待建账</Tag>;
    return <Tag>{status || '未知'}</Tag>;
  };

  // 进账套 - 在浏览器新标签页打开财务模块
  const handleEnterFinance = (customer: Customer) => {
    localStorage.setItem('finance_tenant_id', customer.id);
    localStorage.setItem('finance_tenant_name', customer.name);
    window.open('/finance.html', '_blank');
  };

  // 新建客户
  const handleCreate = async (values: { name: string; industryType?: string }) => {
    setSubmitting(true);
    try {
      const { default: api } = await import('../../api');
      await api.post('/tenant', values);
      message.success('客户创建成功');
      setCreateModalOpen(false);
      form.resetFields();
      await refreshTenants();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 建立账务
  const openSetupModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setupForm.setFieldsValue({ startPeriod: '' });
    setSetupModalOpen(true);
  };

  const handleSetup = async (values: { startPeriod: string }) => {
    if (!selectedCustomer) return;
    setSetupSubmitting(true);
    try {
      const { default: api } = await import('../../api');
      await api.post(`/tenant/${selectedCustomer.id}/setup-account`, values);
      message.success('账务建立成功');
      setSetupModalOpen(false);
      setupForm.resetFields();
      setSelectedCustomer(null);
      await refreshTenants();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '建立账务失败');
    } finally {
      setSetupSubmitting(false);
    }
  };

  const columns = [
    {
      title: '客户名称',
      dataIndex: 'name',
      width: 200,
      render: (name: string) => (
        <Space>
          <BankOutlined style={{ color: '#1890ff' }} />
          <Typography.Text strong>{name}</Typography.Text>
        </Space>
      ),
    },
    { title: '行业', dataIndex: 'industryType', width: 120, render: (v: string) => v || '-' },
    { title: '启用期间', dataIndex: 'startPeriod', width: 100, render: (v: string) => v || '-' },
    { title: '状态', dataIndex: 'status', width: 100, render: (v: string) => getStatusTag(v) },
    { title: '创建时间', dataIndex: 'createdAt', width: 180, render: (v: string) => v ? new Date(v).toLocaleString() : '-' },
    {
      title: '操作',
      width: 200,
      render: (_: any, row: Customer) => (
        <Space size="small">
          {row.status === 'active' ? (
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => handleEnterFinance(row)}>
              进账套
            </Button>
          ) : (
            <Button type="primary" onClick={() => openSetupModal(row)}>
              建立账务
            </Button>
          )}
          <Button size="small" icon={<EditOutlined />}>编辑</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Typography.Title level={4} style={{ marginBottom: 8 }}>财务模块</Typography.Title>
          <Typography.Text type="secondary">管理客户账套，进入财务系统进行凭证、发票、报表等操作</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
          新建客户
        </Button>
      </div>

      <Card>
        <Table
          columns={columns as any}
          dataSource={customers as any}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total: number) => `共 ${total} 条` }}
        />
      </Card>

      <div style={{ marginTop: 16, padding: 14, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
        <Typography.Text type="secondary">
          💡 提示：新建客户后需先"建立账务"初始化会计科目，然后点击"进账套"在新窗口打开财务管理系统。
        </Typography.Text>
      </div>

      {/* 新建客户弹窗 */}
      <Modal
        title="新建客户"
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="name" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          <Form.Item name="industryType" label="行业类型">
            <Select placeholder="请选择行业">
              <Select.Option value="服务业">服务业</Select.Option>
              <Select.Option value="制造业">制造业</Select.Option>
              <Select.Option value="零售业">零售业</Select.Option>
              <Select.Option value="建筑业">建筑业</Select.Option>
              <Select.Option value="餐饮业">餐饮业</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => { setCreateModalOpen(false); form.resetFields(); }}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 建立账务弹窗 */}
      <Modal
        title={`建立账务 - ${selectedCustomer?.name || ''}`}
        open={setupModalOpen}
        onCancel={() => { setSetupModalOpen(false); setSelectedCustomer(null); }}
        footer={null}
      >
        <Form form={setupForm} onFinish={handleSetup} layout="vertical">
          <Form.Item name="startPeriod" label="启用期间" rules={[{ required: true, message: '请输入启用期间' }]}>
            <Input placeholder="格式：2024-01" />
          </Form.Item>
          <div style={{ color: '#888', marginBottom: 16 }}>
            设置启用期间后，系统将自动初始化会计科目，该客户即可进入账套使用。
          </div>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => { setSetupModalOpen(false); setSelectedCustomer(null); }}>取消</Button>
              <Button type="primary" htmlType="submit" loading={setupSubmitting}>确认建立</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FinanceModule;
