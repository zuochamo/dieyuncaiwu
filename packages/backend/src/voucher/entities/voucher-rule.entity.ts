import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('voucher_rule')
export class VoucherRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'biz_type', length: 50 })
  bizType: string;

  @Column({ name: 'trigger_event', length: 50 })
  triggerEvent: string;

  @Column({ name: 'debit_subject_id', type: 'uuid', nullable: true })
  debitSubjectId: string;

  @Column({ name: 'credit_subject_id', type: 'uuid', nullable: true })
  creditSubjectId: string;

  @Column({ name: 'tax_subject_id', type: 'uuid', nullable: true })
  taxSubjectId: string;

  @Column({ type: 'text', nullable: true })
  formula: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
