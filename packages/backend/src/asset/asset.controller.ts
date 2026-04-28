import { Controller, Get, Post, Body, Query, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AssetService } from './asset.service';
import { CreateAssetDto, RunDepreciationDto } from './dto/asset.dto';

@ApiTags('固定资产管理')
@Controller('asset')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get()
  @ApiOperation({ summary: '获取固定资产列表' })
  @ApiQuery({ name: 'tenantId', required: true })
  findAll(@Query('tenantId') tenantId: string) {
    return this.assetService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取固定资产详情' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.assetService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建固定资产' })
  create(@Body() dto: CreateAssetDto) {
    return this.assetService.create(dto);
  }

  @Post('depreciation/run')
  @ApiOperation({ summary: '运行折旧计算' })
  runDepreciation(@Body() dto: RunDepreciationDto) {
    return this.assetService.runDepreciation(dto);
  }

  @Get(':id/depreciations')
  @ApiOperation({ summary: '获取资产折旧明细' })
  getDepreciations(@Param('id', ParseUUIDPipe) id: string) {
    return this.assetService.getDepreciations(id);
  }
}
