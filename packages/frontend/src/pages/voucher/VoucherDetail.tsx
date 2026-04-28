import React, { useEffect, useMemo, useState } from 'react';
import { Button, Space, Table, Tag, message } from 'antd';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../api';
import { AmountBoxes } from '../../components/AmountBoxes';

interface Voucher {
  id: string;
  voucherNo: string;
  tenantId: string;
  period?: string;
  docType?: string;
  number?: string;
  attachmentsCount?: number;
  date: string;
  sourceType: string;
  status: string;
  sourceId?: string | null;
}

interface VoucherEntry {
  id: string;
  voucherId: string;
  subjectId: string;
  assistantType?: string | null;
  assistantId?: string | null;
  quantity?: number | null;
  unit?: string | null;
  fcurCode?: string | null;
  exchangeRate?: number | null;
  fcurAmount?: number | null;
  summary?: string;
  debit: string | number;
  credit: string | number;
}

type Title = {
  id: string;
  code: string;
  fullName: string;
  useAssistant: boolean;
  assistantType?: string;
  auxiliaryTypes?: string[];
  useQuantity: boolean;
  unit?: string | null;
  useFcur: boolean;
  fcurCode?: string | null;
};

type AssistantItem = {
  id: number;
  code: string;
  name: string;
};

const VoucherDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // finance.html 模式下没有 <Routes>，useParams() 拿不到 id；兜底从 pathname 解析
  const voucherId = useMemo(() => {
    if (id) return id;
    const parts = (location.pathname || '').split('/').filter(Boolean);
    const idx = parts.indexOf('voucher');
    return idx >= 0 ? parts[idx + 1] : undefined;
  }, [id, location.pathname]);

  const [loading, setLoading] = useState(false);
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [entries, setEntries] = useState<VoucherEntry[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [assistantMap, setAssistantMap] = useState<Record<string, AssistantItem[]>>({});

  const titleById = useMemo(() => {
    const m = new Map<string, Title>();
    for (const t of titles) m.set(t.id, t);
    return m;
  }, [titles]);

  const sourceLabel = useMemo(
    () =>
      (t: string) =>
        ({ manual: '手动', invoice: '发票', inventory: '库存', asset: '资产', 'legacy-import': '旧账导入' } as any)[t] || t,
    [],
  );

  const loadCached = async (tenantId: string) => {
    try {
      const res = (await api.get(`/voucher/getCachedTitleAndAssistant?tenantId=${tenantId}`)) as any;
      const data = res?.body?.data;
      if (data?.titleList) setTitles(data.titleList);
      if (data?.assistantMap) setAssistantMap(data.assistantMap);
    } catch (e) {
      console.error(e);
    }
  };

  const load = async () => {
    if (!voucherId) return;
    setLoading(true);
    try {
      const vRaw = await api.get(`/voucher/${voucherId}`);
      const eRaw = await api.get(`/voucher/${voucherId}/entries`);

      const v = (vRaw as any)?.body ?? vRaw;
      const e =
        Array.isArray(eRaw) ? eRaw :
        Array.isArray((eRaw as any)?.body) ? (eRaw as any).body :
        Array.isArray((eRaw as any)?.body?.data) ? (eRaw as any).body.data :
        [];

      setVoucher(v as any);
      setEntries((e as any) || []);
      const tenantId = (v as any)?.tenantId as string | undefined;
      if (tenantId) loadCached(tenantId);

      // finance.html：把当前 tab 标题更新为“凭证号”
      const title = String((v as any)?.voucherNo || '').trim();
      if (title) {
        window.dispatchEvent(new CustomEvent('finance-tabs:update-title', { detail: { key: location.pathname, title } }));
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || '获取凭证详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [voucherId]);

  const handlePost = async () => {
    if (!voucher) return;
    try {
      await api.post('/voucher/post', { voucherId: voucher.id });
      message.success('过账成功');
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.message || '过账失败');
    }
  };

  const totals = useMemo(() => {
    const debit = entries.reduce((s, e) => s + (Number(e.debit) || 0), 0);
    const credit = entries.reduce((s, e) => s + (Number(e.credit) || 0), 0);
    return { debit, credit };
  }, [entries]);

  const entryColumns = [
    { title: '行次', width: 60, render: (_: any, __: any, idx: number) => idx + 1 },
    { title: '摘要', dataIndex: 'summary', width: 260, render: (v: any) => <div style={{ minHeight: 44 }}>{v || ''}</div> },
    {
      title: '会计科目',
      dataIndex: 'subjectId',
      width: 420,
      render: (v: any) => {
        const t = titleById.get(String(v));
        return <div style={{ minHeight: 44 }}>{t ? `${t.code} ${t.fullName}` : String(v)}</div>;
      },
    },
    {
      title: '辅助核算',
      width: 260,
      render: (_: any, row: VoucherEntry) => {
        const t = titleById.get(row.subjectId);
        const assistantType = (row.assistantType || t?.assistantType || t?.auxiliaryTypes?.[0] || '') as string;
        const list = (assistantType && assistantMap[assistantType]) || [];
        const hit = row.assistantId ? list.find((x) => String(x.id) === String(row.assistantId)) : null;
        if (!t?.useAssistant) return <div style={{ minHeight: 44 }}>-</div>;
        return <div style={{ minHeight: 44 }}>{hit ? `${hit.code} ${hit.name}` : row.assistantId ? String(row.assistantId) : '-'}</div>;
      },
    },
    {
      title: '数量',
      width: 120,
      render: (_: any, row: VoucherEntry) => <div style={{ minHeight: 44 }}>{row.quantity ?? ''}</div>,
    },
    {
      title: '单位',
      width: 90,
      render: (_: any, row: VoucherEntry) => <div style={{ minHeight: 44 }}>{row.unit ?? ''}</div>,
    },
    {
      title: '币种',
      width: 90,
      render: (_: any, row: VoucherEntry) => <div style={{ minHeight: 44 }}>{row.fcurCode ?? ''}</div>,
    },
    {
      title: '汇率',
      width: 110,
      render: (_: any, row: VoucherEntry) => <div style={{ minHeight: 44 }}>{row.exchangeRate ?? ''}</div>,
    },
    {
      title: '外币金额',
      width: 140,
      render: (_: any, row: VoucherEntry) => <div style={{ minHeight: 44 }}>{row.fcurAmount ?? ''}</div>,
    },
    { title: '借方金额', dataIndex: 'debit', render: (v: any) => <AmountBoxes value={Number(v) || 0} /> },
    { title: '贷方金额', dataIndex: 'credit', render: (v: any) => <AmountBoxes value={Number(v) || 0} /> },
  ];

  return (
    <div>
      <div className="voucher-paper">
        <div className="voucher-toolbar">
          <Space>
            <Button
              onClick={() => {
                // 返回列表并关闭当前 tab（finance.html 标签页模式）
                window.dispatchEvent(new CustomEvent('finance-tabs:close', { detail: { key: location.pathname, fallbackKey: '/voucher' } }));
                navigate('/voucher');
              }}
            >
              返回
            </Button>
            <Button
              onClick={() => {
                if (!voucherId) return;
                navigate(`/voucher/edit/${voucherId}`);
              }}
            >
              编辑
            </Button>
            <Button className="dui-btn-primary-bordered" onClick={() => window.print()}>
              打印
            </Button>
          </Space>
          <Space>
            {voucher?.status !== 'posted' && (
              <Button className="dui-btn-warning" onClick={handlePost}>
                过账
              </Button>
            )}
            <Button disabled>保存模板</Button>
            <Button danger disabled>删除</Button>
          </Space>
        </div>

        <div className="voucher-header">
          <div className="voucher-title">记账凭证</div>
          <div className="voucher-meta">
            <span>
              凭证号：
              {voucher
                ? `${voucher.docType || (voucher.voucherNo || '').split('-')[0]}-${voucher.number || (voucher.voucherNo || '').split('-')[1]}`
                : '-'}
            </span>
            <span>期间：{voucher?.period || '-'}</span>
            <span>日期：{voucher?.date || '-'}</span>
            <span>附件：{voucher?.attachmentsCount ?? 0}</span>
            <span>
              状态：
              <Tag style={{ marginInlineStart: 6 }} color={voucher?.status === 'posted' ? 'green' : 'orange'}>
                {voucher?.status === 'posted' ? '已过账' : '草稿'}
              </Tag>
            </span>
            <span>来源：{voucher ? sourceLabel(voucher.sourceType) : '-'}</span>
          </div>
        </div>

        <div className="voucher-grid">
          <Table
            size="small"
            loading={loading}
            columns={entryColumns as any}
            dataSource={entries}
            rowKey="id"
            pagination={false}
            scroll={{ x: 2000 }}
          />
        </div>

        <div className="voucher-total">
          <div className="voucher-total-label">合计</div>
          <div style={{ width: 380 }}>
            <AmountBoxes value={totals.debit} />
          </div>
          <div style={{ width: 380 }}>
            <AmountBoxes value={totals.credit} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherDetail;

