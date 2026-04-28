import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('fixed_asset')
export class FixedAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ name: 'original_value', type: 'numeric', precision: 18, scale: 2 })
  originalValue: number;

  @Column({ name: 'residual_rate', type: 'numeric', precision: 5, scale: 4, default: 0.05 })
  residualRate: number;

  @Column({ name: 'useful_life', type: 'int' })
  usefulLife: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
