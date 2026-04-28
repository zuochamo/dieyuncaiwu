import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('invoice')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ length: 10 })
  type: string; // input / output

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  tax: number;

  @Column({ name: 'customer_name', length: 200, nullable: true })
  customerName: string;

  @Column({ name: 'raw_data', type: 'jsonb', nullable: true })
  rawData: any;

  @Column({ length: 20, default: 'pending' })
  status: string; // pending / processed / void

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
