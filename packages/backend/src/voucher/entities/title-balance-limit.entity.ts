import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * 科目余额限制配置（对齐 17DZ 的 titleBalanceLimitList）
 */
@Entity('title_balance_limit')
export class TitleBalanceLimit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'title_code', length: 50 })
  titleCode: string;

  @Column({ name: 'title_name', length: 200 })
  titleName: string;

  @Column({ name: 'balance_limit_lower', type: 'numeric', precision: 18, scale: 2, default: 0 })
  balanceLimitLower: number;

  @Column({ name: 'balance_limit_high', type: 'numeric', precision: 18, scale: 2, default: 0 })
  balanceLimitHigh: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

