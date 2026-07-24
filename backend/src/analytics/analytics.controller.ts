import { Controller, Get, Req, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { RevenueChartDto } from './dto/analytics.dto';
import { CombinedAuthGuard } from '../auth/auth.guard';

@ApiTags('创作者数据')
@Controller('api/analytics')
@UseGuards(CombinedAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('creator/dashboard')
  @ApiOperation({ summary: '创作者仪表盘概览' })
  async getDashboard(@Req() req: any) {
    return this.analyticsService.getDashboard(req.user.id);
  }

  @Get('creator/scripts-stats')
  @ApiOperation({ summary: '我的剧本统计列表' })
  async getScriptsStats(@Req() req: any) {
    return this.analyticsService.getScriptsStats(req.user.id);
  }

  @Get('creator/revenue-chart')
  @ApiOperation({ summary: '收入趋势图（最近 N 天）' })
  async getRevenueChart(@Req() req: any, @Query() dto: RevenueChartDto) {
    return this.analyticsService.getRevenueChart(req.user.id, dto.days || 30);
  }

  @Get('creator/play-chart')
  @ApiOperation({ summary: '游玩趋势图（最近 N 天）' })
  async getPlayChart(@Req() req: any, @Query() dto: RevenueChartDto) {
    return this.analyticsService.getPlayChart(req.user.id, dto.days || 30);
  }

  @Get('creator/audience')
  @ApiOperation({ summary: '受众分析' })
  async getAudience(@Req() req: any) {
    return this.analyticsService.getAudience(req.user.id);
  }
}
