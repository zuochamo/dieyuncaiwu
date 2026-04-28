import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /** 密码哈希（SHA256 + salt） */
  private hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const s = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(s + password).digest('hex');
    return { hash, salt: s };
  }

  /** 查询所有用户（不返回密码） */
  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepo.find({ order: { createdAt: 'DESC' } });
    return users.map(({ password: _, ...rest }) => rest);
  }

  /** 根据 ID 查询 */
  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  /** 根据用户名查询（含密码，用于登录验证） */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { username } });
  }

  /** 创建用户 */
  async create(data: { username: string; password: string; displayName?: string; role?: string }): Promise<Omit<User, 'password'>> {
    const existing = await this.userRepo.findOne({ where: { username: data.username } });
    if (existing) {
      throw new Error('用户名已存在');
    }
    const { hash, salt } = this.hashPassword(data.password);
    const user = this.userRepo.create({
      username: data.username,
      password: `${salt}:${hash}`,
      displayName: data.displayName || data.username,
      role: data.role || 'user',
      active: true,
    });
    const saved = await this.userRepo.save(user);
    const { password: _, ...result } = saved;
    return result;
  }

  /** 更新用户 */
  async update(id: string, data: { displayName?: string; role?: string; active?: boolean; password?: string }): Promise<Omit<User, 'password'>> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new Error('用户不存在');

    if (data.displayName !== undefined) user.displayName = data.displayName;
    if (data.role !== undefined) user.role = data.role;
    if (data.active !== undefined) user.active = data.active;
    if (data.password) {
      const { hash, salt } = this.hashPassword(data.password);
      user.password = `${salt}:${hash}`;
    }

    const saved = await this.userRepo.save(user);
    const { password: _, ...result } = saved;
    return result;
  }

  /** 删除用户 */
  async remove(id: string): Promise<void> {
    await this.userRepo.delete(id);
  }

  /** 验证登录 */
  async validateUser(username: string, password: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user || !user.active) return null;

    const [salt, storedHash] = user.password.split(':');
    const { hash } = this.hashPassword(password, salt);
    if (hash !== storedHash) return null;

    const { password: _, ...result } = user;
    return result;
  }

  /** 初始化默认管理员（启动时调用） */
  async seedAdmin() {
    const existing = await this.userRepo.findOne({ where: { username: 'root' } });
    if (!existing) {
      await this.create({ username: 'root', password: '123456', displayName: '管理员', role: 'admin' });
      console.log('[UserService] 默认管理员 root/123456 已创建');
    }
  }
}
