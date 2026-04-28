import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useTenant } from '../../tenant/TenantContext';

interface Voucher {
  id: string;
  voucherNo: string;
  docType?: string;
  number?: string;
  period?: string;
  attachmentsCount?: number;
  date: string;
  sourceType: string;
  status: string;
}

const VoucherList: React.FC = () => {
  const [data, setData] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { tenantId } = useTenant();

  const fetchData = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await api.get(`/voucher?tenantId=${tenantId}`);
      const list =
        Array.isArray(res) ? res :
        Array.isArray((res as any)?.body) ? (res as any).body :
        Array.isArray((res as any)?.body?.data) ? (res as any).body.data :
        [];
      setData(list as any);
    } catch (e) {
      console.error(e);
      message.error('获取凭证列表失败');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tenantId]);

  const handlePost = async (voucherId: string) => {
    try {
      await api.post('/voucher/post', { voucherId });
      message.success('过账成功');
      fetchData();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '过账失败');
    }
  };

  const columns = [
    {
      title: '凭证号',
      render: (_: any, row: Voucher) => {
        const docType = row.docType || (row.voucherNo || '').split('-')[0];
        const number = row.number || (row.voucherNo || '').split('-')[1];
        return docType && number ? `${docType}-${number}` : row.voucherNo;
      },
    },
    { title: '期间', dataIndex: 'period', width: 90 },
    { title: '日期', dataIndex: 'date' },
    { title: '附件', dataIndex: 'attachmentsCount', width: 70 },
    { title: '来源', dataIndex: 'sourceType', render: (t: string) => ({ manual: '手动', invoice: '发票', inventory: '库存', asset: '资产', 'legacy-import': '旧账导入' }[t] || t) },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === 'posted' ? 'green' : 'orange'}>{s === 'posted' ? '已过账' : '草稿'}</Tag> },
    {
      title: '操作',
      render: (_: any, row: Voucher) => (
        <Space>
          <Button size="small" onClick={() => navigate(`/voucher/edit/${row.id}`)}>
            查看
          </Button>
          {row.status !== 'posted' && (
            <Popconfirm
              title="确认过账这张凭证？"
              okText="过账"
              cancelText="取消"
              onConfirm={() => handlePost(row.id)}
            >
              <Button size="small" type="primary">
                过账
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>凭证管理</h2>
        <Button className="dui-btn-warning" icon={<PlusOutlined />} onClick={() => navigate('/voucher/create')}>
          新建凭证
        </Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
    </div>
  );
};

export default VoucherList;
