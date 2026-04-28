import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, message, Space, Tabs } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../../api';
import { useTenant } from '../../tenant/TenantContext';

const InventoryList: React.FC = () => {
  const [items, setItems] = useState([]);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [txnType, setTxnType] = useState<'in' | 'out'>('in');
  const [form] = Form.useForm();
  const [txnForm] = Form.useForm();
  const { tenantId } = useTenant();

  const fetchItems = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await api.get(`/inventory/items?tenantId=${tenantId}`);
      setItems(res as any);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchTxns = async () => {
    if (!tenantId) return;
    try {
      const res = await api.get(`/inventory/transactions?tenantId=${tenantId}`);
      setTxns(res as any);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchTxns();
  }, [tenantId]);

  const handleCreate = async (values: any) => {
    try {
      if (!tenantId) {
        message.error('请先选择租户');
        return;
      }
      await api.post('/inventory/items', { ...values, tenantId });
      message.success('商品创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchItems();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '创建失败');
    }
  };

  const openTxnModal = (type: 'in' | 'out') => {
    setTxnType(type);
    setTxnModalOpen(true);
    txnForm.resetFields();
    txnForm.setFieldsValue({
      date: undefined,
      qty: 1,
      amount: 0,
    });
  };

  const handleTxn = async (values: any) => {
    try {
      if (!tenantId) {
        message.error('请先选择租户');
        return;
      }
      const payload = {
        tenantId,
        itemId: values.itemId,
        type: txnType,
        qty: Number(values.qty),
        amount: Number(values.amount),
        date: values.date.format('YYYY-MM-DD'),
      };
      await api.post(txnType === 'in' ? '/inventory/in' : '/inventory/out', payload);
      message.success(txnType === 'in' ? '入库成功' : '出库成功');
      setTxnModalOpen(false);
      fetchTxns();
    } catch (e: any) {
      message.error(e?.response?.data?.message || (txnType === 'in' ? '入库失败' : '出库失败'));
    }
  };

  const columns = [
    { title: '商品名称', dataIndex: 'name' },
    { title: '分类', dataIndex: 'category' },
    { title: '单位', dataIndex: 'unit' },
  ];

  const txnColumns = [
    { title: '日期', dataIndex: 'date', width: 120 },
    { title: '类型', dataIndex: 'type', width: 80, render: (t: string) => (t === 'in' ? '入库' : '出库') },
    { title: '商品ID', dataIndex: 'itemId', width: 260 },
    { title: '数量', dataIndex: 'qty', width: 120 },
    { title: '金额', dataIndex: 'amount', width: 120, render: (v: number) => `¥${Number(v).toFixed(2)}` },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>库存管理</h2>
        <Space>
          <Button onClick={() => openTxnModal('in')}>入库</Button>
          <Button onClick={() => openTxnModal('out')}>出库</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            新增商品
          </Button>
        </Space>
      </div>
      <Tabs
        defaultActiveKey="items"
        items={[
          {
            key: 'items',
            label: '商品',
            children: <Table columns={columns} dataSource={items} rowKey="id" loading={loading} />,
          },
          {
            key: 'txns',
            label: '库存流水',
            children: <Table columns={txnColumns} dataSource={txns} rowKey="id" loading={loading} />,
          },
        ]}
      />

      <Modal title="新增商品" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="商品名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Input />
          </Form.Item>
          <Form.Item name="unit" label="单位">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={txnType === 'in' ? '入库' : '出库'}
        open={txnModalOpen}
        onCancel={() => setTxnModalOpen(false)}
        onOk={() => txnForm.submit()}
      >
        <Form form={txnForm} layout="vertical" onFinish={handleTxn}>
          <Form.Item name="itemId" label="商品" rules={[{ required: true }]}>
            <Select
              placeholder="选择商品"
              options={(items as any[]).map((i: any) => ({ value: i.id, label: i.name }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="date" label="日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="qty" label="数量" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="amount"
            label={txnType === 'in' ? '金额（入库金额）' : '金额（出库会按移动平均成本重算）'}
            rules={[{ required: true }]}
            initialValue={0}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryList;
