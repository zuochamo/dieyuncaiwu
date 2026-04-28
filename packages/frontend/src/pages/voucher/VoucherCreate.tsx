import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Form, Input, DatePicker, Button, Table, Select, message, Tag, Modal, Space, InputNumber } from 'antd';
import { PlusOutlined, PrinterOutlined, DeleteOutlined, SaveOutlined, FileAddOutlined, CopyOutlined, MoreOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useTenant } from '../../tenant/TenantContext';
import dayjs from 'dayjs';

type Title = {
  id: string; code: string; name: string; fullName: string;
  direction: 1 | -1; level: number; last: boolean;
  useAssistant: boolean; assistantType?: string; auxiliaryTypes?: string[];
  useAuxiliary: boolean; useQuantity: boolean; unit?: string | null;
  useFcur: boolean; fcurCode?: string | null; pinYinInitial?: string;
};

type AssistantItem = {
  id: number; code: string; name: string; pinYinInitial?: string;
  unit?: string | null; categoryFullName?: string | null;
  licenseNumber?: string | null; inventoryType?: string | null;
};

type CachedTitleAssistantResp = {
  head: any;
  body: { version: string; changed: boolean; data: null | { titleList: Title[]; assistantMap: Record<string, AssistantItem[]> } };
};

const AMOUNT_UNITS = ['十亿', '亿', '千万', '百万', '十万', '万', '千', '百', '十', '元', '角', '分'];

function periodFromDate(d: string) { return d.replace(/-/g, '').slice(0, 6); }
function fmt3(n: string) { const x = parseInt(n, 10); return Number.isFinite(x) ? String(x).padStart(3, '0') : n; }

function formatAmountToCells(value: number | string): string[] {
  const num = value === '' || value === null || value === undefined ? 0 : Number(value);
  if (!Number.isFinite(num)) return Array(12).fill('');
  const abs = Math.abs(num);
  const cents = Math.round(abs * 100);
  const intPart = Math.floor(cents / 100);
  const jiao = Math.floor((cents % 100) / 10);
  const fen = cents % 10;
  const digits = intPart.toString().padStart(10, '0').split('').slice(-10);
  return [...digits, String(jiao), String(fen)];
}

// 按位金额展示（只读）
const AmountDigitDisplay: React.FC<{ value: number }> = ({ value }) => {
  const cells = formatAmountToCells(value);
  return (
    <div style={{ display: 'flex', width: '100%' }}>
      {cells.map((d, i) => (
        <div key={i} style={{
          flex: 1, minWidth: 18, borderRight: i < 11 ? '1px solid #e8e8e8' : 'none',
          textAlign: 'center', fontSize: 12,
          fontWeight: d !== '0' ? 600 : 400, color: d === '0' ? '#ccc' : '#333', lineHeight: '20px',
        }}>{d === '0' ? '' : d}</div>
      ))}
    </div>
  );
};

type EntryRow = { key: string; summary: string; subjectId: string; subjectName: string; debit: number; credit: number };

const VoucherCreate: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId } = useTenant();

  const editingVoucherId = useMemo(() => {
    const parts = (location.pathname || '').split('/').filter(Boolean);
    // /voucher/edit/:id
    if (parts[0] === 'voucher' && parts[1] === 'edit' && parts[2]) return parts[2];
    return null;
  }, [location.pathname]);

  const [titles, setTitles] = useState<Title[]>([]);
  const [assistantMap, setAssistantMap] = useState<Record<string, AssistantItem[]>>({});
  const [titleSearch, setTitleSearch] = useState('');
  const [subjectModal, setSubjectModal] = useState<{ open: boolean; rowIndex: number | null }>({ open: false, rowIndex: null });
  const [suggestNumber, setSuggestNumber] = useState('001');
  const [entries, setEntries] = useState<EntryRow[]>([
    { key: '1', summary: '', subjectId: '', subjectName: '', debit: 0, credit: 0 },
    { key: '2', summary: '', subjectId: '', subjectName: '', debit: 0, credit: 0 },
    { key: '3', summary: '', subjectId: '', subjectName: '', debit: 0, credit: 0 },
    { key: '4', summary: '', subjectId: '', subjectName: '', debit: 0, credit: 0 },
  ]);

  const titleById = useMemo(() => { const m = new Map<string, Title>(); titles.forEach(t => m.set(t.id, t)); return m; }, [titles]);

  const filteredTitles = useMemo(() => {
    const q = titleSearch.trim().toLowerCase();
    if (!q) return titles.filter(t => t.last);
    return titles.filter(t => `${t.code} ${t.name} ${t.fullName} ${t.pinYinInitial || ''}`.toLowerCase().includes(q));
  }, [titleSearch, titles]);

  const ensureBasicLoaded = async () => {
    if (!tenantId) return;
    try {
      const res = (await api.get(`/voucher/getCachedTitleAndAssistant?tenantId=${tenantId}`)) as CachedTitleAssistantResp;
      const data = res?.body?.data;
      if (data?.titleList) setTitles(data.titleList);
      if (data?.assistantMap) setAssistantMap(data.assistantMap);
    } catch (e) { console.error(e); }
  };

  const refreshSuggestNumber = async () => {
    if (!tenantId) return;
    const date = form.getFieldValue('date');
    if (!date) return;
    const period = periodFromDate(date.format('YYYY-MM-DD'));
    try {
      const res = (await api.get(`/voucher/breakNum?tenantId=${tenantId}&accountPeriod=${period}&type=记`)) as any;
      setSuggestNumber(fmt3(res?.body?.number || '1'));
    } catch (e) { setSuggestNumber('001'); }
  };

  const loadEditingVoucher = useCallback(async () => {
    if (!tenantId || !editingVoucherId) return;
    try {
      const vRaw = await api.get(`/voucher/${editingVoucherId}`);
      const eRaw = await api.get(`/voucher/${editingVoucherId}/entries`);
      const v = (vRaw as any)?.body ?? vRaw;
      const e =
        Array.isArray(eRaw) ? eRaw :
        Array.isArray((eRaw as any)?.body) ? (eRaw as any).body :
        Array.isArray((eRaw as any)?.body?.data) ? (eRaw as any).body.data :
        [];

      const dateStr = String((v as any)?.date || '');
      if (dateStr) form.setFieldValue('date', dayjs(dateStr));
      form.setFieldValue('attachmentsCount', (v as any)?.attachmentsCount ?? 0);
      if ((v as any)?.number) setSuggestNumber(String((v as any).number).padStart(3, '0'));

      // finance.html：把当前 tab 标题更新为“凭证号”
      const voucherNo = String((v as any)?.voucherNo || '').trim();
      if (voucherNo) {
        window.dispatchEvent(new CustomEvent('finance-tabs:update-title', { detail: { key: location.pathname, title: voucherNo } }));
      }

      const nextEntries: EntryRow[] = (e as any[]).map((x, idx) => {
        const t = titleById.get(String(x.subjectId));
        const subjectName = t ? `${t.code} ${t.fullName}` : String(x.subjectId);
        return {
          key: String(x.id || `${Date.now()}-${idx}`),
          summary: x.summary || '',
          subjectId: String(x.subjectId || ''),
          subjectName,
          debit: Number(x.debit) || 0,
          credit: Number(x.credit) || 0,
        };
      });
      setEntries(nextEntries.length > 0 ? nextEntries : [
        { key: '1', summary: '', subjectId: '', subjectName: '', debit: 0, credit: 0 },
        { key: '2', summary: '', subjectId: '', subjectName: '', debit: 0, credit: 0 },
      ]);
    } catch (e: any) {
      message.error(e?.response?.data?.message || '加载凭证失败');
    }
  }, [tenantId, editingVoucherId, form, titleById, location.pathname]);

  useEffect(() => {
    ensureBasicLoaded();
    if (!editingVoucherId) {
      form.setFieldValue('date', dayjs());
      refreshSuggestNumber();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, editingVoucherId]);

  useEffect(() => {
    // 科目缓存加载后再回填编辑数据，避免科目名称显示成 UUID
    if (editingVoucherId && titles.length > 0) loadEditingVoucher();
  }, [editingVoucherId, titles.length, loadEditingVoucher]);

  const totalDebit = entries.reduce((s, e) => s + (Number(e.debit) || 0), 0);
  const totalCredit = entries.reduce((s, e) => s + (Number(e.credit) || 0), 0);

  const updateEntry = useCallback((index: number, field: string, value: any) => {
    setEntries(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'debit' && Number(value) > 0) next[index].credit = 0;
      else if (field === 'credit' && Number(value) > 0) next[index].debit = 0;
      return next;
    });
  }, []);

  const handleSelectSubject = (rowIndex: number, title: Title) => {
    setEntries(prev => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], subjectId: title.id, subjectName: `${title.code} ${title.fullName}` };
      return next;
    });
    setSubjectModal({ open: false, rowIndex: null });
  };

  const handleSubmit = async () => {
    try {
      if (!tenantId) { message.error('请先选择客户'); return; }
      const date = form.getFieldValue('date');
      if (!date) { message.error('请选择记账日期'); return; }
      const validEntries = entries
        .filter(e => e.subjectId && (Number(e.debit) > 0 || Number(e.credit) > 0))
        .map(e => ({ subjectId: e.subjectId, summary: e.summary, debit: Number(e.debit) || 0, credit: Number(e.credit) || 0 }));
      if (validEntries.length === 0) { message.error('请至少填写一条有效的分录'); return; }
      if (Math.abs(totalDebit - totalCredit) > 0.01) { message.error('借贷不平衡'); return; }
      if (editingVoucherId) {
        await api.put(`/voucher/${editingVoucherId}`, {
          tenantId,
          date: date.format('YYYY-MM-DD'),
          attachmentsCount: form.getFieldValue('attachmentsCount') || 0,
          entries: validEntries,
        });
        message.success('凭证更新成功');
        navigate(`/voucher/edit/${editingVoucherId}`);
      } else {
        await api.post('/voucher/create', {
          tenantId, date: date.format('YYYY-MM-DD'), docType: '记',
          attachmentsCount: form.getFieldValue('attachmentsCount') || 0, entries: validEntries,
        });
        message.success('凭证保存成功');
        navigate('/voucher');
      }
    } catch (e: any) { message.error(e?.response?.data?.message || '保存失败'); }
  };

  const handleReset = () => {
    form.setFieldValue('date', dayjs());
    refreshSuggestNumber();
    setEntries([
      { key: Date.now() + '1', summary: '', subjectId: '', subjectName: '', debit: 0, credit: 0 },
      { key: Date.now() + '2', summary: '', subjectId: '', subjectName: '', debit: 0, credit: 0 },
    ]);
  };

  const columns = [
    {
      title: '行次', width: 60, align: 'center' as const,
      render: (_: any, __: any, idx: number) => idx + 1,
    },
    {
      title: '摘要', width: 200,
      render: (_: any, row: EntryRow, idx: number) => (
        <Input
          value={row.summary}
          onChange={e => updateEntry(idx, 'summary', e.target.value)}
          placeholder="摘要"
          bordered={false}
          style={{ padding: '0 4px' }}
        />
      ),
    },
    {
      title: '会计科目', width: 260,
      render: (_: any, row: EntryRow, idx: number) => (
        <div
          onClick={() => setSubjectModal({ open: true, rowIndex: idx })}
          style={{ padding: '4px 8px', cursor: 'pointer', color: row.subjectName ? '#333' : '#bfbfbf' }}
        >
          {row.subjectName || '选择科目'}
        </div>
      ),
    },
    {
      title: () => (
        <div>
          <div style={{ textAlign: 'center', borderBottom: '1px solid #e8e8e8', paddingBottom: 4, marginBottom: 4 }}>借方金额</div>
          <div style={{ display: 'flex' }}>
            {AMOUNT_UNITS.map((u, i) => <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#999' }}>{u}</div>)}
          </div>
        </div>
      ),
      width: 300,
      render: (_: any, row: EntryRow, idx: number) => (
        <div>
          <InputNumber
            value={row.debit || null}
            onChange={val => updateEntry(idx, 'debit', val || 0)}
            min={0}
            precision={2}
            controls={false}
            style={{ width: '100%' }}
            placeholder="0.00"
          />
        </div>
      ),
    },
    {
      title: () => (
        <div>
          <div style={{ textAlign: 'center', borderBottom: '1px solid #e8e8e8', paddingBottom: 4, marginBottom: 4 }}>贷方金额</div>
          <div style={{ display: 'flex' }}>
            {AMOUNT_UNITS.map((u, i) => <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#999' }}>{u}</div>)}
          </div>
        </div>
      ),
      width: 300,
      render: (_: any, row: EntryRow, idx: number) => (
        <div>
          <InputNumber
            value={row.credit || null}
            onChange={val => updateEntry(idx, 'credit', val || 0)}
            min={0}
            precision={2}
            controls={false}
            style={{ width: '100%' }}
            placeholder="0.00"
          />
        </div>
      ),
    },
    {
      title: '', width: 50, align: 'center' as const,
      render: (_: any, __: any, idx: number) => (
        <DeleteOutlined
          onClick={() => {
            if (entries.length <= 2) { message.warning('至少保留两行'); return; }
            setEntries(prev => prev.filter((_, i) => i !== idx));
          }}
          style={{ color: '#bbb', cursor: 'pointer' }}
        />
      ),
    },
  ];

  return (
    <div style={{ background: '#f0f2f5', minHeight: 'calc(100vh - 120px)' }}>
      {/* 提示条 */}
      <div style={{ padding: '8px 24px', fontSize: 13, color: '#1890ff', display: 'flex', justifyContent: 'space-between', background: '#fff' }}>
        <span>💡 录凭证小技巧，你还没学会？</span>
        <span>云记账十大秘籍之四 · 进项发票提取自动生成凭证，让您如虎添翼</span>
      </div>

      {/* 工具栏 */}
      <div style={{ background: '#fff', padding: '10px 24px', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<SaveOutlined />} type="primary" onClick={handleSubmit}>保存</Button>
          <Button icon={<FileAddOutlined />} type="primary" onClick={handleSubmit}>保存并新增</Button>
          <Button icon={<CopyOutlined />}>保存并复制</Button>
          <Button icon={<PrinterOutlined />}>打印</Button>
          <Button icon={<DeleteOutlined />} onClick={handleReset}>清空</Button>
          <Button>保存模板</Button>
          <Button icon={<MoreOutlined />}>更多</Button>
        </Space>
        <Button type="link" icon={<SearchOutlined />}>凭证查询</Button>
      </div>

      {/* 凭证主体 */}
      <div style={{ margin: '0 24px', background: '#fff', border: '1px solid #d9d9d9' }}>
        {/* 标题 */}
        <div style={{ textAlign: 'center', padding: '12px 0', borderBottom: '1px solid #d9d9d9', background: '#fafafa', position: 'relative' }}>
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: 8 }}>记 账 凭 证</span>
          <span style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#999' }}>
            <EditOutlined /> 制单人：admin
          </span>
        </div>

        {/* 凭证头 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '10px 20px', borderBottom: '1px solid #d9d9d9', fontSize: 13 }}>
          <Space>
            <span>凭证字：</span>
            <span style={{ fontWeight: 600, fontSize: 15 }}>记</span>
            <span>第</span>
            <Input value={suggestNumber} onChange={e => setSuggestNumber(e.target.value)} style={{ width: 60, textAlign: 'center' }} />
            <span>号</span>
          </Space>
          <Space>
            <span>记账日期：</span>
            <Form form={form} style={{ display: 'inline-block' }}>
              <Form.Item name="date" style={{ margin: 0 }}>
                <DatePicker format="YYYY-MM-DD" onChange={refreshSuggestNumber} style={{ width: 140 }} />
              </Form.Item>
            </Form>
          </Space>
          <Space>
            <span>附单据</span>
            <Form form={form} style={{ display: 'inline-block' }}>
              <Form.Item name="attachmentsCount" initialValue={0} style={{ margin: 0 }}>
                <InputNumber min={0} style={{ width: 60 }} />
              </Form.Item>
            </Form>
            <span>张</span>
          </Space>
        </div>

        {/* 分录表格 - 使用 antd Table */}
        <Table
          dataSource={entries}
          columns={columns}
          pagination={false}
          rowKey="key"
          size="small"
          bordered
          style={{ border: 'none' }}
        />

        {/* 合计行 */}
        <div style={{ display: 'flex', alignItems: 'center', borderTop: '2px solid #333', background: '#fafafa', padding: '8px 16px', gap: 16 }}>
          <span style={{ fontWeight: 600, fontSize: 14, width: 520, textAlign: 'right' }}>合 计</span>
          <div style={{ flex: 1 }}><AmountDigitDisplay value={totalDebit} /></div>
          <div style={{ flex: 1 }}><AmountDigitDisplay value={totalCredit} /></div>
        </div>

        {/* 添加行 */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid #d9d9d9' }}>
          <Button type="dashed" onClick={() => setEntries(prev => [...prev, { key: String(Date.now()), summary: '', subjectId: '', subjectName: '', debit: 0, credit: 0 }])} icon={<PlusOutlined />} size="small">添加分录行</Button>
        </div>
      </div>

      {/* 科目选择弹窗 */}
      <Modal title="选择会计科目" open={subjectModal.open} onCancel={() => setSubjectModal({ open: false, rowIndex: null })} width={800} footer={null}>
        <Space style={{ width: '100%', marginBottom: 16 }}>
          <Input placeholder="搜索：编码 / 名称 / 全名 / 拼音" value={titleSearch} onChange={e => setTitleSearch(e.target.value)} style={{ width: 360 }} prefix={<SearchOutlined />} />
          <Button onClick={() => setTitleSearch('')}>清空</Button>
          <Button onClick={() => ensureBasicLoaded()}>刷新</Button>
        </Space>
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {filteredTitles.map(title => (
            <div
              key={title.id}
              onClick={() => subjectModal.rowIndex !== null && handleSelectSubject(subjectModal.rowIndex, title)}
              style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
            >
              <span style={{ width: 100, color: '#666', fontSize: 13 }}>{title.code}</span>
              <span style={{ flex: 1 }}>{title.fullName}</span>
              <Space size={4}>
                {title.useAssistant && <Tag color="blue">辅助</Tag>}
                {title.useQuantity && <Tag color="purple">数量</Tag>}
                {title.useFcur && <Tag color="gold">外币</Tag>}
              </Space>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default VoucherCreate;
