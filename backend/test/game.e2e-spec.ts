import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Readable } from 'stream';
import { JwtService } from '@nestjs/jwt';
import { GameModule } from '../src/game/game.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { AuthModule } from '../src/auth/auth.module';
import { RealtimeModule } from '../src/realtime/realtime.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AiService } from '../src/game/ai.service';
import { RealtimeService } from '../src/realtime/realtime.service';
import { createMockPrismaService, createToken } from './helpers/mock-prisma';

/**
 * 游戏模块 E2E 测试
 *
 * 覆盖场景：
 * - 开始游戏（成功 / 剧本不存在 / 剧本未发布）
 * - 获取游戏状态（成功 / 无权访问）
 * - 存档列表 / 手动存档
 * - SSE 聊天（mock AI 服务返回流式数据）
 *
 * 通过 overrideProvider 替换 PrismaService、AiService、RealtimeService，
 * 避免依赖真实数据库与外部 AI API。
 */
describe('GameController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prismaMock: ReturnType<typeof createMockPrismaService>;
  let aiServiceMock: { streamGenerate: jest.Mock };

  const user = {
    id: 1,
    phone: '13800000001',
    nickname: '玩家',
    role: 'user',
    status: 'active',
    inviteCode: 'PLAYER01',
    passwordHash: 'hash',
  };

  // 已发布的剧本
  const publishedScript = {
    id: 100,
    authorId: 2,
    title: '冒险剧本',
    desc: '',
    category: 'adventure',
    worldSetting: '一个充满未知的世界',
    styleId: null,
    status: 'published',
    npcs: [
      { id: 1, scriptId: 100, name: '神秘旅人', personality: '沉稳内敛', sortOrder: 0 },
    ],
    attributes: [
      { id: 1, scriptId: 100, name: '勇气', type: 'number', defaultVal: '50', minVal: 0, maxVal: 100 },
    ],
  };

  // 未发布的剧本
  const draftScript = { ...publishedScript, id: 101, status: 'draft' };

  // 游戏会话
  const session = {
    id: 500,
    userId: 1,
    scriptId: 100,
    gameState: JSON.stringify({
      currentNodeId: null,
      attributes: { 勇气: 50 },
      npcRelations: { 神秘旅人: 0 },
      inventory: [],
      history: [],
    }),
    totalTokens: 0,
    totalCost: 0,
    script: publishedScript,
  };

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  beforeEach(async () => {
    prismaMock = createMockPrismaService();

    // Mock AiService：返回一个可读流，模拟 SSE 数据
    aiServiceMock = {
      streamGenerate: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, RealtimeModule, GameModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(AiService)
      .useValue(aiServiceMock)
      .overrideProvider(RealtimeService)
      .useValue({
        sendBalanceUpdate: jest.fn(),
        notifyUser: jest.fn(),
        broadcast: jest.fn(),
        notifyGameSession: jest.fn(),
        sendNotification: jest.fn(),
        broadcastAnnouncement: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  const token = () => createToken(jwtService, user.id, 'user');

  /* ===================== 开始游戏 ===================== */

  describe('POST /api/game/start', () => {
    it('开始游戏成功', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.script.findUnique.mockResolvedValue(publishedScript);
      prismaMock.gameSession.create.mockResolvedValue({
        id: 500,
        userId: 1,
        scriptId: 100,
        gameState: session.gameState,
      });
      prismaMock.save.create.mockResolvedValue({});
      prismaMock.script.update.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .post('/api/game/start')
        .set('Authorization', `Bearer ${token()}`)
        .send({ scriptId: 100 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBe(500);
      expect(res.body.data.gameState.attributes.勇气).toBe(50);
      // NPC 好感度应初始化为 0
      expect(res.body.data.gameState.npcRelations.神秘旅人).toBe(0);
    });

    it('剧本不存在应返回 404', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.script.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/api/game/start')
        .set('Authorization', `Bearer ${token()}`)
        .send({ scriptId: 999 });

      expect(res.status).toBe(404);
    });

    it('剧本未发布应返回 403', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.script.findUnique.mockResolvedValue(draftScript);

      const res = await request(app.getHttpServer())
        .post('/api/game/start')
        .set('Authorization', `Bearer ${token()}`)
        .send({ scriptId: 101 });

      expect(res.status).toBe(403);
    });

    it('未登录应返回 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/game/start')
        .send({ scriptId: 100 });

      expect(res.status).toBe(401);
    });
  });

  /* ===================== 获取游戏状态 ===================== */

  describe('GET /api/game/:sessionId', () => {
    it('获取游戏状态成功', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.gameSession.findUnique.mockResolvedValue(session);

      const res = await request(app.getHttpServer())
        .get('/api/game/500')
        .set('Authorization', `Bearer ${token()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(500);
      expect(res.body.data.gameState.attributes.勇气).toBe(50);
    });

    it('访问他人会话应返回 403', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.gameSession.findUnique.mockResolvedValue({
        ...session,
        userId: 999, // 属于其他用户
      });

      const res = await request(app.getHttpServer())
        .get('/api/game/500')
        .set('Authorization', `Bearer ${token()}`);

      expect(res.status).toBe(403);
    });

    it('会话不存在应返回 404', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.gameSession.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .get('/api/game/999')
        .set('Authorization', `Bearer ${token()}`);

      expect(res.status).toBe(404);
    });
  });

  /* ===================== 存档列表 ===================== */

  describe('GET /api/game/:sessionId/saves', () => {
    it('返回存档列表', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.gameSession.findUnique.mockResolvedValue(session);
      const saves = [
        {
          id: 1,
          userId: 1,
          sessionId: 500,
          gameState: session.gameState,
          description: '初始存档',
          isAuto: true,
          createdAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          sessionId: 500,
          gameState: session.gameState,
          description: '手动存档',
          isAuto: false,
          createdAt: new Date(),
        },
      ];
      prismaMock.save.findMany.mockResolvedValue(saves);

      const res = await request(app.getHttpServer())
        .get('/api/game/500/saves')
        .set('Authorization', `Bearer ${token()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].description).toBeDefined();
    });
  });

  /* ===================== 手动存档 ===================== */

  describe('POST /api/game/:sessionId/save', () => {
    it('手动存档成功', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.gameSession.findUnique.mockResolvedValue(session);
      prismaMock.save.create.mockResolvedValue({
        id: 10,
        description: '关键时刻',
        createdAt: new Date(),
      });

      const res = await request(app.getHttpServer())
        .post('/api/game/500/save')
        .set('Authorization', `Bearer ${token()}`)
        .send({ description: '关键时刻' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe('关键时刻');
    });
  });

  /* ===================== SSE 聊天 ===================== */

  describe('POST /api/game/:sessionId/chat (SSE)', () => {
    /**
     * 构造一个 mock 的 AI 可读流，依次推送：
     * 文本片段 -> 选项 -> 属性变化 -> done
     */
    function createMockAiStream(): Readable {
      const readable = new Readable({ objectMode: true });
      readable._read = () => {};
      // 使用 setImmediate 模拟异步推送
      setImmediate(() => {
        readable.push({
          type: 'text',
          content:
            '{"narrative": "你走向了那座古老的城堡，大门缓缓打开。", "choices": ["进入城堡", "原地观察"], "attribute_changes": {"勇气": 5}}',
        });
        readable.push({
          type: 'choices',
          data: ['进入城堡', '原地观察'],
        });
        readable.push({ type: 'attribute_change', data: { 勇气: 5 } });
        readable.push({ type: 'done' });
        readable.push(null);
      });
      return readable;
    }

    it('SSE 流式返回 AI 生成内容', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.gameSession.findUnique.mockResolvedValue(session);
      prismaMock.userBalance.findUnique.mockResolvedValue({
        userId: 1,
        permanentBalance: 1000,
        tempBalance: 0,
      });
      aiServiceMock.streamGenerate.mockResolvedValue(createMockAiStream());
      // 扣费相关 mock
      prismaMock.gameSession.update.mockResolvedValue({});
      prismaMock.transactionLog.create.mockResolvedValue({});
      prismaMock.gameSession.findUnique.mockResolvedValue(session); // deductTokens 内部再次查询

      const res = await request(app.getHttpServer())
        .post('/api/game/500/chat')
        .set('Authorization', `Bearer ${token()}`)
        .send({ action: '走向城堡' })
        .buffer(true)
        .parse((res, callback) => {
          // 自定义解析：收集所有 SSE 数据
          let data = '';
          res.on('data', (chunk) => {
            data += chunk.toString();
          });
          res.on('end', () => {
            callback(null, data);
          });
        });

      expect(res.status).toBe(201);
      // 响应应是 SSE 格式
      expect(res.body).toContain('data: ');
      expect(res.body).toContain('"type":"text"');
      expect(res.body).toContain('"type":"choices"');
      // 流应以 [DONE] 结束
      expect(res.body).toContain('[DONE]');
      // AI 服务应被调用
      expect(aiServiceMock.streamGenerate).toHaveBeenCalled();
    });

    it('余额不足时应返回 402 错误事件', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.gameSession.findUnique.mockResolvedValue(session);
      // 余额为 0，触发 PAYMENT_REQUIRED
      prismaMock.userBalance.findUnique.mockResolvedValue({
        userId: 1,
        permanentBalance: 0,
        tempBalance: 0,
      });

      const res = await request(app.getHttpServer())
        .post('/api/game/500/chat')
        .set('Authorization', `Bearer ${token()}`)
        .send({ action: '走向城堡' })
        .buffer(true)
        .parse((res, callback) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk.toString();
          });
          res.on('end', () => callback(null, data));
        });

      // 控制器将错误以 SSE error 事件返回
      expect(res.body).toContain('"type":"error"');
      expect(res.body).toContain('余额不足');
      // AI 服务不应被调用
      expect(aiServiceMock.streamGenerate).not.toHaveBeenCalled();
    });
  });
});
