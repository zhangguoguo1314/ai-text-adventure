import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GameService, GameState } from './game.service';
import { AiService } from './ai.service';
import { RealtimeService } from '../realtime/realtime.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * GameService 单元测试
 *
 * 覆盖方法：
 * - startGame：成功 / 剧本不存在 / 剧本未发布 / 属性初始化 / NPC 好感度初始化
 * - buildPrompt：构建系统 prompt 的格式
 * - checkBalance：余额充足 / 余额不足 / 余额记录不存在
 * - deductTokens：扣费逻辑（临时余额优先 / 创作者分成 / 会话统计更新）
 *
 * PrismaService / AiService / RealtimeService 均为 mock。
 */
describe('GameService', () => {
  let service: GameService;
  let prismaService: any;
  let realtimeService: jest.Mocked<RealtimeService>;

  // 已发布的剧本（含 NPC 和属性）
  const publishedScript = {
    id: 100,
    authorId: 2,
    title: '冒险剧本',
    status: 'published',
    worldSetting: '一个充满未知的世界',
    npcs: [
      { id: 1, scriptId: 100, name: '神秘旅人', personality: '沉稳内敛', sortOrder: 0 },
      { id: 2, scriptId: 100, name: '村长女儿', personality: '活泼开朗', sortOrder: 1 },
    ],
    attributes: [
      { id: 1, scriptId: 100, name: '勇气', type: 'number', defaultVal: '50', minVal: 0, maxVal: 100 },
      { id: 2, scriptId: 100, name: '阵营', type: 'enum', defaultVal: '中立', minVal: null, maxVal: null },
      { id: 3, scriptId: 100, name: '已加入', type: 'boolean', defaultVal: 'false', minVal: null, maxVal: null },
    ],
  };

  beforeEach(async () => {
    prismaService = {
      script: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      gameSession: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      save: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      userBalance: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      transactionLog: {
        create: jest.fn(),
      },
    };

    realtimeService = {
      sendBalanceUpdate: jest.fn(),
      notifyUser: jest.fn(),
      broadcast: jest.fn(),
      notifyGameSession: jest.fn(),
      sendNotification: jest.fn(),
      broadcastAnnouncement: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AiService, useValue: { streamGenerate: jest.fn() } },
        { provide: RealtimeService, useValue: realtimeService },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /* ===================== startGame ===================== */

  describe('startGame', () => {
    it('开始游戏成功，应初始化属性、NPC好感度并创建会话', async () => {
      prismaService.script.findUnique.mockResolvedValue(publishedScript);
      prismaService.gameSession.create.mockResolvedValue({
        id: 500,
        userId: 1,
        scriptId: 100,
      });
      prismaService.save.create.mockResolvedValue({});
      prismaService.script.update.mockResolvedValue({});

      const result = await service.startGame(1, 100);

      expect(result.success).toBe(true);
      expect(result.data.sessionId).toBe(500);
      // number 类型属性应转为数字
      expect(result.data.gameState.attributes.勇气).toBe(50);
      // enum 类型保持字符串
      expect(result.data.gameState.attributes.阵营).toBe('中立');
      // boolean 类型应转为布尔值
      expect(result.data.gameState.attributes.已加入).toBe(false);
      // NPC 好感度应初始化为 0
      expect(result.data.gameState.npcRelations.神秘旅人).toBe(0);
      expect(result.data.gameState.npcRelations.村长女儿).toBe(0);
      // 应创建初始存档
      expect(prismaService.save.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 1,
            sessionId: 500,
            isAuto: true,
            description: '初始存档',
          }),
        }),
      );
      // 应增加剧本游玩次数
      expect(prismaService.script.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: { playCount: { increment: 1 } },
      });
    });

    it('剧本不存在应抛出 NotFoundException', async () => {
      prismaService.script.findUnique.mockResolvedValue(null);

      await expect(service.startGame(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('剧本未发布应抛出 ForbiddenException', async () => {
      prismaService.script.findUnique.mockResolvedValue({
        ...publishedScript,
        status: 'draft',
      });

      await expect(service.startGame(1, 100)).rejects.toThrow(ForbiddenException);
    });

    it('defaultVal 为 null 时不应初始化对应属性', async () => {
      prismaService.script.findUnique.mockResolvedValue({
        ...publishedScript,
        attributes: [
          { id: 1, scriptId: 100, name: '可选属性', type: 'number', defaultVal: null },
        ],
      });
      prismaService.gameSession.create.mockResolvedValue({ id: 500, userId: 1, scriptId: 100 });
      prismaService.save.create.mockResolvedValue({});
      prismaService.script.update.mockResolvedValue({});

      const result = await service.startGame(1, 100);

      // defaultVal 为 null 的属性不应出现在初始状态中
      expect(result.data.gameState.attributes.可选属性).toBeUndefined();
    });
  });

  /* ===================== buildPrompt ===================== */

  describe('buildPrompt', () => {
    it('应正确构建包含世界观、属性、NPC 的系统 prompt', () => {
      const gameState: GameState = {
        currentNodeId: null,
        attributes: { 勇气: 50, 智慧: 30 },
        npcRelations: { 神秘旅人: 10 },
        inventory: ['剑'],
        history: [],
      };
      const npcList = [
        { name: '神秘旅人', personality: '沉稳内敛' },
        { name: '村长女儿', personality: '活泼开朗' },
      ];

      const prompt = service.buildPrompt('一个奇幻世界', gameState, npcList);

      // 应包含世界观
      expect(prompt).toContain('一个奇幻世界');
      // 应包含属性
      expect(prompt).toContain('勇气: 50');
      expect(prompt).toContain('智慧: 30');
      // 应包含 NPC 及好感度
      expect(prompt).toContain('神秘旅人');
      expect(prompt).toContain('沉稳内敛');
      expect(prompt).toContain('好感度: 10');
      // 未设置好感度的 NPC 应显示为 0
      expect(prompt).toContain('村长女儿');
      expect(prompt).toContain('好感度: 0');
      // 应包含 JSON 格式说明
      expect(prompt).toContain('narrative');
      expect(prompt).toContain('choices');
      expect(prompt).toContain('attribute_changes');
    });

    it('无 NPC 时 prompt 应省略 NPC 列表部分', () => {
      const gameState: GameState = {
        currentNodeId: null,
        attributes: {},
        npcRelations: {},
        inventory: [],
        history: [],
      };

      const prompt = service.buildPrompt('世界观', gameState, []);

      expect(prompt).toContain('世界观');
      expect(prompt).not.toContain('NPC列表');
    });

    it('空世界观时不应包含世界观部分', () => {
      const gameState: GameState = {
        currentNodeId: null,
        attributes: { 勇气: 50 },
        npcRelations: {},
        inventory: [],
        history: [],
      };

      const prompt = service.buildPrompt('', gameState, []);

      expect(prompt).not.toContain('【世界观规则】');
      expect(prompt).toContain('勇气: 50');
    });
  });

  /* ===================== checkBalance ===================== */

  describe('checkBalance', () => {
    it('余额充足时不应抛出异常', async () => {
      prismaService.userBalance.findUnique.mockResolvedValue({
        userId: 1,
        permanentBalance: 1000,
        tempBalance: 500,
      });

      // estimatedTokens=100 -> cost = ceil(100 * 0.1) = 10，余额 1500 足够
      await expect(service.checkBalance(1, 100)).resolves.toBeUndefined();
    });

    it('余额不足时应抛出 PAYMENT_REQUIRED', async () => {
      prismaService.userBalance.findUnique.mockResolvedValue({
        userId: 1,
        permanentBalance: 1,
        tempBalance: 0,
      });

      // estimatedTokens=1000 -> cost = 100，余额 1 不足
      try {
        await service.checkBalance(1, 1000);
        fail('应抛出异常');
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect((err as HttpException).getStatus()).toBe(HttpStatus.PAYMENT_REQUIRED);
      }
    });

    it('余额记录不存在时应抛出 PAYMENT_REQUIRED', async () => {
      prismaService.userBalance.findUnique.mockResolvedValue(null);

      try {
        await service.checkBalance(1, 100);
        fail('应抛出异常');
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect((err as HttpException).getStatus()).toBe(HttpStatus.PAYMENT_REQUIRED);
      }
    });
  });

  /* ===================== deductTokens ===================== */

  describe('deductTokens', () => {
    const sessionId = 500;
    const userId = 1;

    beforeEach(() => {
      // 默认余额：永久 1000，临时 200
      prismaService.userBalance.findUnique.mockResolvedValue({
        userId,
        permanentBalance: 1000,
        tempBalance: 200,
      });
      prismaService.userBalance.update.mockResolvedValue({});
      prismaService.transactionLog.create.mockResolvedValue({});
      // 会话查询：作者为其他用户（触发创作者分成）
      prismaService.gameSession.findUnique.mockResolvedValue({
        id: sessionId,
        script: { authorId: 2 },
      });
      prismaService.gameSession.update.mockResolvedValue({});
    });

    it('应优先扣除临时余额', async () => {
      // input=100, output=100 -> totalTokens=200 -> cost = ceil(200*0.1)=20
      await service.deductTokens(userId, sessionId, 100, 100);

      // 临时余额 200 >= 20，应全部从临时余额扣除
      expect(prismaService.userBalance.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          tempBalance: 180, // 200 - 20
          permanentBalance: 1000, // 不变
        },
      });
    });

    it('临时余额不足时应同时扣除永久余额', async () => {
      // 临时余额设为 5
      prismaService.userBalance.findUnique.mockResolvedValueOnce({
        userId,
        permanentBalance: 1000,
        tempBalance: 5,
      });
      // cost = 20，临时扣 5，永久扣 15
      await service.deductTokens(userId, sessionId, 100, 100);

      expect(prismaService.userBalance.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          tempBalance: 0,
          permanentBalance: 985, // 1000 - 15
        },
      });
    });

    it('应记录交易日志', async () => {
      await service.deductTokens(userId, sessionId, 100, 100);

      expect(prismaService.transactionLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          type: 'spend',
          currency: 'uu',
          relatedType: 'ai_call',
          relatedId: sessionId,
        }),
      });
    });

    it('应更新会话的 token 和费用统计', async () => {
      await service.deductTokens(userId, sessionId, 100, 100);

      expect(prismaService.gameSession.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: {
          totalTokens: { increment: 200 },
          totalCost: { increment: 20 },
        },
      });
    });

    it('创作者分成应发放给剧本作者（非本人游玩时）', async () => {
      // cost = 20，创作者分成 = ceil(20 * 0.1) = 2
      // 作者余额记录已存在
      prismaService.userBalance.findUnique
        .mockResolvedValueOnce({ userId, permanentBalance: 1000, tempBalance: 200 }) // 用户余额
        .mockResolvedValueOnce({ userId: 2, permanentBalance: 50, tempBalance: 0 }); // 作者余额

      await service.deductTokens(userId, sessionId, 100, 100);

      // 应更新作者余额
      expect(prismaService.userBalance.update).toHaveBeenCalledWith({
        where: { userId: 2 },
        data: {
          permanentBalance: { increment: 2 },
          totalIncome: { increment: 2 },
        },
      });
      // 应记录创作者收入日志
      expect(prismaService.transactionLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 2,
          type: 'income',
          relatedType: 'creator_income',
        }),
      });
    });

    it('余额记录不存在时应直接返回不扣费', async () => {
      prismaService.userBalance.findUnique.mockResolvedValue(null);

      await service.deductTokens(userId, sessionId, 100, 100);

      // 不应执行更新
      expect(prismaService.userBalance.update).not.toHaveBeenCalled();
    });

    it('应通过 RealtimeService 通知余额变更', async () => {
      // 最终查询余额用于通知
      prismaService.userBalance.findUnique
        .mockResolvedValueOnce({ userId, permanentBalance: 1000, tempBalance: 200 })
        .mockResolvedValueOnce({ userId: 2, permanentBalance: 50, tempBalance: 0 })
        .mockResolvedValueOnce({ userId, permanentBalance: 1000, tempBalance: 180 });

      await service.deductTokens(userId, sessionId, 100, 100);

      expect(realtimeService.sendBalanceUpdate).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          cost: 20,
          totalTokens: 200,
        }),
      );
    });
  });
});
