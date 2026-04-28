import { IsString, IsOptional, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({ description: '租户ID' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ description: '类型: input/output' })
  @IsString()
  type: string;

  @ApiProperty({ description: '日期' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: '金额' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: '税额' })
  @IsNumber()
  @IsOptional()
  tax?: number;

  @ApiPropertyOptional({ description: '客户名称' })
  @IsString()
  @IsOptional()
  customerName?: string;
}

export class ImportInvoiceDto {
  @ApiProperty({ description: '租户ID' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ description: '发票类型: input/output' })
  @IsString()
  type: string;
}
