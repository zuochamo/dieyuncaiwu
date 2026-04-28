import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportService } from './report.service';

@ApiTags('财务报表')
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('balance-sheet')
  @ApiOperation({ summary: '资产负债表' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'period', required: true, description: '期间 YYYY-MM' })
  async getBalanceSheet(@Query('tenantId') tenantId: string, @Query('period') period: string) {
    const body = await this.reportService.getBalanceSheetDz(tenantId, period);
    return { head: { code: '00000000', description: '成功', msg: '成功', status: 'Y', time: new Date().toISOString() }, body };
  }

  @Get('income')
  @ApiOperation({ summary: '利润表' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'period', required: true, description: '期间 YYYY-MM' })
  getIncomeStatement(@Query('tenantId') tenantId: string, @Query('period') period: string) {
    return this.reportService.getIncomeStatement(tenantId, period);
  }

  @Get('cash-flow')
  @ApiOperation({ summary: '现金流量表 - 基于现金类科目明细生成' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'period', required: true, description: '期间 YYYY-MM' })
  getCashFlowStatement(@Query('tenantId') tenantId: string, @Query('period') period: string) {
    return this.reportService.getCashFlowStatement(tenantId, period);
  }

  @Get('tax-burden')
  @ApiOperation({ summary: '税负分析 - 基于应交税费+发票数据计算税负率' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'period', required: true, description: '期间 YYYY-MM' })
  getTaxBurden(@Query('tenantId') tenantId: string, @Query('period') period: string) {
    return this.reportService.getTaxBurdenAnalysis(tenantId, period);
  }

  @Get('compliance')
  @ApiOperation({ summary: '合规检查 - 凭证合规性校验' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'period', required: false, description: '期间 YYYY-MM（不传则检查全部）' })
  checkCompliance(@Query('tenantId') tenantId: string, @Query('period') period?: string) {
    return this.reportService.checkCompliance(tenantId, period);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard 工作台关键指标' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'period', required: false, description: '期间 YYYY-MM（不传则取最新）' })
  getDashboardStats(@Query('tenantId') tenantId: string, @Query('period') period?: string) {
    return this.reportService.getDashboardStats(tenantId, period);
  }
}
