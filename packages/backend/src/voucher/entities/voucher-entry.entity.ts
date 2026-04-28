import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('voucher_entry')
export class VoucherEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'voucher_id', type: 'uuid' })
  voucherId: string;

  @Column({ name: 'subject_id', type: 'uuid' })
  subjectId: string;

  /**
   * 辅助核算类型（c/s/i 等），与外部系统对齐
   */
  @Column({ name: 'assistant_type', length: 10, nullable: true })
  assistantType: string | null;

  @Column({ name: 'assistant_id', type: 'bigint', nullable: true })
  assistantId: string | null;

  /**
   * 数量核算
   */
  @Column({ type: 'numeric', precision: 18, scale: 6, nullable: true })
  quantity: number | null;

  @Column({ length: 20, nullable: true })
  unit: string | null;

  /**
   * 外币核算
   */
  @Column({ name: 'fcur_code', length: 10, nullable: true })
  fcurCode: string | null;

  @Column({ name: 'exchange_rate', type: 'numeric', precision: 18, scale: 8, nullable: true })
  exchangeRate: number | null;

  @Column({ name: 'fcur_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  fcurAmount: number | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  credit: number;

  @Column({ length: 500, nullable: true })
  summary: string;
}
