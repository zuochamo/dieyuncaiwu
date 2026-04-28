import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * 辅助核算项（客户/供应商/存货等），对齐 17DZ 的 assistantMap
 */
@Entity('assistant_item')
export class AssistantItem {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  /**
   * 辅助核算类型：c/s/i（客户/供应商/存货/项目等）
   */
  @Column({ length: 10 })
  type: string;

  @Column({ length: 50 })
  code: string;

  @Column({ length: 500 })
  name: string;

  @Column({ name: 'freeze_status', length: 10, nullable: true })
  freezeStatus: string | null;

  @Column({ name: 'pin_yin_initial', length: 200, nullable: true })
  pinYinInitial: string | null;

  // 可选扩展字段（对齐 17DZ i 类）
  @Column({ length: 50, nullable: true })
  unit: string | null;

  @Column({ name: 'category_id', type: 'int', nullable: true })
  categoryId: number | null;

  @Column({ name: 'category_full_name', length: 500, nullable: true })
  categoryFullName: string | null;

  @Column({ name: 'license_number', length: 200, nullable: true })
  licenseNumber: string | null;

  @Column({ name: 'inventory_type', length: 50, nullable: true })
  inventoryType: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

