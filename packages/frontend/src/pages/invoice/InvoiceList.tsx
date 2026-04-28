import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useTenant } from '../../tenant/TenantContext';

interface Invoice {
  id: string;
  type: string;
  date: string;
  amount: number;
  tax: number;
  customerName: string;
  status: string;
}

const InvoiceList: React.FC = () => {
  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { tenantId } = useTenant();

  const fetchData = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await api.get(`/invoice?tenantId=${tenantId}`);
      setData(res as any);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tenantId]);

  const columns = [
    { title: '类型', dataIndex: 'type', render: (t: string) => <Tag color={t === 'input' ? 'blue' : 'green'}>{t === 'input' ? '进项' : '销项'}</Tag> },
    { title: '日期', dataIndex: 'date' },
    { title: '金额', dataIndex: 'amount', render: (v: number) => `¥${Number(v).toFixed(2)}` },
    { title: '税额', dataIndex: 'tax', render: (v: number) => `¥${Number(v).toFixed(2)}` },
    { title: '客户', dataIndex: 'customerName' },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>发票管理</h2>
        <Button type="primary" icon={<UploadOutlined />} onClick={() => navigate('/invoice/import')}>
          导入 Excel
        </Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
    </div>
  );
};

export default InvoiceList;
