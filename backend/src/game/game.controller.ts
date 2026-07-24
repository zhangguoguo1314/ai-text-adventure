import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { GameService } from './game.service';
import { AiService } from './ai.service';
import {
  StartGameDto,
  ChatDto,
  SaveGameDto,
  UseItemDto,
  UseSkillDto,
  CombatActionDto,
  TradeDto,
  NpcDialogueDto,
} from './dto/game.dto';
import { CombinedAuthGuard } from '../auth/auth.guard';

@ApiTags('游戏引擎')
@Controller('api/game')
@UseGuards(CombinedAuthGuard)
@ApiBearerAuth()
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly aiService: AiService,
  ) {}

  @Post('start')
  @ApiOperation({ summary: '开始新游戏（支持角色创建配置）' })
  async startGame(@Req() req: any, @Body() dto: StartGameDto) {
    return this.gameService.startGame(req.user.id, dto.scriptId, dto.characterConfig);
  }

  @Get(':sessionId')
  @ApiOperation({ summary: '获取当前游戏状态' })
  async getSession(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.gameService.getSession(Number(sessionId), req.user.id);
  }

  @Post(':sessionId/chat')
  @ApiOperation({ summary: '玩家行动（SSE流式返回）' })
  async chat(
    @Param('sessionId') sessionId: string,
    @Body() dto: ChatDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const userId = req.user.id;

    // 设置 SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      // 获取游戏状态
      const sessionData = await this.gameService.getSession(
        Number(sessionId),
        userId,
      );
      const session = sessionData.data;
      const gameState = session.gameState;
      const script = session.script;

      // 构建对话历史
      const history = [...gameState.history];

      // 添加玩家最新行动
      history.push({ role: 'player', content: dto.action, type: 'narrative' });

      // 构建系统 prompt（使用增强版）
      const systemPrompt = this.gameService.buildPrompt(
        script.worldSetting || '',
        gameState,
        script.npcs.map((npc: any) => ({
          name: npc.name,
          personality: npc.personality,
        })),
      );

      // 将 GameMessage[] 转换为 AI 消息格式
      const aiMessages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-20).map((msg: any) => ({
          role: msg.role === 'player' ? 'user' : msg.role === 'system' ? 'system' : 'assistant',
          content: msg.content,
        })),
      ];

      // 预估 token 数并检查余额
      const inputChars = aiMessages.reduce(
        (sum: number, m: any) => sum + m.content.length,
        0,
      );
      const estimatedInputTokens = Math.ceil(inputChars / 4);

      await this.gameService.checkBalance(userId, estimatedInputTokens);

      // 调用 AI 流式生成
      const stream = await this.aiService.streamGenerate(aiMessages);

      // 收集完整文本用于后续处理
      let fullText = '';
      const inputTokens = estimatedInputTokens;
      let outputTokens = 0;

      stream.on('data', (chunk: any) => {
        if (chunk.type === 'text') {
          fullText += chunk.content;
          outputTokens = Math.ceil(fullText.length / 4);
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        } else {
          // 其他所有类型的 SSE 消息都透传给前端
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      });

      stream.on('end', () => {
        // 使用增强版 JSON 解析
        const { parsed, events } = this.aiService.parseAiResponse(fullText);

        // 将解析出的事件作为独立 SSE 消息发送给前端
        for (const event of events) {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        }

        // 将 AI 返回的变化应用到 GameState
        if (parsed) {
          AiService.applyAiResponseToGameState(parsed, gameState);
        }

        // 更新对话历史
        gameState.history.push({
          role: 'narrator',
          content: fullText,
          type: 'narrative',
        });

        // 如果触发了战斗，添加战斗开始消息到历史
        if (parsed?.combat?.trigger && parsed.combat.enemy) {
          gameState.history.push({
            role: 'narrator',
            content: `战斗开始！${parsed.combat.enemy.name} 出现了！`,
            type: 'combat',
            metadata: { event: 'combat_start', enemy: parsed.combat.enemy },
          });
        }

        // 异步更新游戏状态和扣费（不阻塞响应）
        this.gameService
          .updateGameState(Number(sessionId), gameState)
          .then(() => {
            return this.gameService.deductTokens(
              userId,
              Number(sessionId),
              inputTokens,
              outputTokens,
            );
          })
          .catch(() => {
            // 扣费失败不影响游戏
          });

        res.write('data: [DONE]\n\n');
        res.end();
      });

      stream.on('error', (err: Error) => {
        console.error('Stream error:', err);
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            content: 'AI 生成出错: ' + err.message,
          })}\n\n`,
        );
        res.end();
      });
    } catch (error: any) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const response = error instanceof HttpException ? error.getResponse() : { message: '内部错误' };

      const statusCode = typeof response === 'object' && response !== null && 'statusCode' in (response as any)
        ? (response as any).statusCode
        : status;
      const message = typeof response === 'object' && response !== null && 'message' in (response as any)
        ? (response as any).message
        : '服务器内部错误';

      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          content: message,
          code: statusCode,
        })}\n\n`,
      );
      res.end();
    }
  }

  // ========================
  // 新增接口端点
  // ========================

  @Post(':sessionId/use-item')
  @ApiOperation({ summary: '使用/装备物品' })
  async useItem(
    @Param('sessionId') sessionId: string,
    @Body() dto: UseItemDto,
    @Req() req: any,
  ) {
    return this.gameService.useItem(
      Number(sessionId),
      req.user.id,
      dto.itemId,
      dto.target,
    );
  }

  @Post(':sessionId/use-skill')
  @ApiOperation({ summary: '使用技能' })
  async useSkill(
    @Param('sessionId') sessionId: string,
    @Body() dto: UseSkillDto,
    @Req() req: any,
  ) {
    return this.gameService.useSkill(
      Number(sessionId),
      req.user.id,
      dto.skillId,
    );
  }

  @Post(':sessionId/combat-action')
  @ApiOperation({ summary: '战斗行动' })
  async combatAction(
    @Param('sessionId') sessionId: string,
    @Body() dto: CombatActionDto,
    @Req() req: any,
  ) {
    return this.gameService.processCombat(
      Number(sessionId),
      req.user.id,
      dto.action,
      { skillId: dto.skillId, itemId: dto.itemId },
    );
  }

  @Get(':sessionId/dialogue')
  @ApiOperation({ summary: '与NPC对话' })
  async getNpcDialogue(
    @Param('sessionId') sessionId: string,
    @Query('npcName') npcName: string,
    @Req() req: any,
  ) {
    return this.gameService.getNpcDialogue(
      Number(sessionId),
      req.user.id,
      npcName,
    );
  }

  @Post(':sessionId/trade')
  @ApiOperation({ summary: '商店交易' })
  async trade(
    @Param('sessionId') sessionId: string,
    @Body() dto: TradeDto,
    @Req() req: any,
  ) {
    return this.gameService.trade(
      Number(sessionId),
      req.user.id,
      dto.action,
      dto.itemId,
      dto.quantity,
    );
  }

  @Get(':sessionId/endings')
  @ApiOperation({ summary: '获取所有已达成结局' })
  async getEndings(
    @Param('sessionId') sessionId: string,
    @Req() req: any,
  ) {
    return this.gameService.getEndings(Number(sessionId), req.user.id);
  }

  @Get(':sessionId/achievements')
  @ApiOperation({ summary: '获取游戏内成就' })
  async getAchievements(
    @Param('sessionId') sessionId: string,
    @Req() req: any,
  ) {
    return this.gameService.getAchievements(Number(sessionId), req.user.id);
  }

  @Get(':sessionId/saves')
  @ApiOperation({ summary: '获取存档列表' })
  async getSaves(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.gameService.getSaves(Number(sessionId), req.user.id);
  }

  @Post(':sessionId/save')
  @ApiOperation({ summary: '手动存档' })
  async saveGame(
    @Param('sessionId') sessionId: string,
    @Body() dto: SaveGameDto,
    @Req() req: any,
  ) {
    return this.gameService.saveGame(
      Number(sessionId),
      req.user.id,
      dto?.description,
    );
  }
}
