import { Controller, Get, Post, Put, Delete, Param, Body, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto, UpdateTenantDto, SetupAccountDto } from './dto/tenant.dto';

@ApiTags('租户管理')
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @ApiOperation({ summary: '获取所有租户' })
  @ApiQuery({ name: 'status', required: false, description: '状态筛选: pending/active' })
  findAll(@Query('status') status?: string) {
    return this.tenantService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个租户' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建租户' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新租户' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除租户' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantService.remove(id);
  }

  @Post(':id/setup-account')
  @ApiOperation({ summary: '建立账务 - 设置启用期间并激活租户' })
  setupAccount(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetupAccountDto) {
    return this.tenantService.setupAccount(id, dto.startPeriod);
  }

  @Post(':id/init-subjects')
  @ApiOperation({ summary: '初始化默认会计科目（用于自动凭证）' })
  initSubjects(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantService.ensureDefaultSubjects(id);
  }

  @Post(':id/init-smallbiz-coa')
  @ApiOperation({ summary: '初始化小企业会计准则科目表（用于手工凭证/报表）' })
  initSmallBizCoa(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('mode') mode?: 'append' | 'replace',
  ) {
    return this.tenantService.initSmallBusinessCoa(id, { mode: mode || 'append' });
  }
}
