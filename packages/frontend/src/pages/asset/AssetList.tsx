import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../../api';
import { useTenant } from '../../tenant/TenantContext';

const AssetList: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { tenantId } = useTenant();

  const fetchData = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await api.get(`/asset?tenantId=${tenantId}`);
      setData(res as any);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tenantId]);

  const handleCreate = async (values: any) => {
    try {
      if (!tenantId) {
        message.error('请先选择租户');
        return;
      }
      await api.post('/asset', {
        ...values,
        tenantId,
        startDate: values.startDate.format('YYYY-MM-DD'),
      });
      message.success('资产创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '创建失败');
    }
  };

  const handleDepreciation = async () => {
    const period = new Date().toISOString().slice(0, 7);
    try {
      if (!tenantId) {
        message.error('请先选择租户');
        return;
      }
      const res = await api.post('/asset/depreciation/run', { tenantId, period });
      message.success(`折旧计算完成，共 ${(res as any).length} 条记录`);
    } catch (e: any) {
      message.error(e?.response?.data?.message || '折旧计算失败');
    }
  };

  const columns = [
    { title: '资产名称', dataIndex: 'name' },
    { title: '原值', dataIndex: 'originalValue', render: (v: number) => `¥${Number(v).toFixed(2)}` },
    { title: '残值率', dataIndex: 'residualRate', render: (v: number) => `${(Number(v) * 100).toFixed(1)}%` },
    { title: '使用年限(月)', dataIndex: 'usefulLife' },
    { title: '启用日期', dataIndex: 'startDate' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>固定资产管理</h2>
        <div>
          <Button onClick={handleDepreciation} style={{ marginRight: 8 }}>运行本月折旧</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            新增资产
          </Button>
        </div>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />

      <Modal title="新增固定资产" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="资产名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="originalValue" label="原值" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="residualRate" label="残值率" initialValue={0.05}>
            <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="usefulLife" label="使用年限(月)" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="startDate" label="启用日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AssetList;
