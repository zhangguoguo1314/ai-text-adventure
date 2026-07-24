import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AchievementService } from './achievement.service';
import { CombinedAuthGuard } from '../auth/auth.guard';

@ApiTags('成就')
@Controller('api/achievement')
@UseGuards(CombinedAuthGuard)
@ApiBearerAuth()
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  @Get()
  @ApiOperation({ summary: '所有成就列表（含用户解锁状态）' })
  async getAllAchievements(@Req() req: any) {
    return this.achievementService.getAllAchievements(req.user?.id);
  }

  @Get('my')
  @ApiOperation({ summary: '我的成就（已解锁）' })
  async getMyAchievements(@Req() req: any) {
    return this.achievementService.getMyAchievements(req.user.id);
  }

  @Post('check')
  @ApiOperation({ summary: '检查并解锁成就' })
  async checkAchievements(@Req() req: any) {
    return this.achievementService.checkAchievements(req.user.id);
  }
}
