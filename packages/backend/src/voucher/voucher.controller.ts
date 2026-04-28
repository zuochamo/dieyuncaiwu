import { Controller, Get, Post, Put, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { VoucherService } from './voucher.service';
import { CreateVoucherDto, PostVoucherDto, UpdateVoucherDto } from './dto/voucher.dto';
import { LegacyImportService } from './legacy-import.service';
import { ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors } from '@nestjs/common';

@ApiTags('凭证管理')
@Controller('voucher')
export class VoucherController {
  constructor(
    private readonly voucherService: VoucherService,
    private readonly legacyImportService: LegacyImportService,
  ) {}

  @Get('number/max')
  @ApiOperation({ summary: '获取期间最大凭证号' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'period', required: true, description: 'YYYYMM' })
  @ApiQuery({ name: 'type', required: true, description: 'docType，例如 JI' })
  async getNumberMax(@Query('tenantId') tenantId: string, @Query('period') period: string, @Query('type') type: string) {
    const max = await this.voucherService.getNumberMax(tenantId, period, type);
    return { head: { code: '00000000', description: '成功', msg: '成功', status: 'Y', time: new Date().toISOString() }, body: max };
  }

  @Get('breakNum')
  @ApiOperation({ summary: '获取断号/下一个可用凭证号' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'accountPeriod', required: true, description: 'YYYYMM' })
  @ApiQuery({ name: 'type', required: true, description: 'docType，例如 JI' })
  async breakNum(@Query('tenantId') tenantId: string, @Query('accountPeriod') accountPeriod: string, @Query('type') type: string) {
    const number = await this.voucherService.getBreakNumber(tenantId, accountPeriod, type);
    return { head: { code: '00000000', description: '成功', msg: '成功', status: 'Y', time: new Date().toISOString() }, body: { number } };
  }

  @Post('legacy-import')
  @ApiOperation({ summary: '旧账迁入（2026.xls）' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'mode', required: false, description: 'replace/skip/fail', example: 'replace' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async legacyImport(
    @Query('tenantId') tenantId: string,
    @Query('mode') mode?: 'replace' | 'skip' | 'fail',
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const body = await this.legacyImportService.import2026Xls({
      tenantId,
      mode: (mode || 'replace') as any,
      filePath: file?.path,
    });
    return { head: { code: '00000000', description: '成功', msg: '成功', status: 'Y', time: new Date().toISOString() }, body };
  }

  @Get('getTitleAndAssistantLimit')
  @ApiOperation({ summary: '获取科目余额限制与缓存长度限制' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'type', required: true, description: 'docType，例如 JI' })
  async getTitleAndAssistantLimit(@Query('tenantId') tenantId: string, @Query('type') type: string) {
    const body = await this.voucherService.getTitleAndAssistantLimit(tenantId, type);
    return { head: { code: '00000000', description: '成功', msg: '成功', status: 'Y', time: new Date().toISOString() }, body };
  }

  @Get('getCachedTitleAndAssistant')
  @ApiOperation({ summary: '获取科目+辅助核算缓存' })
  @ApiQuery({ name: 'tenantId', required: true })
  async getCachedTitleAndAssistant(@Query('tenantId') tenantId: string) {
    const body = await this.voucherService.getCachedTitleAndAssistant(tenantId);
    return { head: { code: '00000000', description: '成功', msg: '成功', status: 'Y', time: new Date().toISOString() }, body };
  }

  @Get('accountBalanceSheet/simple/assistant')
  @ApiOperation({ summary: '辅助核算余额表（简版）' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'period', required: true })
  async getAssistantBalance(@Query('tenantId') tenantId: string, @Query('period') period: string) {
    const body = await this.voucherService.getAssistantBalanceMap(tenantId, period);
    return { head: { code: '00000000', description: '成功', msg: '成功', status: 'Y', time: new Date().toISOString() }, body };
  }

  @Get()
  @ApiOperation({ summary: '获取租户所有凭证' })
  @ApiQuery({ name: 'tenantId', required: true })
  findAll(@Query('tenantId') tenantId: string) {
    return this.voucherService.findAll(tenantId);
  }

  @Get('search')
  @ApiOperation({ summary: '凭证查找' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'status', required: false })
  search(
    @Query('tenantId') tenantId: string,
    @Query('keyword') keyword?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return this.voucherService.search(tenantId, { keyword, startDate, endDate, status });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取凭证详情' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.voucherService.findOne(id);
  }

  @Get(':id/entries')
  @ApiOperation({ summary: '获取凭证明细' })
  getEntries(@Param('id', ParseUUIDPipe) id: string) {
    return this.voucherService.getEntries(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新凭证（替换分录）' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVoucherDto) {
    return this.voucherService.update(id, dto);
  }

  @Post('create')
  @ApiOperation({ summary: '创建凭证' })
  create(@Body() dto: CreateVoucherDto) {
    return this.voucherService.create(dto);
  }

  @Post('post')
  @ApiOperation({ summary: '过账凭证' })
  post(@Body() dto: PostVoucherDto) {
    return this.voucherService.post(dto);
  }

  @Post('auto-generate')
  @ApiOperation({ summary: '自动生成凭证' })
  autoGenerate(@Body() body: { tenantId: string; bizType: string; data: Record<string, any> }) {
    return this.voucherService.autoGenerate(body.tenantId, body.bizType, body.data);
  }
}
