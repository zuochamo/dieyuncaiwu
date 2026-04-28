import { IsString, IsOptional, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryItemDto {
  @ApiProperty({ description: '租户ID' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ description: '商品名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '分类' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '单位' })
  @IsString()
  @IsOptional()
  unit?: string;
}

export class CreateInventoryTxnDto {
  @ApiProperty({ description: '租户ID' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ description: '商品ID' })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ description: '类型: in/out' })
  @IsString()
  type: string;

  @ApiProperty({ description: '数量' })
  @IsNumber()
  qty: number;

  @ApiProperty({ description: '金额' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: '日期' })
  @IsDateString()
  date: string;
}
