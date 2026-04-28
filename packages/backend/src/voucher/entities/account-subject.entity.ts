import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('account_subject')
export class AccountSubject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ length: 20 })
  code: string;

  @Column({ length: 200 })
  name: string;

  @Column({ name: 'full_name', length: 500, default: '' })
  fullName: string;

  @Column({ length: 20 })
  type: string; // asset / liability / equity / income / expense

  @Column({ length: 10 })
  direction: string; // debit / credit

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string;

  @Column({ default: 1 })
  level: number;

  @Column({ name: 'is_last', type: 'boolean', default: true })
  last: boolean;

  // --- 辅助核算 / 数量 / 外币，对齐 17DZ ---

  @Column({ name: 'use_assistant', type: 'boolean', default: false })
  useAssistant: boolean;

  @Column({ name: 'assistant_type', length: 10, nullable: true })
  assistantType: string | null;

  /**
   * 多辅助核算类型列表（例如 ["i","s"]），存 JSON 字符串数组
   */
  @Column({ name: 'auxiliary_types', type: 'json', nullable: true })
  auxiliaryTypes: string[] | null;

  @Column({ name: 'use_auxiliary', type: 'boolean', default: false })
  useAuxiliary: boolean;

  @Column({ name: 'use_quantity', type: 'boolean', default: false })
  useQuantity: boolean;

  @Column({ length: 20, nullable: true })
  unit: string | null;

  @Column({ name: 'use_fcur', type: 'boolean', default: false })
  useFcur: boolean;

  @Column({ name: 'fcur_code', length: 10, nullable: true })
  fcurCode: string | null;

  @Column({ name: 'pin_yin_initial', length: 100, nullable: true })
  pinYinInitial: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
