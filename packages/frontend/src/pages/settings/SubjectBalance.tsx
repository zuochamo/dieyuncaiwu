import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, message, Select, Card, Tabs, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import api from '../../api';
import { useTenant } from '../../tenant/TenantContext';

interface Subject {
  id: string;
  code: string;
  name: string;
  fullName?: string;
  type: string;
  direction: string;
  level: number;
  parentId?: string;
}

interface Balance {
  id: string;
  subjectId: string;
  period: string;
  openingBalance: number;
  debitTotal: number;
  creditTotal: number;
}

interface EditingBalance {
  [subjectId: string]: number;
}

const SubjectBalance: React.FC = () => {
  const { tenantId } = useTenant();
  const [activeTab, setActiveTab] = useState('subjects');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 科目页签筛选
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 期初余额相关状态
  const [balanceData, setBalanceData] = useState<Balance[]>([]);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [editingBalances, setEditingBalances] = useState<EditingBalance>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchSubjects();
      fetchBalances();
    }
  }, [tenantId]);

  const fetchSubjects = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await api.get('/voucher/getCachedTitleAndAssistant', { params: { tenantId } });
      const body = (res as any)?.body || {};
      const titleList = body?.data?.titleList || [];
      setSubjects(titleList.map((t: any) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        fullName: t.fullName,
        type: t.type,
        direction: t.direction === 1 ? 'debit' : 'credit',
        level: t.level || 1,
        parentId: t.pId || null,
      })));
    } catch (e) {
      console.error('获取科目失败', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalances = async () => {
    if (!tenantId) return;
    try {
      const res = await api.get('/report/ledger', { params: { tenantId, period } });
      const body = (res as any);
      const data = Array.isArray(body) ? body : (body?.body || []);
      setBalanceData(data);
      const edits: EditingBalance = {};
      data.forEach((b: Balance) => {
        edits[b.subjectId] = b.openingBalance;
      });
      setEditingBalances(edits);
      setHasChanges(false);
    } catch (e) {
      console.error('获取余额失败', e);
    }
  };

  const getBalanceBySubject = (subjectId: string) => {
    return balanceData.find(b => b.subjectId === subjectId);
  };

  const handleBalanceChange = (subjectId: string, value: number | null) => {
    setEditingBalances(prev => ({
      ...prev,
      [subjectId]: value || 0,
    }));
    setHasChanges(true);
  };

  const handleSaveBalance = async (subjectId: string) => {
    const value = editingBalances[subjectId] || 0;
    try {
      await api.post('/report/ledger', {
        tenantId,
        subjectId,
        period,
        openingBalance: value,
        debitTotal: 0,
        creditTotal: 0,
      });
      message.success('保存成功');
      fetchBalances();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '保存失败');
    }
  };

  const handleSaveAllBalances = async () => {
    try {
      for (const subjectId of Object.keys(editingBalances)) {
        await api.post('/report/ledger', {
          tenantId,
          subjectId,
          period,
          openingBalance: editingBalances[subjectId] || 0,
          debitTotal: 0,
          creditTotal: 0,
        });
      }
      message.success('全部保存成功');
      fetchBalances();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '保存失败');
    }
  };

  // 科目相关操作
  const handleOpenSubjectModal = (subject?: Subject) => {
    setEditingSubject(subject || null);
    if (subject) {
      subjectForm.setFieldsValue({
        code: subject.code,
        name: subject.name,
        type: subject.type,
        direction: subject.direction === 'debit' ? 1 : 0,
      });
    } else {
      subjectForm.resetFields();
    }
    setSubjectModalOpen(true);
  };

  const handleSaveSubject = async (values: any) => {
    setSubmitting(true);
    try {
      const payload = {
        tenantId,
        code: values.code,
        name: values.name,
        type: values.type,
        direction: values.direction,
      };

      if (editingSubject) {
        await api.put(`/voucher/title/${editingSubject.id}`, payload);
        message.success('科目修改成功');
      } else {
        await api.post('/voucher/title', payload);
        message.success('科目新增成功');
      }
      setSubjectModalOpen(false);
      fetchSubjects();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    try {
      await api.delete(`/voucher/title/${subject.id}`, { params: { tenantId } });
      message.success('删除成功');
      fetchSubjects();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '删除失败');
    }
  };

  const getTypeName = (type: string) => {
    const map: Record<string, string> = {
      asset: '资产',
      liability: '负债',
      equity: '权益',
      income: '收入',
      expense: '费用',
      cost: '成本',
      profit: '损益',
    };
    return map[type] || type;
  };

  // 分类标签配置
  const categoryTabs = [
    { key: 'all', label: '全部', color: '#1890ff' },
    { key: 'asset', label: '资产', color: '#1890ff' },
    { key: 'liability', label: '负债', color: '#ff4d4f' },
    { key: 'equity', label: '权益', color: '#52c41a' },
    { key: 'cost', label: '成本', color: '#722ed1' },
    { key: 'profit', label: '损益', color: '#fa8c16' },
  ];

  // 科目过滤逻辑
  const filteredSubjects = subjects.filter(s => {
    const typeMatch = typeFilter === 'all' || s.type === typeFilter;
    const searchMatch = !searchKeyword || 
      s.code.includes(searchKeyword) || 
      s.name.includes(searchKeyword) ||
      (s.fullName && s.fullName.includes(searchKeyword));
    return typeMatch && searchMatch;
  });

  // 格式化数字显示
  const formatNumber = (num: number) => {
    if (typeof num !== 'number' || isNaN(num)) return '0.00';
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 2 });
  };

  // 计算试算平衡
  const trialBalance = (() => {
    let totalDebit = 0;
    let totalCredit = 0;

    (filteredSubjects || []).forEach(subject => {
      const balance = editingBalances[subject.id] || 0;
      if (balance !== 0) {
        if (subject.direction === 'debit') {
          totalDebit += balance;
        } else {
          totalCredit += balance;
        }
      }
    });

    return {
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      difference: totalDebit - totalCredit,
    };
  })();

  // 科目表格列
  const subjectColumns = [
    {
      title: '科目编码',
      dataIndex: 'code',
      width: 120,
      render: (code: string, row: Subject) => (
        <span style={{ paddingLeft: (row.level - 1) * 16, fontWeight: row.level === 1 ? 600 : 400 }}>
          {code}
        </span>
      ),
    },
    { 
      title: '科目名称', 
      dataIndex: 'name', 
      width: 200,
      render: (name: string, row: Subject) => (
        <span style={{ fontWeight: row.level === 1 ? 600 : 400 }}>{name}</span>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      render: (t: string) => {
        const colorMap: Record<string, string> = {
          asset: 'blue',
          liability: 'red',
          equity: 'green',
          income: 'orange',
          expense: 'purple',
          cost: 'purple',
          profit: 'orange',
        };
        return <Tag color={colorMap[t] || 'default'}>{getTypeName(t)}</Tag>;
      }
    },
    {
      title: '方向',
      dataIndex: 'direction',
      width: 60,
      render: (d: string) => (
        <Tag color={d === 'debit' ? 'blue' : 'red'}>
          {d === 'debit' ? '借' : '贷'}
        </Tag>
      )
    },
    {
      title: '操作',
      width: 150,
      render: (_: any, row: Subject) => (
        <Space size="small">
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => handleOpenSubjectModal(row)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该科目？"
            onConfirm={() => handleDeleteSubject(row)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 期初余额表格列
  const balanceColumns = [
    {
      title: '科目编码',
      dataIndex: 'code',
      width: 140,
      render: (code: string, row: Subject) => (
        <span style={{ 
          paddingLeft: (row.level - 1) * 16, 
          fontWeight: row.level === 1 ? 600 : 400,
          fontFamily: 'monospace'
        }}>
          {code}
        </span>
      ),
    },
    { 
      title: '科目名称', 
      dataIndex: 'name', 
      width: 200,
      render: (name: string, row: Subject) => (
        <span style={{ fontWeight: row.level === 1 ? 600 : 400 }}>{name}</span>
      )
    },
    { 
      title: '方向', 
      dataIndex: 'direction', 
      width: 60,
      render: (d: string) => (
        <Tag color={d === 'debit' ? 'blue' : 'red'}>
          {d === 'debit' ? '借' : '贷'}
        </Tag>
      )
    },
    {
      title: '期初余额',
      width: 160,
      align: 'right' as const,
      render: (_: any, row: Subject) => {
        const value = editingBalances[row.id] ?? 0;
        const hasOriginal = getBalanceBySubject(row.id);
        return (
          <InputNumber
            value={typeof value === 'number' ? value : 0}
            onChange={(val) => handleBalanceChange(row.id, val)}
            precision={2}
            style={{ 
              width: '100%',
              backgroundColor: hasOriginal ? '#fff' : '#fffbe6',
              fontFamily: 'monospace'
            }}
            placeholder="0.00"
          />
        );
      },
    },
    {
      title: '操作',
      width: 100,
      align: 'center' as const,
      render: (_: any, row: Subject) => {
        const original = getBalanceBySubject(row.id);
        const current = editingBalances[row.id] ?? 0;
        const isChanged = original && Math.abs(original.openingBalance - current) > 0.01;
        return (
          <Space size="small">
            {isChanged && (
              <Button 
                size="small" 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={() => handleSaveBalance(row.id)}
              >
                保存
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'subjects',
              label: '科目',
              children: (
                <div>
                  {/* 顶部工具栏 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Space>
                      {/* 搜索框 */}
                      <Input
                        placeholder="搜索编码/名称"
                        prefix={<SearchOutlined />}
                        value={searchKeyword}
                        onChange={e => setSearchKeyword(e.target.value)}
                        style={{ width: 200 }}
                        allowClear
                      />
                      {/* 分类快速定位标签 */}
                      <Space size={4}>
                        {categoryTabs.map(tab => (
                          <Button
                            key={tab.key}
                            type={typeFilter === tab.key ? 'primary' : 'default'}
                            size="small"
                            onClick={() => setTypeFilter(tab.key)}
                            style={{
                              backgroundColor: typeFilter === tab.key ? tab.color : undefined,
                              borderColor: tab.color,
                              minWidth: 48,
                            }}
                          >
                            {tab.label}
                          </Button>
                        ))}
                      </Space>
                    </Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenSubjectModal()}>
                      新增科目
                    </Button>
                  </div>

                  {/* 科目列表 */}
                  <Table
                    columns={subjectColumns as any}
                    dataSource={filteredSubjects as any}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 20, size: 'small', showTotal: (total: number) => `共 ${total} 条` }}
                    size="small"
                  />
                </div>
              ),
            },
            {
              key: 'balance',
              label: '期初',
              children: (
                <div>
                  {/* 顶部工具栏 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Space>
                      <Select
                        value={period}
                        onChange={(v) => setPeriod(v)}
                        style={{ width: 120 }}
                      >
                        {Array.from({ length: 12 }, (_, i) => {
                          const d = new Date();
                          d.setMonth(d.getMonth() - i);
                          const val = d.toISOString().slice(0, 7);
                          return (
                            <Select.Option key={val} value={val}>
                              {val}
                            </Select.Option>
                          );
                        })}
                      </Select>
                      <Button onClick={fetchBalances}>刷新</Button>
                      {/* 分类快速定位标签 */}
                      <Space size={4}>
                        {categoryTabs.map(tab => (
                          <Button
                            key={tab.key}
                            type={typeFilter === tab.key ? 'primary' : 'default'}
                            size="small"
                            onClick={() => setTypeFilter(tab.key)}
                            style={{
                              backgroundColor: typeFilter === tab.key ? tab.color : undefined,
                              borderColor: tab.color,
                              minWidth: 48,
                            }}
                          >
                            {tab.label}
                          </Button>
                        ))}
                      </Space>
                    </Space>
                    <Space>
                      {hasChanges && (
                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveAllBalances}>
                          保存全部
                        </Button>
                      )}
                    </Space>
                  </div>

                  {/* 试算平衡区域 */}
                  <Card 
                    size="small" 
                    style={{ 
                      marginBottom: 16, 
                      backgroundColor: trialBalance.isBalanced ? '#f6ffed' : '#fff2e8',
                      borderColor: trialBalance.isBalanced ? '#b7eb8f' : '#ffbb96'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 32 }}>
                        <div>
                          <span style={{ color: '#666' }}>借方合计：</span>
                          <span style={{ 
                            fontSize: 18, 
                            fontWeight: 600, 
                            color: '#1890ff',
                            fontFamily: 'monospace'
                          }}>
                            {formatNumber(trialBalance.totalDebit)}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>贷方合计：</span>
                          <span style={{ 
                            fontSize: 18, 
                            fontWeight: 600, 
                            color: '#ff4d4f',
                            fontFamily: 'monospace'
                          }}>
                            {formatNumber(trialBalance.totalCredit)}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>差额：</span>
                          <span style={{ 
                            fontSize: 18, 
                            fontWeight: 600, 
                            color: Math.abs(trialBalance.difference) < 0.01 ? '#52c41a' : '#ff4d4f',
                            fontFamily: 'monospace'
                          }}>
                            {formatNumber(trialBalance.difference)}
                          </span>
                        </div>
                      </div>
                      <div>
                        {trialBalance.isBalanced ? (
                          <Tag icon={<CheckCircleOutlined />} color="success">试算平衡</Tag>
                        ) : (
                          <Tag color="error"><CloseCircleOutlined /> 不平衡</Tag>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* 期初余额表格 */}
                  <Table
                    columns={balanceColumns as any}
                    dataSource={filteredSubjects as any}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 50, size: 'small', showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` }}
                    size="small"
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* 科目新增/编辑弹窗 */}
      <Modal
        title={editingSubject ? '编辑科目' : '新增科目'}
        open={subjectModalOpen}
        onCancel={() => { setSubjectModalOpen(false); setEditingSubject(null); subjectForm.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form form={subjectForm} onFinish={handleSaveSubject} layout="vertical">
          <Form.Item
            name="code"
            label="科目编码"
            rules={[{ required: true, message: '请输入科目编码' }]}
          >
            <Input placeholder="请输入科目编码，如：1001" />
          </Form.Item>
          <Form.Item
            name="name"
            label="科目名称"
            rules={[{ required: true, message: '请输入科目名称' }]}
          >
            <Input placeholder="请输入科目名称" />
          </Form.Item>
          <Form.Item
            name="type"
            label="科目类型"
            rules={[{ required: true, message: '请选择科目类型' }]}
          >
            <Select placeholder="请选择科目类型">
              <Select.Option value="asset">资产</Select.Option>
              <Select.Option value="liability">负债</Select.Option>
              <Select.Option value="equity">权益</Select.Option>
              <Select.Option value="cost">成本</Select.Option>
              <Select.Option value="income">收入</Select.Option>
              <Select.Option value="expense">费用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="direction"
            label="余额方向"
            rules={[{ required: true, message: '请选择余额方向' }]}
          >
            <Select placeholder="请选择余额方向">
              <Select.Option value={1}>借方</Select.Option>
              <Select.Option value={0}>贷方</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => { setSubjectModalOpen(false); setEditingSubject(null); subjectForm.resetFields(); }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubjectBalance;
