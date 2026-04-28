import React, { useEffect, useMemo, useState } from 'react';
import { Table, Input, Card } from 'antd';
import api from '../../api';
import { useTenant } from '../../tenant/TenantContext';

interface DzBalanceSheetRow {
  accountTitleName: string;
  row: number | null;
  number: number;
  level: number;
  pRowNum: number | null;
  warn: boolean;
  showLine: number;
  balanceEnd: number;
  yearBeginBalance: number;
  fomularDetail: string | null;
  totalLine: boolean;
}

interface DzBalanceSheetResp {
  head: any;
  body: {
    result: DzBalanceSheetRow[];
    balanceReason: number;
  };
}

type DzBalanceSheetPairRow = {
  key: string;
  left?: DzBalanceSheetRow;
  right?: DzBalanceSheetRow;
};

function money(v: number | null | undefined) {
  return Number(v || 0).toFixed(2);
}

const ReportBalanceSheet: React.FC = () => {
  const [rows, setRows] = useState<DzBalanceSheetRow[]>([]);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const { tenantId } = useTenant();

  const fetchData = async (p: string) => {
    try {
      if (!tenantId) return;
      const res = (await api.get(`/report/balance-sheet?tenantId=${tenantId}&period=${p}`)) as DzBalanceSheetResp;
      setRows(res?.body?.result || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(period); }, [tenantId]);

  const { leftRows, rightRows } = useMemo(() => {
    // Prefer splitting at the first "Liabilities" section marker, so all liabilities/equity rows go to the right side.
    const rightStart = rows.findIndex((r) => {
      const name = (r.accountTitleName || '').trim();
      if (!name) return false;
      const isSection = name.endsWith('：') || r.row === null;
      const isTopLevel = r.level === 1;
      return isSection && isTopLevel && (name.includes('流动负债') || name.startsWith('负债') || name.includes('所有者权益'));
    });

    if (rightStart > 0) {
      return { leftRows: rows.slice(0, rightStart), rightRows: rows.slice(rightStart) };
    }

    // Fallback: split after "资产总计" if present.
    const assetTotalIdx = rows.findIndex((r) => (r.accountTitleName || '').includes('资产总计'));
    if (assetTotalIdx >= 0) {
      return { leftRows: rows.slice(0, assetTotalIdx + 1), rightRows: rows.slice(assetTotalIdx + 1) };
    }

    // Last fallback: show all on left.
    return { leftRows: rows, rightRows: [] as DzBalanceSheetRow[] };
  }, [rows]);

  const dataSource = useMemo((): DzBalanceSheetPairRow[] => {
    const n = Math.max(leftRows.length, rightRows.length);
    const out: DzBalanceSheetPairRow[] = [];
    for (let i = 0; i < n; i++) {
      const left = leftRows[i];
      const right = rightRows[i];
      out.push({ key: String(i), left, right });
    }
    return out;
  }, [leftRows, rightRows]);

  const columns = useMemo(() => {
    const nameCell = (side: 'left' | 'right') => (_: any, pair: DzBalanceSheetPairRow) => {
      const r = side === 'left' ? pair.left : pair.right;
      if (!r) return '';
      const isSection = (r.accountTitleName || '').endsWith('：') || r.row === null;
      return (
        <div
          style={{
            paddingLeft: Math.max(0, (r.level - 1) * 16),
            fontWeight: isSection ? 700 : r.totalLine ? 700 : 400,
          }}
        >
          {r.accountTitleName}
        </div>
      );
    };

    const rowCell = (side: 'left' | 'right') => (_: any, pair: DzBalanceSheetPairRow) => {
      const r = side === 'left' ? pair.left : pair.right;
      return r?.row ?? '';
    };

    const endCell = (side: 'left' | 'right') => (_: any, pair: DzBalanceSheetPairRow) => {
      const r = side === 'left' ? pair.left : pair.right;
      if (!r) return '';
      return `¥${money(r.balanceEnd)}`;
    };

    const beginCell = (side: 'left' | 'right') => (_: any, pair: DzBalanceSheetPairRow) => {
      const r = side === 'left' ? pair.left : pair.right;
      if (!r) return '';
      return `¥${money(r.yearBeginBalance)}`;
    };

    return [
      {
        title: '资产',
        children: [
          { title: '资产', width: 320, render: nameCell('left') },
          { title: '行次', width: 70, align: 'center' as const, render: rowCell('left') },
          { title: '期末余额', width: 160, align: 'right' as const, render: endCell('left') },
          { title: '年初余额', width: 160, align: 'right' as const, render: beginCell('left') },
        ],
      },
      {
        title: '负债和所有者权益',
        children: [
          { title: '负债和所有者权益', width: 320, render: nameCell('right') },
          { title: '行次', width: 70, align: 'center' as const, render: rowCell('right') },
          { title: '期末余额', width: 160, align: 'right' as const, render: endCell('right') },
          { title: '年初余额', width: 160, align: 'right' as const, render: beginCell('right') },
        ],
      },
    ];
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>资产负债表</h2>
        <Input.Search
          placeholder="输入期间 YYYY-MM"
          defaultValue={period}
          onSearch={(v) => { setPeriod(v); fetchData(v); }}
          style={{ width: 250 }}
        />
      </div>
      <Card>
        <Table
          className="dz-report-grid"
          size="small"
          bordered
          columns={columns as any}
          dataSource={dataSource}
          rowKey="key"
          pagination={false}
          scroll={{ x: 1400, y: 600 }}
          rowClassName={(pair: DzBalanceSheetPairRow) =>
            pair.left?.warn || pair.right?.warn ? 'row-warn' : pair.left?.totalLine || pair.right?.totalLine ? 'row-total' : ''
          }
        />
      </Card>
    </div>
  );
};

export default ReportBalanceSheet;
