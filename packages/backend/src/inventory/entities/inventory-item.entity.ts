import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('inventory_item')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ length: 20, nullable: true })
  unit: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
