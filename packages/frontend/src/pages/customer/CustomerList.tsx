import React, { useState, useCallback } from 'react';
import { Button, Space, Table, message, Modal, Form, Input, Select, Tag, Card, Tabs, Popconfirm, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, UndoOutlined, EditOutlined, BankOutlined } from '@ant-design/icons';
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

const CustomerList: React.FC = () => {
  const { allTenants, loading, refreshTenants } = useTenant();
  const [activeTab, setActiveTab] = useState('active');

  // 新建客户
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 编辑客户
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

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

  // 正常客户列
  const activeColumns = [
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
      width: 280,
      render: (_: any, row: Customer) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEdit(row)}>
            编辑
          </Button>
          {row.status === 'pending' && (
            <Button size="small" type="primary" onClick={() => openSetupModal(row)}>
              建立账务
            </Button>
          )}
          <Popconfirm
            title="确定删除该客户？删除后可在回收站恢复。"
            onConfirm={() => handleDelete(row)}
            okText="删除"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 回收站客户列
  const recycleColumns = [
    {
      title: '客户名称',
      dataIndex: 'name',
      width: 200,
      render: (name: string) => (
        <Space>
          <BankOutlined style={{ color: '#999' }} />
          <Typography.Text delete type="secondary">{name}</Typography.Text>
        </Space>
      ),
    },
    { title: '行业', dataIndex: 'industryType', width: 120, render: (v: string) => v || '-' },
    { title: '原状态', dataIndex: 'status', width: 100, render: (v: string) => getStatusTag(v) },
    { title: '创建时间', dataIndex: 'createdAt', width: 180, render: (v: string) => v ? new Date(v).toLocaleString() : '-' },
    {
      title: '操作',
      width: 200,
      render: (_: any, row: Customer) => (
        <Space size="small">
          <Button size="small" type="primary" icon={<UndoOutlined />}>
            恢复
          </Button>
          <Popconfirm
            title="彻底删除该客户？此操作不可恢复。"
            okText="彻底删除"
            cancelText="取消"
          >
            <Button size="small" danger>彻底删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 区分正常客户和回收站客户
  const activeCustomers = customers; // 后端暂无软删除，全部显示为正常
  const recycledCustomers: Customer[] = []; // 回收站暂时为空

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

  // 编辑客户
  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    editForm.setFieldsValue({
      name: customer.name,
      industryType: customer.industryType,
    });
    setEditModalOpen(true);
  };

  const handleEdit = async (values: { name: string; industryType?: string }) => {
    if (!editingCustomer) return;
    setSubmitting(true);
    try {
      const { default: api } = await import('../../api');
      await api.put(`/tenant/${editingCustomer.id}`, values);
      message.success('客户修改成功');
      setEditModalOpen(false);
      setEditingCustomer(null);
      await refreshTenants();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '修改失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 删除客户
  const handleDelete = async (customer: Customer) => {
    try {
      const { default: api } = await import('../../api');
      await api.delete(`/tenant/${customer.id}`);
      message.success('客户已删除');
      await refreshTenants();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '删除失败');
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>客户管理</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
          新建客户
        </Button>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'active',
              label: `客户列表 (${activeCustomers.length})`,
              children: (
                <Table
                  columns={activeColumns as any}
                  dataSource={activeCustomers as any}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10, showTotal: (total: number) => `共 ${total} 条` }}
                />
              ),
            },
            {
              key: 'recycle',
              label: `回收站 (${recycledCustomers.length})`,
              children: (
                <Table
                  columns={recycleColumns as any}
                  dataSource={recycledCustomers as any}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  locale={{ emptyText: '回收站为空' }}
                />
              ),
            },
          ]}
        />
      </Card>

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

      {/* 编辑客户弹窗 */}
      <Modal
        title="编辑客户"
        open={editModalOpen}
        onCancel={() => { setEditModalOpen(false); setEditingCustomer(null); }}
        footer={null}
      >
        <Form form={editForm} onFinish={handleEdit} layout="vertical">
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
              <Button onClick={() => { setEditModalOpen(false); setEditingCustomer(null); }}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>保存</Button>
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

export default CustomerList;
