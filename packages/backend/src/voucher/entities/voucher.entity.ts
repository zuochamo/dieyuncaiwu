import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('voucher')
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  /**
   * 凭证期间（YYYYMM），用于编号与查询
   */
  @Column({ length: 6, default: '' })
  period: string;

  /**
   * 凭证字/类型（如：JI=记）
   */
  @Column({ name: 'doc_type', length: 10, default: 'JI' })
  docType: string;

  /**
   * 凭证号（同期间同凭证字内唯一，固定宽度字符串，如 "003"）
   */
  @Column({ length: 20, default: '' })
  number: string;

  @Column({ name: 'source_type', length: 20, default: 'manual' })
  sourceType: string; // manual / invoice / inventory / asset

  @Column({ name: 'source_id', type: 'uuid', nullable: true })
  sourceId: string;

  @Column({ name: 'voucher_no', length: 50 })
  voucherNo: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'attachments_count', type: 'int', default: 0 })
  attachmentsCount: number;

  @Column({ length: 20, default: 'draft' })
  status: string; // draft / posted

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
