import { Controller, Get, Put, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateProfileDto, AddCustomAiDto } from './dto/user.dto';
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
}
