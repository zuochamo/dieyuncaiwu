import React from 'react';

const DIGITS = ['亿', '千', '百', '十', '万', '千', '百', '十', '元', '角', '分'] as const;

function toCents(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

function formatDigits(value: number): string[] {
  const cents = toCents(value);
  const abs = Math.abs(cents);
  const intPart = Math.floor(abs / 100).toString();
  const decPart = (abs % 100).toString().padStart(2, '0'); // 角分

  // 目标：11 位（亿...元角分）。整数部分对齐到“元”左侧 9 格
  const intDigits = intPart.split('');
  const paddedInt = Array(Math.max(9 - intDigits.length, 0)).fill('');
  const left = [...paddedInt, ...intDigits].slice(-9);

  return [...left, decPart[0], decPart[1]];
}

export const AmountBoxes: React.FC<{ value?: number | string; className?: string }> = ({ value, className }) => {
  const num = value === '' || value === null || value === undefined ? 0 : Number(value);
  const cells = formatDigits(num);
  const negative = Number(num) < 0;

  return (
    <div className={['voucher-amount', className].filter(Boolean).join(' ')}>
      {negative && <span className="voucher-amount-neg">-</span>}
      <div className="voucher-amount-grid" aria-label="金额按位">
        {cells.map((d, idx) => (
          <div key={idx} className="voucher-amount-cell">
            <div className="voucher-amount-digit">{d}</div>
            <div className="voucher-amount-unit">{DIGITS[idx]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

