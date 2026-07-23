import { Controller, Get, Put, Post, Delete, Body, Param, Req, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import {
  UpdateProfileDto,
  AddCustomAiDto,
  UpdateCustomAiDto,
  RechargeDto,
  QueryTransactionsDto,
} from './dto/user.dto';
import { CombinedAuthGuard } from '../auth/auth.guard';

@ApiTags('用户')
@Controller('api/user')
@UseGuards(CombinedAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('balance')
  @ApiOperation({ summary: '获取余额' })
  async getBalance(@Req() req: any) {
    return this.userService.getBalance(req.user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: '更新资料' })
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  @Post('custom-ai')
  @ApiOperation({ summary: '添加自定义API' })
  async addCustomAi(@Req() req: any, @Body() dto: AddCustomAiDto) {
    return this.userService.addCustomAi(req.user.id, dto);
  }

  @Get('custom-ai')
  @ApiOperation({ summary: '获取自定义API列表' })
  async getCustomAiList(@Req() req: any) {
    return this.userService.getCustomAiList(req.user.id);
  }

  @Put('custom-ai/:id')
  @ApiOperation({ summary: '更新自定义API' })
  async updateCustomAi(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomAiDto,
  ) {
    return this.userService.updateCustomAi(req.user.id, id, dto);
  }

  @Delete('custom-ai/:id')
  @ApiOperation({ summary: '删除自定义API' })
  async deleteCustomAi(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userService.deleteCustomAi(req.user.id, id);
  }

  @Post('custom-ai/:id/test')
  @ApiOperation({ summary: '测试自定义API连接' })
  async testCustomApi(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userService.testCustomApi(req.user.id, id);
  }

  @Put('custom-ai/:id/default')
  @ApiOperation({ summary: '设为默认自定义API' })
  async setDefaultCustomAi(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userService.setDefaultCustomAi(req.user.id, id);
  }

  @Post('recharge')
  @ApiOperation({ summary: '充值（开发模式直接到账）' })
  async recharge(@Req() req: any, @Body() dto: RechargeDto) {
    return this.userService.recharge(req.user.id, dto);
  }

  @Post('redeem')
  @ApiOperation({ summary: '兑换码' })
  async redeem(@Req() req: any, @Body('code') code: string) {
    return this.userService.redeem(req.user.id, code);
  }

  @Get('transactions')
  @ApiOperation({ summary: '交易记录列表（分页）' })
  async getTransactions(@Req() req: any, @Query() dto: QueryTransactionsDto) {
    return this.userService.getTransactions(req.user.id, dto);
  }

  @Get('followers')
  @ApiOperation({ summary: '获取粉丝列表' })
  async getFollowers(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.userService.getFollowers(
      req.user.id,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Get('following')
  @ApiOperation({ summary: '获取关注列表' })
  async getFollowing(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.userService.getFollowing(
      req.user.id,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }
}
