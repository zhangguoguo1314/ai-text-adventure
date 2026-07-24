import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InGameAppService } from './in-game-app.service';
import { CombinedAuthGuard } from '../auth/auth.guard';
import {
  CreateInGameAppDto,
  UpdateInGameAppDto,
  ReorderInGameAppDto,
  QueryInGameAppDto,
} from './dto/in-game-app.dto';

/**
 * 剧本内置APP
 * 对标 UU 平台剧本内的自定义软件功能（如校园助手、直播小助手等）。
 *
 * 路由前缀中包含 :scriptId 参数，与 ScriptsController（api/scripts）不冲突。
 *
 * 注意：静态路由（active / reorder）必须声明在 :appId 参数路由之前，
 * 否则会被参数路由（如 appId="active"）提前捕获。
 */
@ApiTags('剧本内置APP')
@Controller('api/scripts/:scriptId/in-game-apps')
export class InGameAppController {
  constructor(private readonly inGameAppService: InGameAppService) {}

  /* ============== 玩家端：游戏中获取APP数据（玩家可访问，仅激活） ============== */

  @Get('active')
  @ApiOperation({ summary: '游戏中获取APP数据（玩家可访问，仅返回激活的APP）' })
  async listForPlayer(
    @Param('scriptId') scriptId: string,
    @Query('appType') appType?: string,
  ) {
    return this.inGameAppService.listForPlayer(Number(scriptId), appType);
  }

  /* ============== 作者管理端 ============== */

  @Get()
  @ApiOperation({ summary: '获取剧本的所有内置APP列表（作者管理视图，含未激活）' })
  async list(
    @Param('scriptId') scriptId: string,
    @Query() dto: QueryInGameAppDto,
  ) {
    return this.inGameAppService.listByScript(Number(scriptId), dto);
  }

  @Post()
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '为剧本创建内置APP（仅作者）' })
  async create(
    @Param('scriptId') scriptId: string,
    @Body() dto: CreateInGameAppDto,
    @Req() req: any,
  ) {
    return this.inGameAppService.create(Number(scriptId), req.user.id, dto);
  }

  @Put('reorder')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量更新内置APP排序（仅作者）' })
  async reorder(
    @Param('scriptId') scriptId: string,
    @Body() dto: ReorderInGameAppDto,
    @Req() req: any,
  ) {
    return this.inGameAppService.reorder(Number(scriptId), req.user.id, dto);
  }

  @Get(':appId')
  @ApiOperation({ summary: '获取单个内置APP详情' })
  async findOne(
    @Param('scriptId') scriptId: string,
    @Param('appId') appId: string,
  ) {
    return this.inGameAppService.findOne(Number(scriptId), Number(appId));
  }

  @Put(':appId')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新内置APP（仅作者）' })
  async update(
    @Param('scriptId') scriptId: string,
    @Param('appId') appId: string,
    @Body() dto: UpdateInGameAppDto,
    @Req() req: any,
  ) {
    return this.inGameAppService.update(
      Number(scriptId),
      Number(appId),
      req.user.id,
      dto,
    );
  }

  @Delete(':appId')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除内置APP（仅作者）' })
  async remove(
    @Param('scriptId') scriptId: string,
    @Param('appId') appId: string,
    @Req() req: any,
  ) {
    return this.inGameAppService.remove(
      Number(scriptId),
      Number(appId),
      req.user.id,
    );
  }
}
