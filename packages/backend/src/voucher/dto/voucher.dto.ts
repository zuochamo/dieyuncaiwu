import { IsString, IsOptional, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VoucherEntryDto {
  @ApiProperty({ description: '科目ID' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiPropertyOptional({ description: '辅助核算类型（c/s/i 等）' })
  @IsString()
  @IsOptional()
  assistantType?: string;

  @ApiPropertyOptional({ description: '辅助核算项ID（bigint 字符串）' })
  @IsString()
  @IsOptional()
  assistantId?: string;

  @ApiPropertyOptional({ description: '数量' })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: '单位' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ description: '币种' })
  @IsString()
  @IsOptional()
  fcurCode?: string;

  @ApiPropertyOptional({ description: '汇率' })
  @IsNumber()
  @IsOptional()
  exchangeRate?: number;

  @ApiPropertyOptional({ description: '外币金额' })
  @IsNumber()
  @IsOptional()
  fcurAmount?: number;

  @ApiProperty({ description: '借方金额' })
  @IsNumber()
  debit: number;

  @ApiProperty({ description: '贷方金额' })
  @IsNumber()
  credit: number;

  @ApiPropertyOptional({ description: '摘要' })
  @IsString()
  @IsOptional()
  summary?: string;
}

export class CreateVoucherDto {
  @ApiProperty({ description: '租户ID' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ description: '凭证日期' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: '凭证字/类型', default: 'JI' })
  @IsString()
  @IsOptional()
  docType?: string;

  @ApiPropertyOptional({ description: '附件张数', default: 0 })
  @IsNumber()
  @IsOptional()
  attachmentsCount?: number;

  @ApiPropertyOptional({ description: '来源类型', default: 'manual' })
  @IsString()
  @IsOptional()
  sourceType?: string;

  @ApiPropertyOptional({ description: '来源ID' })
  @IsString()
  @IsOptional()
  sourceId?: string;

  @ApiProperty({ description: '凭证明细', type: [VoucherEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VoucherEntryDto)
  entries: VoucherEntryDto[];
}

export class PostVoucherDto {
  @ApiProperty({ description: '凭证ID' })
  @IsString()
  @IsNotEmpty()
  voucherId: string;
}

export class UpdateVoucherDto {
  @ApiProperty({ description: '租户ID' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ description: '凭证日期' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: '附件张数', default: 0 })
  @IsNumber()
  @IsOptional()
  attachmentsCount?: number;

  @ApiProperty({ description: '凭证明细', type: [VoucherEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VoucherEntryDto)
  entries: VoucherEntryDto[];
}
