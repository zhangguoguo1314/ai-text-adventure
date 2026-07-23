import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';

export interface GameState {
  currentNodeId: number | null;
  attributes: Record<string, any>;
  npcRelations: Record<string, number>;
  inventory: string[];
  history: { role: string; content: string }[];
}

@Injectable()
export class GameService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  /**
   * 开始新游戏
   */
  async startGame(userId: number, scriptId: number) {
    const script = await this.prisma.script.findUnique({
      where: { id: scriptId },
      include: { npcs: true, attributes: true },
    });

    if (!script) {
      throw new NotFoundException('剧本不存在');
    }

    if (script.status !== 'published') {
      throw new ForbiddenException('该剧本尚未发布');
    }

    // 从剧本属性初始化默认值
    const attributes: Record<string, any> = {};
    for (const attr of script.attributes) {
      if (attr.defaultVal !== null && attr.defaultVal !== undefined) {
        if (attr.type === 'number') {
          attributes[attr.name] = parseFloat(attr.defaultVal) || 0;
        } else if (attr.type === 'boolean') {
          attributes[attr.name] = attr.defaultVal === 'true';
        } else {
          attributes[attr.name] = attr.defaultVal;
        }
      }
    }

    // 初始化 NPC 好感度
    const npcRelations: Record<string, number> = {};
    for (const npc of script.npcs) {
      npcRelations[npc.name] = 0;
    }

    const gameState: GameState = {
      currentNodeId: null,
      attributes,
      npcRelations,
      inventory: [],
      history: [],
    };

    // 创建 game_session
    const session = await this.prisma.gameSession.create({
      data: {
        userId,
        scriptId,
        gameState: JSON.stringify(gameState),
      },
    });

    // 自动创建初始存档
    await this.prisma.save.create({
      data: {
        userId,
        sessionId: session.id,
        gameState: JSON.stringify(gameState),
        description: '初始存档',
        isAuto: true,
      },
    });

    // 更新剧本游玩次数
    await this.prisma.script.update({
      where: { id: scriptId },
      data: { playCount: { increment: 1 } },
    });

    return {
      success: true,
      data: {
        sessionId: session.id,
        scriptId: session.scriptId,
        gameState,
      },
    };
  }

  /**
   * 获取当前游戏状态
   */
  async getSession(sessionId: number, userId: number) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        script: {
          include: { npcs: true, attributes: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('游戏会话不存在');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('无权访问此游戏会话');
    }

    return {
      success: true,
      data: {
        id: session.id,
        scriptId: session.scriptId,
        script: session.script,
        gameState: JSON.parse(session.gameState),
        totalTokens: session.totalTokens,
        totalCost: session.totalCost,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    };
  }

  /**
   * 获取存档列表
   */
  async getSaves(sessionId: number, userId: number) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('游戏会话不存在');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('无权访问此游戏会话');
    }

    const saves = await this.prisma.save.findMany({
      where: { sessionId, userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: saves.map((s) => ({
        id: s.id,
        gameState: JSON.parse(s.gameState),
        description: s.description,
        isAuto: s.isAuto,
        createdAt: s.createdAt,
      })),
    };
  }

  /**
   * 手动存档
   */
  async saveGame(
    sessionId: number,
    userId: number,
    description?: string,
  ) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('游戏会话不存在');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('无权访问此游戏会话');
    }

    const save = await this.prisma.save.create({
      data: {
        userId,
        sessionId,
        gameState: session.gameState,
        description: description || '手动存档',
        isAuto: false,
      },
    });

    return {
      success: true,
      data: {
        id: save.id,
        description: save.description,
        createdAt: save.createdAt,
      },
    };
  }

  /**
   * 构建系统 Prompt
   */
  buildPrompt(
    worldSetting: string,
    gameState: GameState,
    npcList: { name: string; personality: string }[],
  ): string {
    let systemPrompt = '你是一个文字冒险游戏的叙述者。请根据玩家的行动，描述接下来发生的事情。\n\n';

    if (worldSetting) {
      systemPrompt += `【世界观规则】\n${worldSetting}\n\n`;
    }

    systemPrompt += `【当前场景属性】\n`;
    for (const [key, val] of Object.entries(gameState.attributes)) {
      systemPrompt += `- ${key}: ${val}\n`;
    }
    systemPrompt += '\n';

    if (npcList.length > 0) {
      systemPrompt += `【NPC列表】\n`;
      for (const npc of npcList) {
        const relation = gameState.npcRelations[npc.name] ?? 0;
        systemPrompt += `- ${npc.name}: ${npc.personality}（好感度: ${relation}）\n`;
      }
      systemPrompt += '\n';
    }

    systemPrompt += `请根据玩家的行动，描述接下来发生的事情，并在最后提供2-4个选项供玩家选择。\n`;
    systemPrompt += `必须严格使用以下JSON格式返回：\n`;
    systemPrompt += `{"narrative": "场景描述...", "choices": ["选项A", "选项B", "选项C"], "attribute_changes": {"属性名": 变化值}}\n`;
    systemPrompt += `注意：\n`;
    systemPrompt += `- narrative 是场景的详细描述，要生动有趣\n`;
    systemPrompt += `- choices 是2-4个供玩家选择的选项\n`;
    systemPrompt += `- attribute_changes 是属性变化，值为数字（正负均可），没有变化则为{}\n`;

    return systemPrompt;
  }

  /**
   * 检查用户余额是否足够
   * 简单估算：输入字符数 / 4 约等于 token 数
   */
  async checkBalance(userId: number, estimatedTokens: number): Promise<void> {
    const balance = await this.prisma.userBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message: '账户余额不存在，请充值',
          error: 'PaymentRequired',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const totalBalance = balance.permanentBalance + balance.tempBalance;
    const cost = Math.ceil(estimatedTokens * 0.1); // 简单计费：每10 token 扣1 UU币

    if (totalBalance < cost) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message: `余额不足。需要 ${cost} UU币，当前余额 ${totalBalance} UU币`,
          error: 'PaymentRequired',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  /**
   * 扣费并记录交易
   */
  async deductTokens(
    userId: number,
    sessionId: number,
    inputTokens: number,
    outputTokens: number,
  ): Promise<void> {
    const totalTokens = inputTokens + outputTokens;
    const cost = Math.ceil(totalTokens * 0.1);

    // 更新用户余额（优先扣临时余额）
    const balance = await this.prisma.userBalance.findUnique({
      where: { userId },
    });

    if (!balance) return;

    let remaining = cost;
    let newTemp = balance.tempBalance;
    let newPermanent = balance.permanentBalance;

    if (newTemp >= remaining) {
      newTemp -= remaining;
      remaining = 0;
    } else {
      remaining -= newTemp;
      newTemp = 0;
      newPermanent -= remaining;
    }

    await this.prisma.userBalance.update({
      where: { userId },
      data: {
        tempBalance: Math.max(0, newTemp),
        permanentBalance: Math.max(0, newPermanent),
      },
    });

    // 记录交易日志
    await this.prisma.transactionLog.create({
      data: {
        userId,
        type: 'spend',
        amount: cost,
        currency: 'uu',
        description: `AI 调用消耗 ${totalTokens} tokens`,
        relatedType: 'ai_call',
        relatedId: sessionId,
      },
    });

    // 更新会话统计
    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        totalTokens: { increment: totalTokens },
        totalCost: { increment: cost },
      },
    });
  }

  /**
   * 更新游戏状态
   */
  async updateGameState(sessionId: number, gameState: GameState): Promise<void> {
    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        gameState: JSON.stringify(gameState),
      },
    });
  }
}
