import { Controller, Get, Post, Body, Query, Param, ParseUUIDPipe, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto, ImportInvoiceDto } from './dto/invoice.dto';
import { memoryStorage } from 'multer';

@ApiTags('发票管理')
@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get()
  @ApiOperation({ summary: '获取发票列表' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'type', required: false })
  findAll(@Query('tenantId') tenantId: string, @Query('type') type?: string) {
    return this.invoiceService.findAll(tenantId, type);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取发票详情' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoiceService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建发票' })
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoiceService.create(dto);
  }

  @Post('import')
  @ApiOperation({ summary: '从 Excel 导入发票' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async import(
    @Body() dto: ImportInvoiceDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file?.buffer?.length) {
      return { imported: 0, processed: 0, skipped: 0, errors: [{ row: null, reason: '未收到文件内容' }] };
    }
    return this.invoiceService.importFromExcel(dto.tenantId, dto.type, file.buffer);
  }

  @Post('reprocess')
  @ApiOperation({ summary: '重新处理 pending 发票并尝试生成凭证' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'type', required: false })
  reprocess(@Query('tenantId') tenantId: string, @Query('type') type?: string) {
    return this.invoiceService.reprocessPending(tenantId, type);
  }
}
