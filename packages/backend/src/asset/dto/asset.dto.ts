import { IsString, IsOptional, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssetDto {
  @ApiProperty({ description: '租户ID' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ description: '资产名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '原值' })
  @IsNumber()
  originalValue: number;

  @ApiPropertyOptional({ description: '残值率', default: 0.05 })
  @IsNumber()
  @IsOptional()
  residualRate?: number;

  @ApiProperty({ description: '使用年限（月）' })
  @IsNumber()
  usefulLife: number;

  @ApiProperty({ description: '启用日期' })
  @IsDateString()
  startDate: string;
}

export class RunDepreciationDto {
  @ApiProperty({ description: '租户ID' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ description: '折旧期间 YYYY-MM' })
  @IsString()
  @IsNotEmpty()
  period: string;
}
