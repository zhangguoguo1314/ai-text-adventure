import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScriptLogicService } from './script-logic.service';
import { CombinedAuthGuard } from '../auth/auth.guard';
import {
  ScriptLogicConfig,
  EventChain,
  EndingTrigger,
  StoryArc,
  CharacterCreationConfig,
} from './script-logic.types';

@ApiTags('剧本逻辑引擎')
@Controller('api/scripts/:scriptId/logic')
@UseGuards(CombinedAuthGuard)
@ApiBearerAuth()
export class ScriptLogicController {
  constructor(private readonly logicService: ScriptLogicService) {}

  // ========================
  // 逻辑配置管理
  // ========================

  @Get()
  @ApiOperation({ summary: '获取剧本逻辑配置' })
  async getLogicConfig(@Param('scriptId') scriptId: string) {
    const config = await this.logicService.getLogicConfig(Number(scriptId));
    return { success: true, data: config };
  }

  @Put()
  @ApiOperation({ summary: '保存完整逻辑配置' })
  async saveLogicConfig(
    @Param('scriptId') scriptId: string,
    @Req() req: any,
    @Body() body: { config: ScriptLogicConfig },
  ) {
    return this.logicService.saveLogicConfig(
      Number(scriptId),
      req.user.id,
      body.config,
    );
  }

  // ========================
  // 角色创建配置
  // ========================

  @Put('character-creation')
  @ApiOperation({ summary: '更新角色创建配置' })
  async updateCharacterCreation(
    @Param('scriptId') scriptId: string,
    @Req() req: any,
    @Body() body: { config: CharacterCreationConfig },
  ) {
    return this.logicService.updateCharacterCreation(
      Number(scriptId),
      req.user.id,
      body.config,
    );
  }

  // ========================
  // 事件链管理
  // ========================

  @Post('event-chains')
  @ApiOperation({ summary: '添加事件链' })
  async addEventChain(
    @Param('scriptId') scriptId: string,
    @Req() req: any,
    @Body() body: { eventChain: EventChain },
  ) {
    return this.logicService.addEventChain(
      Number(scriptId),
      req.user.id,
      body.eventChain,
    );
  }

  @Put('event-chains/:eventChainId')
  @ApiOperation({ summary: '更新事件链' })
  async updateEventChain(
    @Param('scriptId') scriptId: string,
    @Param('eventChainId') eventChainId: string,
    @Req() req: any,
    @Body() body: { updates: Partial<EventChain> },
  ) {
    return this.logicService.updateEventChain(
      Number(scriptId),
      req.user.id,
      eventChainId,
      body.updates,
    );
  }

  @Delete('event-chains/:eventChainId')
  @ApiOperation({ summary: '删除事件链' })
  async deleteEventChain(
    @Param('scriptId') scriptId: string,
    @Param('eventChainId') eventChainId: string,
    @Req() req: any,
  ) {
    return this.logicService.deleteEventChain(
      Number(scriptId),
      req.user.id,
      eventChainId,
    );
  }

  // ========================
  // 结局触发器管理
  // ========================

  @Post('endings')
  @ApiOperation({ summary: '添加结局触发器' })
  async addEndingTrigger(
    @Param('scriptId') scriptId: string,
    @Req() req: any,
    @Body() body: { ending: EndingTrigger },
  ) {
    return this.logicService.addEndingTrigger(
      Number(scriptId),
      req.user.id,
      body.ending,
    );
  }

  @Put('endings/:endingId')
  @ApiOperation({ summary: '更新结局触发器' })
  async updateEndingTrigger(
    @Param('scriptId') scriptId: string,
    @Param('endingId') endingId: string,
    @Req() req: any,
    @Body() body: { updates: Partial<EndingTrigger> },
  ) {
    return this.logicService.updateEndingTrigger(
      Number(scriptId),
      req.user.id,
      endingId,
      body.updates,
    );
  }

  @Delete('endings/:endingId')
  @ApiOperation({ summary: '删除结局触发器' })
  async deleteEndingTrigger(
    @Param('scriptId') scriptId: string,
    @Param('endingId') endingId: string,
    @Req() req: any,
  ) {
    return this.logicService.deleteEndingTrigger(
      Number(scriptId),
      req.user.id,
      endingId,
    );
  }

  // ========================
  // 故事章节管理
  // ========================

  @Put('story-arcs')
  @ApiOperation({ summary: '更新故事章节' })
  async updateStoryArcs(
    @Param('scriptId') scriptId: string,
    @Req() req: any,
    @Body() body: { storyArcs: StoryArc[] },
  ) {
    return this.logicService.updateStoryArcs(
      Number(scriptId),
      req.user.id,
      body.storyArcs,
    );
  }
}
