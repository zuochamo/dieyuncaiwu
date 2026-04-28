import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/invoice.dto';
import * as XLSX from 'xlsx';
import { VoucherService } from '../voucher/voucher.service';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    private readonly voucherService: VoucherService,
  ) {}

  async findAll(tenantId: string, type?: string): Promise<Invoice[]> {
    const where: any = { tenantId };
    if (type) where.type = type;
    return this.invoiceRepo.find({ where, order: { date: 'DESC' } });
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('发票不存在');
    return invoice;
  }

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    const invoice = this.invoiceRepo.create(dto);
    return this.invoiceRepo.save(invoice);
  }

  /**
   * 从 Excel 文件批量导入发票
   */
  async importFromExcel(
    tenantId: string,
    type: string,
    buffer: Buffer,
  ): Promise<{
    imported: number;
    processed: number;
    skipped: number;
    invoices: Invoice[];
    errors: Array<{ row: number | null; reason: string; invoiceId?: string }>;
  }> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const invoices: Invoice[] = [];
    const errors: Array<{ row: number | null; reason: string; invoiceId?: string }> = [];
    let processed = 0;
    let skipped = 0;

    let idx = 0;
    for (const row of rows as any[]) {
      idx += 1;
      const invoice = this.invoiceRepo.create({
        tenantId,
        type,
        date: row['日期'] || row['date'] || new Date().toISOString().slice(0, 10),
        amount: Number(row['金额'] || row['amount'] || 0),
        tax: Number(row['税额'] || row['tax'] || 0),
        customerName: row['客户名称'] || row['customer'] || '',
        rawData: row,
        status: 'pending',
      });
      const saved = await this.invoiceRepo.save(invoice);
      invoices.push(saved);

      // 导入后自动生成凭证
      try {
        await this.generateInvoiceVoucher(saved);
        await this.updateStatus(saved.id, 'processed');
        processed += 1;
      } catch (err) {
        skipped += 1;
        const reason = err?.message ? String(err.message) : '自动凭证生成失败';
        this.logger.warn(`发票 ${saved.id} 自动凭证生成失败，跳过: ${reason}`);
        errors.push({ row: idx, reason, invoiceId: saved.id });
      }
    }

    return {
      imported: invoices.length,
      processed,
      skipped,
      invoices,
      errors,
    };
  }

  async updateStatus(id: string, status: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    invoice.status = status;
    return this.invoiceRepo.save(invoice);
  }

  async reprocessPending(
    tenantId: string,
    type?: string,
  ): Promise<{
    pending: number;
    processed: number;
    skipped: number;
    errors: Array<{ invoiceId: string; reason: string }>;
  }> {
    const where: any = { tenantId, status: 'pending' };
    if (type) where.type = type;

    const pendingInvoices = await this.invoiceRepo.find({ where, order: { createdAt: 'ASC' } });
    const errors: Array<{ invoiceId: string; reason: string }> = [];

    let processed = 0;
    let skipped = 0;

    for (const inv of pendingInvoices) {
      try {
        await this.generateInvoiceVoucher(inv);
        await this.updateStatus(inv.id, 'processed');
        processed += 1;
      } catch (err) {
        skipped += 1;
        const reason = err?.message ? String(err.message) : '自动凭证生成失败';
        errors.push({ invoiceId: inv.id, reason });
      }
    }

    return { pending: pendingInvoices.length, processed, skipped, errors };
  }

  /**
   * 发票自动生成凭证
   * 进项发票：
   *   借：费用科目（科目名模糊匹配），金额 = amount（不含税）
   *   借：应交税费-进项税额，金额 = tax
   *   贷：应付账款，金额 = amount + tax
   * 销项发票：
   *   借：应收账款，金额 = amount + tax
   *   贷：主营业务收入，金额 = amount
   *   贷：应交税费-销项税额，金额 = tax
   */
  private async generateInvoiceVoucher(invoice: Invoice): Promise<void> {
    const amount = Number(invoice.amount);
    const tax = Number(invoice.tax);

    if (invoice.type === 'input') {
      // 进项发票
      const payablesSubject = await this.voucherService.findSubjectByName(invoice.tenantId, '应付账款');
      const inputTaxSubject = await this.voucherService.findSubjectByName(invoice.tenantId, '应交税费-进项税额');
      // 尝试匹配费用科目（管理费用、销售费用等）
      const expenseSubject =
        (await this.voucherService.findSubjectByName(invoice.tenantId, '管理费用')) ||
        (await this.voucherService.findSubjectByName(invoice.tenantId, '销售费用'));

      if (!payablesSubject || !inputTaxSubject || !expenseSubject) {
        this.logger.warn(`进项发票 ${invoice.id}: 缺少必要科目（应付账款/应交税费-进项税额/费用科目），跳过自动凭证`);
        return;
      }

      const v = await this.voucherService.create({
        tenantId: invoice.tenantId,
        date: invoice.date,
        sourceType: 'invoice',
        sourceId: invoice.id,
        entries: [
          { subjectId: expenseSubject.id, debit: amount, credit: 0, summary: `进项发票-${invoice.customerName}` },
          { subjectId: inputTaxSubject.id, debit: tax, credit: 0, summary: `进项税额-${invoice.customerName}` },
          { subjectId: payablesSubject.id, debit: 0, credit: amount + tax, summary: `进项发票-${invoice.customerName}` },
        ],
      });
      // 自动过账，确保 ledger 与报表能生成数据
      await this.voucherService.post({ voucherId: v.id } as any);
    } else if (invoice.type === 'output') {
      // 销项发票
      const receivableSubject = await this.voucherService.findSubjectByName(invoice.tenantId, '应收账款');
      const revenueSubject = await this.voucherService.findSubjectByName(invoice.tenantId, '主营业务收入');
      const outputTaxSubject = await this.voucherService.findSubjectByName(invoice.tenantId, '应交税费-销项税额');

      if (!receivableSubject || !revenueSubject || !outputTaxSubject) {
        this.logger.warn(`销项发票 ${invoice.id}: 缺少必要科目（应收账款/主营业务收入/应交税费-销项税额），跳过自动凭证`);
        return;
      }

      const v = await this.voucherService.create({
        tenantId: invoice.tenantId,
        date: invoice.date,
        sourceType: 'invoice',
        sourceId: invoice.id,
        entries: [
          { subjectId: receivableSubject.id, debit: amount + tax, credit: 0, summary: `销项发票-${invoice.customerName}` },
          { subjectId: revenueSubject.id, debit: 0, credit: amount, summary: `销项收入-${invoice.customerName}` },
          { subjectId: outputTaxSubject.id, debit: 0, credit: tax, summary: `销项税额-${invoice.customerName}` },
        ],
      });
      // 自动过账，确保 ledger 与报表能生成数据
      await this.voucherService.post({ voucherId: v.id } as any);
    }
  }
}
