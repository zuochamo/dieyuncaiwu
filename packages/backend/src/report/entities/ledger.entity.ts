import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ledger')
export class Ledger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'subject_id', type: 'uuid' })
  subjectId: string;

  @Column({ length: 7 })
  period: string;

  @Column({ name: 'debit_total', type: 'numeric', precision: 18, scale: 2, default: 0 })
  debitTotal: number;

  @Column({ name: 'credit_total', type: 'numeric', precision: 18, scale: 2, default: 0 })
  creditTotal: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  balance: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
