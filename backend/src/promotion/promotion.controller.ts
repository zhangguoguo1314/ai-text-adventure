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
import { PromotionService } from './promotion.service';
import {
  SubmitPromotionDto,
  ReviewPromotionDto,
  QueryPromotionDto,
} from './dto/promotion.dto';
import { CombinedAuthGuard } from '../auth/auth.guard';

@ApiTags('推广奖励')
@Controller('api/promotion')
@UseGuards(CombinedAuthGuard)
@ApiBearerAuth()
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  // ==================== 用户端 ====================

  @Get('info')
  @ApiOperation({ summary: '获取推广活动说明' })
  async getPromotionInfo() {
    return this.promotionService.getPromotionInfo();
  }

  @Post('submit')
  @ApiOperation({ summary: '提交推广链接' })
  async submitPromotion(@Req() req: any, @Body() dto: SubmitPromotionDto) {
    return this.promotionService.submitPromotion(req.user.id, dto);
  }

  @Get('my-rewards')
  @ApiOperation({ summary: '获取我的推广奖励列表（分页）' })
  async getMyRewards(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.promotionService.getMyRewards(
      req.user.id,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Get('my-stats')
  @ApiOperation({ summary: '获取我的推广统计' })
  async getMyStats(@Req() req: any) {
    return this.promotionService.getMyStats(req.user.id);
  }

  // ==================== 管理员端 ====================

  @Get('admin/list')
  @ApiOperation({ summary: '管理员获取推广奖励列表（分页、筛选）' })
  async getPromotionList(@Req() req: any, @Query() dto: QueryPromotionDto) {
    return this.promotionService.getPromotionList(req.user.id, dto);
  }

  @Put('admin/:id/review')
  @ApiOperation({ summary: '管理员审核推广链接（通过/拒绝）' })
  async reviewPromotion(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewPromotionDto,
  ) {
    return this.promotionService.reviewPromotion(req.user.id, id, dto);
  }
}
