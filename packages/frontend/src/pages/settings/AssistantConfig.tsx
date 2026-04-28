import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Card, Tag, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api';
import { useTenant } from '../../tenant/TenantContext';

interface AssistantItem {
  id: string;
  code: string;
  name: string;
  type: string;
  freezeStatus?: string;
}

const ASSISTANT_TYPES = [
  { value: 'customer', label: '客户' },
  { value: 'supplier', label: '供应商' },
  { value: 'department', label: '部门' },
  { value: 'person', label: '个人' },
  { value: 'project', label: '项目' },
  { value: 'inventory', label: '存货' },
];

const AssistantConfig: React.FC = () => {
  const { tenantId } = useTenant();
  const [assistants, setAssistants] = useState<AssistantItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AssistantItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (tenantId) {
      fetchAssistants();
    }
  }, [tenantId]);

  const fetchAssistants = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await api.get('/voucher/getCachedTitleAndAssistant', { params: { tenantId } });
      // API 返回结构: { head: {...}, body: { data: { assistantMap: {...} } } }
      const body = (res as any)?.body || {};
      const assistantMap: Record<string, any[]> = body?.data?.assistantMap || {};
      const items: AssistantItem[] = [];
      Object.entries(assistantMap).forEach(([type, list]) => {
        (list as any[]).forEach((item: any) => {
          items.push({
            id: String(item.id),
            code: item.code,
            name: item.name,
            type,
            freezeStatus: item.freezeStatus,
          });
        });
      });
      setAssistants(items);
    } catch (e) {
      console.error('获取辅助核算失败', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (item: AssistantItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      type: item.type,
      code: item.code,
      name: item.name,
    });
    setModalOpen(true);
  };

  const handleSave = async (values: any) => {
    try {
      if (editingItem) {
        await api.put(`/assistant/${editingItem.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/assistant', { ...values, tenantId });
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchAssistants();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/assistant/${id}`);
      message.success('删除成功');
      fetchAssistants();
    } catch (e) {
      message.error('删除失败');
    }
  };

  const getTypeLabel = (type: string) => {
    const found = ASSISTANT_TYPES.find(t => t.value === type);
    return found?.label || type;
  };

  const columns = [
    { title: '类型', dataIndex: 'type', width: 100, render: (t: string) => getTypeLabel(t) },
    { title: '编码', dataIndex: 'code', width: 120 },
    { title: '名称', dataIndex: 'name' },
    {
      title: '状态',
      dataIndex: 'freezeStatus',
      width: 80,
      render: (s: string) => s === '1' ? <Tag color="red">禁用</Tag> : <Tag color="green">正常</Tag>,
    },
    {
      title: '操作',
      width: 150,
      render: (_: any, row: AssistantItem) => (
        <Space>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => handleEdit(row)}>
            编辑
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(row.id)}>
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>辅助设置</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增辅助核算
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          {ASSISTANT_TYPES.map(t => (
            <Tag key={t.value} color="blue">{t.label}</Tag>
          ))}
        </div>
        <Table
          columns={columns as any}
          dataSource={assistants as any}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
          size="small"
        />
      </Card>

      <Modal
        title={editingItem ? '编辑辅助核算' : '新增辅助核算'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select placeholder="请选择类型" disabled={!!editingItem}>
              {ASSISTANT_TYPES.map(t => (
                <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="code"
            label="编码"
            rules={[{ required: true, message: '请输入编码' }]}
          >
            <Input placeholder="请输入编码" />
          </Form.Item>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AssistantConfig;