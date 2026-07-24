import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Req,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreatorService } from './creator.service';
import { CombinedAuthGuard } from '../auth/auth.guard';
import {
  QueryIncomeRecordsDto,
  QueryCreatorRankingDto,
  VerifyCreatorDto,
} from './dto/creator.dto';

@ApiTags('创作者等级')
@Controller('api/creator')
@UseGuards(CombinedAuthGuard)
@ApiBearerAuth()
export class CreatorController {
  constructor(private readonly creatorService: CreatorService) {}

  // ==================== 等级体系 ====================

  @Get('levels')
  @ApiOperation({ summary: '获取创作者等级体系配置（5 级阶梯）' })
  async getLevelTiers() {
    return this.creatorService.getLevelTiers();
  }

  // ==================== 创作者等级信息 ====================

  @Get('level')
  @ApiOperation({ summary: '获取我的创作者等级信息' })
  async getMyLevel(@Req() req: any) {
    return this.creatorService.getCreatorLevel(req.user.id);
  }

  @Get('level/:userId')
  @ApiOperation({ summary: '获取指定用户的创作者等级信息' })
  async getUserLevel(@Param('userId', ParseIntPipe) userId: number) {
    return this.creatorService.getCreatorLevel(userId);
  }

  @Post('level/refresh')
  @ApiOperation({ summary: '手动刷新我的创作者等级（基于剧本数据统计）' })
  async refreshMyLevel(@Req() req: any) {
    return this.creatorService.refreshCreatorLevel(req.user.id);
  }

  // ==================== 收益记录 ====================

  @Get('income')
  @ApiOperation({ summary: '获取创作者收益记录（分页、时间范围筛选）' })
  async getIncomeRecords(
    @Req() req: any,
    @Query() dto: QueryIncomeRecordsDto,
  ) {
    return this.creatorService.getIncomeRecords(req.user.id, dto);
  }

  // ==================== 创作者排行榜 ====================

  @Get('ranking')
  @ApiOperation({ summary: '获取创作者排行榜（支持多维度排序）' })
  async getRanking(@Query() dto: QueryCreatorRankingDto) {
    return this.creatorService.getCreatorRanking(dto);
  }

  // ==================== 创作者认证（管理员） ====================

  @Put(':userId/verify')
  @ApiOperation({ summary: '管理员审核创作者认证（通过后获得创作者身份与星河头像框）' })
  async verifyCreator(
    @Req() req: any,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: VerifyCreatorDto,
  ) {
    return this.creatorService.verifyCreator(req.user.id, userId, dto);
  }
}
