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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { GameService } from './game.service';
import { AiService } from './ai.service';
import { StartGameDto, ChatDto, SaveGameDto } from './dto/game.dto';
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
  @ApiOperation({ summary: '开始新游戏' })
  async startGame(@Req() req: any, @Body() dto: StartGameDto) {
    return this.gameService.startGame(req.user.id, dto.scriptId);
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
      history.push({ role: 'user', content: dto.action });

      // 构建系统 prompt
      const systemPrompt = this.gameService.buildPrompt(
        script.worldSetting || '',
        gameState,
        script.npcs.map((npc: any) => ({
          name: npc.name,
          personality: npc.personality,
        })),
      );

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-20), // 保留最近20条对话避免 token 过多
      ];

      // 预估 token 数并检查余额
      const inputChars = messages.reduce(
        (sum: number, m: any) => sum + m.content.length,
        0,
      );
      const estimatedInputTokens = Math.ceil(inputChars / 4);

      await this.gameService.checkBalance(userId, estimatedInputTokens);

      // 调用 AI 流式生成
      const stream = await this.aiService.streamGenerate(messages);

      // 收集完整文本用于后续处理
      let fullText = '';
      const inputTokens = estimatedInputTokens;
      let outputTokens = 0;

      stream.on('data', (chunk: any) => {
        if (chunk.type === 'text') {
          fullText += chunk.content;
          outputTokens = Math.ceil(fullText.length / 4);
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        } else if (chunk.type === 'choices') {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        } else if (chunk.type === 'attribute_change') {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        } else if (chunk.type === 'error') {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      });

      stream.on('end', () => {
        // 尝试解析完整文本中的 JSON
        try {
          const jsonMatch = fullText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);

            // 处理属性变化
            if (
              parsed.attribute_changes &&
              Object.keys(parsed.attribute_changes).length > 0
            ) {
              for (const [key, val] of Object.entries(
                parsed.attribute_changes,
              )) {
                const numVal = Number(val);
                if (gameState.attributes[key] !== undefined) {
                  gameState.attributes[key] += numVal;
                } else {
                  gameState.attributes[key] = numVal;
                }
              }
            }
          }
        } catch {
          // JSON 解析失败，使用原始文本
        }

        // 更新对话历史
        gameState.history.push({ role: 'assistant', content: fullText });

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
