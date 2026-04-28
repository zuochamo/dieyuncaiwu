import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { AccountSubject } from '../voucher/entities/account-subject.entity';
import { SMALL_BIZ_COA } from './coa/small-business';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(AccountSubject)
    private readonly subjectRepo: Repository<AccountSubject>,
  ) {}

  async findAll(status?: string): Promise<Tenant[]> {
    const where = status ? { status } : {};
    return this.tenantRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('租户不存在');
    return tenant;
  }

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const tenant = this.tenantRepo.create({
      ...dto,
      status: dto.startPeriod ? 'active' : 'pending',
    });
    const saved = await this.tenantRepo.save(tenant);
    await this.ensureDefaultSubjects(saved.id);
    return saved;
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    Object.assign(tenant, dto);
    return this.tenantRepo.save(tenant);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    await this.tenantRepo.remove(tenant);
  }

  async setupAccount(id: string, startPeriod: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.startPeriod = startPeriod;
    tenant.status = 'active';
    const saved = await this.tenantRepo.save(tenant);
    await this.ensureDefaultSubjects(saved.id);
    await this.initSmallBusinessCoa(saved.id, { mode: 'append' });
    return saved;
  }

  private computeFullNameByParent(subject: AccountSubject, byId: Map<string, AccountSubject>) {
    const parts: string[] = [];
    const seen = new Set<string>();
    let cur: AccountSubject | undefined = subject;
    while (cur) {
      if (seen.has(cur.id)) break;
      seen.add(cur.id);
      parts.push(cur.name);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return parts.reverse().join('-');
  }

  async initSmallBusinessCoa(
    tenantId: string,
    options?: { mode?: 'append' | 'replace' },
  ): Promise<{ created: number; updated: number; total: number }> {
    const mode = options?.mode || 'append';

    if (mode === 'replace') {
      // WARNING: destructive for existing vouchers; keep as an explicit opt-in.
      await this.subjectRepo.delete({ tenantId } as any);
    }

    const existing = await this.subjectRepo.find({ where: { tenantId }, order: { code: 'ASC' } });
    const byCode = new Map(existing.map((s) => [s.code, s]));

    let created = 0;
    let updated = 0;

    // First pass: create/update subjects (without parentId, computed later)
    for (const item of SMALL_BIZ_COA) {
      const cur = byCode.get(item.code);
      if (!cur) {
        const s = this.subjectRepo.create({
          tenantId,
          code: item.code,
          name: item.name,
          fullName: item.name,
          type: item.type,
          direction: item.direction,
          parentId: null as any,
          level: 1,
          last: true,
          useAssistant: false,
          assistantType: null,
          auxiliaryTypes: null,
          useAuxiliary: false,
          useQuantity: false,
          unit: null,
          useFcur: false,
          fcurCode: null,
          pinYinInitial: null,
        } as DeepPartial<AccountSubject>);
        const saved = await this.subjectRepo.save(s);
        byCode.set(saved.code, saved);
        created += 1;
      } else {
        const next: Partial<AccountSubject> = {
          name: item.name,
          type: item.type,
          direction: item.direction,
        };
        const merged = Object.assign(cur, next);
        const saved = await this.subjectRepo.save(merged);
        byCode.set(saved.code, saved);
        updated += 1;
      }
    }

    // Second pass: set parentId/level based on parentCode, and compute fullName
    const parentsByCode = new Map<string, string>(); // childCode -> parentId
    for (const item of SMALL_BIZ_COA) {
      if (!item.parentCode) continue;
      const child = byCode.get(item.code);
      const parent = byCode.get(item.parentCode);
      if (child && parent) parentsByCode.set(child.code, parent.id);
    }

    // load fresh list for deterministic fullName/last computation
    const all = await this.subjectRepo.find({ where: { tenantId }, order: { code: 'ASC' } });
    const byId = new Map(all.map((s) => [s.id, s]));

    const childrenByParentId = new Map<string, number>();
    for (const item of SMALL_BIZ_COA) {
      const child = byCode.get(item.code);
      const parentId = item.parentCode ? byCode.get(item.parentCode)?.id : undefined;
      if (child && parentId) {
        childrenByParentId.set(parentId, (childrenByParentId.get(parentId) || 0) + 1);
      }
    }

    for (const s of all) {
      const parentId = parentsByCode.get(s.code) || null;
      s.parentId = parentId as any;
    }
    await this.subjectRepo.save(all);

    const all2 = await this.subjectRepo.find({ where: { tenantId }, order: { code: 'ASC' } });
    const byId2 = new Map(all2.map((s) => [s.id, s]));

    for (const s of all2) {
      const fullName = this.computeFullNameByParent(s, byId2);
      const level = fullName ? fullName.split('-').length : 1;
      const hasChild = (childrenByParentId.get(s.id) || 0) > 0;
      s.fullName = fullName || s.name;
      s.level = level;
      s.last = !hasChild;
    }
    await this.subjectRepo.save(all2);

    const total = await this.subjectRepo.count({ where: { tenantId } });
    return { created, updated, total };
  }

  async ensureDefaultSubjects(tenantId: string): Promise<{ created: number; existing: number }> {
    const defaults: Array<Pick<AccountSubject, 'tenantId' | 'code' | 'name' | 'type' | 'direction' | 'parentId' | 'level'>> = [
      { tenantId, code: '1122', name: '应收账款', type: 'asset', direction: 'debit', parentId: null, level: 1 },
      { tenantId, code: '2202', name: '应付账款', type: 'liability', direction: 'credit', parentId: null, level: 1 },
      { tenantId, code: '6001', name: '主营业务收入', type: 'income', direction: 'credit', parentId: null, level: 1 },
      { tenantId, code: '222101', name: '应交税费-进项税额', type: 'asset', direction: 'debit', parentId: null, level: 2 },
      { tenantId, code: '222102', name: '应交税费-销项税额', type: 'liability', direction: 'credit', parentId: null, level: 2 },
      { tenantId, code: '6602', name: '管理费用', type: 'expense', direction: 'debit', parentId: null, level: 1 },
      { tenantId, code: '6601', name: '销售费用', type: 'expense', direction: 'debit', parentId: null, level: 1 },
    ];

    let created = 0;
    let existing = 0;

    for (const s of defaults) {
      const found = await this.subjectRepo.findOne({ where: { tenantId, name: s.name } });
      if (found) {
        existing += 1;
        continue;
      }
      await this.subjectRepo.save(this.subjectRepo.create(s));
      created += 1;
    }

    return { created, existing };
  }
}
