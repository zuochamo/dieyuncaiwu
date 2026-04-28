import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tenant')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ name: 'industry_type', length: 100, nullable: true })
  industryType: string;

  @Column({ name: 'start_period', length: 7, nullable: true })
  startPeriod: string;

  @Column({ length: 20, default: 'pending' })
  status: string; // pending: 待建账务, active: 已建账务

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
