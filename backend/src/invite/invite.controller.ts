import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InviteService } from './invite.service';
import { BindInviteDto } from './dto/invite.dto';
import { CombinedAuthGuard } from '../auth/auth.guard';

@ApiTags('邀请奖励')
@Controller('api/invite')
@UseGuards(CombinedAuthGuard)
@ApiBearerAuth()
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Get('my-code')
  @ApiOperation({ summary: '获取我的邀请码和邀请统计' })
  async getMyCode(@Req() req: any) {
    return this.inviteService.getMyCode(req.user.id);
  }

  @Get('my-invitations')
  @ApiOperation({ summary: '我邀请的用户列表（分页）' })
  async getMyInvitations(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.inviteService.getMyInvitations(
      req.user.id,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Post('bind')
  @ApiOperation({ summary: '绑定邀请人（注册后可补绑，只能绑一次）' })
  async bindInviter(@Req() req: any, @Body() dto: BindInviteDto) {
    return this.inviteService.bindInviter(req.user.id, dto);
  }

  @Get('rewards')
  @ApiOperation({ summary: '邀请奖励规则说明' })
  async getRewards() {
    return this.inviteService.getRewards();
  }

  @Get('leaderboard')
  @ApiOperation({ summary: '邀请排行榜（邀请人数最多的前20名）' })
  async getLeaderboard() {
    return this.inviteService.getLeaderboard();
  }
}
