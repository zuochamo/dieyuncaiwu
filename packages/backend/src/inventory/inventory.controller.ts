import { Controller, Get, Post, Body, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, CreateInventoryTxnDto } from './dto/inventory.dto';

@ApiTags('库存管理')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('items')
  @ApiOperation({ summary: '获取商品列表' })
  @ApiQuery({ name: 'tenantId', required: true })
  findAllItems(@Query('tenantId') tenantId: string) {
    return this.inventoryService.findAllItems(tenantId);
  }

  @Post('items')
  @ApiOperation({ summary: '创建商品' })
  createItem(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.createItem(dto);
  }

  @Post('in')
  @ApiOperation({ summary: '入库' })
  stockIn(@Body() dto: CreateInventoryTxnDto) {
    return this.inventoryService.stockIn(dto);
  }

  @Post('out')
  @ApiOperation({ summary: '出库' })
  stockOut(@Body() dto: CreateInventoryTxnDto) {
    return this.inventoryService.stockOut(dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: '获取库存流水' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'itemId', required: false })
  getTransactions(@Query('tenantId') tenantId: string, @Query('itemId') itemId?: string) {
    return this.inventoryService.getTransactions(tenantId, itemId);
  }

  @Get('stock')
  @ApiOperation({ summary: '查询库存' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'itemId', required: true })
  getStock(@Query('tenantId') tenantId: string, @Query('itemId') itemId: string) {
    return this.inventoryService.getStock(tenantId, itemId);
  }
}
