import { Controller, Get, Put, Param, Req, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoinService } from './coin.service';
import { CombinedAuthGuard } from '../auth/auth.guard';

@ApiTags('模型管理')
@Controller('api/models')
export class CoinController {
  constructor(private readonly coinService: CoinService) {}

  @Get()
  @ApiOperation({ summary: '获取可用AI模型列表' })
  async getModels() {
    return this.coinService.getModels();
  }

  @Put(':id/pref')
  @ApiOperation({ summary: '设置用户偏好模型' })
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  async setModelPreference(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.coinService.setModelPreference(req.user.id, id);
  }

  @Get('preference')
  @ApiOperation({ summary: '获取用户偏好' })
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  async getUserPreference(@Req() req: any) {
    return this.coinService.getUserPreference(req.user.id);
  }
}
