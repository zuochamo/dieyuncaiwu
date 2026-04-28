import { IsString, IsOptional, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ description: '租户名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '行业类型' })
  @IsString()
  @IsOptional()
  industryType?: string;

  @ApiPropertyOptional({ description: '启用期间 YYYY-MM' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: '启用期间格式应为 YYYY-MM' })
  startPeriod?: string;
}

export class UpdateTenantDto {
  @ApiPropertyOptional({ description: '租户名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '行业类型' })
  @IsString()
  @IsOptional()
  industryType?: string;
}

export class SetupAccountDto {
  @ApiProperty({ description: '启用期间 YYYY-MM' })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: '启用期间格式应为 YYYY-MM' })
  startPeriod: string;
}
