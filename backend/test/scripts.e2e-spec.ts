import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { ScriptsModule } from '../src/scripts/scripts.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { createMockPrismaService, createToken } from './helpers/mock-prisma';

/**
 * 剧本模块 E2E 测试
 *
 * 覆盖场景：
 * - 获取剧本列表（分页）
 * - 获取剧本详情（存在 / 不存在）
 * - 创建剧本（需要鉴权 / 未鉴权被拒）
 * - 更新剧本（作者本人 / 非作者无权）
 * - NPC 增删改查
 * - 属性批量更新
 */
describe('ScriptsController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prismaMock: ReturnType<typeof createMockPrismaService>;

  // 模拟已登录用户（剧本作者）
  const author = {
    id: 1,
    phone: '13800000001',
    nickname: '作者',
    role: 'user',
    status: 'active',
    inviteCode: 'AUTHOR01',
    passwordHash: 'hash',
  };

  // 模拟其他用户
  const otherUser = {
    id: 2,
    phone: '13800000002',
    nickname: '其他用户',
    role: 'user',
    status: 'active',
    inviteCode: 'OTHERUSR',
    passwordHash: 'hash',
  };

  // 模拟已存在的剧本
  const existingScript = {
    id: 100,
    authorId: 1,
    title: '测试剧本',
    cover: null,
    desc: '这是一个测试剧本',
    category: 'adventure',
    worldSetting: '测试世界观',
    styleId: null,
    playCount: 0,
    favCount: 0,
    status: 'published',
    author: { id: 1, nickname: '作者', avatar: null },
    npcs: [],
    attributes: [],
    nodes: [],
    _count: { sessions: 0, favorites: 0, comments: 0 },
  };

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  beforeEach(async () => {
    prismaMock = createMockPrismaService();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ScriptsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
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

  /** 生成作者 token */
  const authorToken = () => createToken(jwtService, author.id, 'user');
  /** 生成其他用户 token */
  const otherToken = () => createToken(jwtService, otherUser.id, 'user');

  /* ===================== 剧本列表 ===================== */

  describe('GET /api/scripts', () => {
    it('应返回分页剧本列表', async () => {
      prismaMock.script.findMany.mockResolvedValue([existingScript]);
      prismaMock.script.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer()).get('/api/scripts');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.pageSize).toBe(20);
    });

    it('支持 keyword 和 category 查询参数', async () => {
      prismaMock.script.findMany.mockResolvedValue([]);
      prismaMock.script.count.mockResolvedValue(0);

      const res = await request(app.getHttpServer()).get(
        '/api/scripts?keyword=冒险&category=fantasy&page=1&pageSize=10',
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // 确认 findMany 被调用，且 where 包含关键字
      expect(prismaMock.script.findMany).toHaveBeenCalled();
      const callArg = prismaMock.script.findMany.mock.calls[0][0];
      expect(callArg.where.title).toEqual({ contains: '冒险' });
      expect(callArg.where.category).toBe('fantasy');
    });
  });

  /* ===================== 剧本详情 ===================== */

  describe('GET /api/scripts/:id', () => {
    it('剧本存在时应返回详情', async () => {
      prismaMock.script.findUnique.mockResolvedValue(existingScript);

      const res = await request(app.getHttpServer()).get('/api/scripts/100');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(100);
      expect(res.body.data.title).toBe('测试剧本');
    });

    it('剧本不存在时应返回 success:false', async () => {
      prismaMock.script.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer()).get('/api/scripts/999');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('不存在');
    });
  });

  /* ===================== 创建剧本 ===================== */

  describe('POST /api/scripts', () => {
    it('未登录创建应返回 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/scripts')
        .send({ title: '新剧本' });

      expect(res.status).toBe(401);
    });

    it('登录后创建成功', async () => {
      // JwtStrategy.validate 调用 user.findUnique
      prismaMock.user.findUnique.mockResolvedValue(author);
      prismaMock.script.create.mockResolvedValue({
        id: 200,
        authorId: 1,
        title: '新剧本',
        cover: null,
        desc: '',
        category: 'adventure',
        worldSetting: '',
        styleId: null,
        status: 'draft',
      });

      const res = await request(app.getHttpServer())
        .post('/api/scripts')
        .set('Authorization', `Bearer ${authorToken()}`)
        .send({ title: '新剧本', desc: '描述', category: 'fantasy' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('新剧本');
      expect(res.body.data.status).toBe('draft');
      // 确认 authorId 来自当前登录用户
      expect(prismaMock.script.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ authorId: 1, title: '新剧本' }),
        }),
      );
    });

    it('缺少 title 应触发校验错误', async () => {
      prismaMock.user.findUnique.mockResolvedValue(author);

      const res = await request(app.getHttpServer())
        .post('/api/scripts')
        .set('Authorization', `Bearer ${authorToken()}`)
        .send({ desc: '没有标题' });

      expect(res.status).toBe(400);
    });
  });

  /* ===================== 更新剧本 ===================== */

  describe('PUT /api/scripts/:id', () => {
    it('作者本人更新成功', async () => {
      prismaMock.user.findUnique.mockResolvedValue(author);
      prismaMock.script.findUnique.mockResolvedValue(existingScript);
      prismaMock.script.update.mockResolvedValue({
        ...existingScript,
        title: '更新后的标题',
      });

      const res = await request(app.getHttpServer())
        .put('/api/scripts/100')
        .set('Authorization', `Bearer ${authorToken()}`)
        .send({ title: '更新后的标题' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('更新后的标题');
    });

    it('非作者更新应返回无权编辑', async () => {
      prismaMock.user.findUnique.mockResolvedValue(otherUser);
      prismaMock.script.findUnique.mockResolvedValue(existingScript);

      const res = await request(app.getHttpServer())
        .put('/api/scripts/100')
        .set('Authorization', `Bearer ${otherToken()}`)
        .send({ title: '恶意修改' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('无权');
    });
  });

  /* ===================== NPC CRUD ===================== */

  describe('NPC endpoints', () => {
    beforeEach(() => {
      // 所有鉴权接口均需要 JwtStrategy 查询用户
      prismaMock.user.findUnique.mockResolvedValue(author);
    });

    it('GET /api/scripts/:id/npcs 返回 NPC 列表', async () => {
      const npcs = [
        { id: 1, scriptId: 100, name: '神秘旅人', personality: '沉稳', avatar: null, sortOrder: 0 },
      ];
      prismaMock.scriptNpc.findMany.mockResolvedValue(npcs);

      const res = await request(app.getHttpServer()).get(
        '/api/scripts/100/npcs',
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('神秘旅人');
    });

    it('POST /api/scripts/:id/npcs 创建 NPC 成功', async () => {
      prismaMock.scriptNpc.create.mockResolvedValue({
        id: 2,
        scriptId: 100,
        name: '村长女儿',
        personality: '活泼',
        avatar: null,
        sortOrder: 1,
      });

      const res = await request(app.getHttpServer())
        .post('/api/scripts/100/npcs')
        .set('Authorization', `Bearer ${authorToken()}`)
        .send({ name: '村长女儿', personality: '活泼' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('村长女儿');
    });

    it('PUT /api/scripts/:id/npcs/:npcId 更新 NPC 成功', async () => {
      prismaMock.scriptNpc.findFirst.mockResolvedValue({
        id: 1,
        scriptId: 100,
        name: '神秘旅人',
      });
      prismaMock.scriptNpc.update.mockResolvedValue({
        id: 1,
        scriptId: 100,
        name: '神秘商人',
      });

      const res = await request(app.getHttpServer())
        .put('/api/scripts/100/npcs/1')
        .set('Authorization', `Bearer ${authorToken()}`)
        .send({ name: '神秘商人' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('神秘商人');
    });

    it('DELETE /api/scripts/:id/npcs/:npcId 删除 NPC 成功', async () => {
      prismaMock.scriptNpc.findFirst.mockResolvedValue({
        id: 1,
        scriptId: 100,
      });
      prismaMock.scriptNpc.delete.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .delete('/api/scripts/100/npcs/1')
        .set('Authorization', `Bearer ${authorToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prismaMock.scriptNpc.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  /* ===================== 属性批量更新 ===================== */

  describe('PUT /api/scripts/:id/attributes (批量更新属性)', () => {
    it('登录后批量更新属性成功', async () => {
      prismaMock.user.findUnique.mockResolvedValue(author);
      prismaMock.scriptAttribute.deleteMany.mockResolvedValue({ count: 2 });
      prismaMock.scriptAttribute.create.mockImplementation((args: any) =>
        Promise.resolve({ id: Math.floor(Math.random() * 1000), ...args.data }),
      );

      const attributes = [
        { name: '勇气', type: 'number', minVal: 0, maxVal: 100, defaultVal: '50' },
        { name: '智慧', type: 'number', minVal: 0, maxVal: 100, defaultVal: '50' },
      ];

      const res = await request(app.getHttpServer())
        .put('/api/scripts/100/attributes')
        .set('Authorization', `Bearer ${authorToken()}`)
        .send({ attributes });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      // 先删除旧属性，再创建新属性
      expect(prismaMock.scriptAttribute.deleteMany).toHaveBeenCalledWith({
        where: { scriptId: 100 },
      });
      expect(prismaMock.scriptAttribute.create).toHaveBeenCalledTimes(2);
    });

    it('attributes 非数组应触发校验错误', async () => {
      prismaMock.user.findUnique.mockResolvedValue(author);

      const res = await request(app.getHttpServer())
        .put('/api/scripts/100/attributes')
        .set('Authorization', `Bearer ${authorToken()}`)
        .send({ attributes: 'not-an-array' });

      expect(res.status).toBe(400);
    });
  });
});
