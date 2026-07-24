import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AuthModule } from '../src/auth/auth.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { createMockPrismaService, createToken } from './helpers/mock-prisma';

/**
 * 认证模块 E2E 测试
 *
 * 覆盖场景：
 * - 注册：成功 / 重复注册 / 参数错误（缺少手机号和邮箱 / 密码过短）
 * - 登录：成功 / 密码错误 / 用户不存在
 * - 获取当前用户：带 token / 不带 token
 * - 登出
 *
 * 通过 overrideProvider(PrismaService) 注入内存 mock，避免连接真实数据库。
 */
describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authService: AuthService;
  let prismaMock: ReturnType<typeof createMockPrismaService>;

  // 预先生成一个 bcrypt 哈希，避免在测试中反复 hash 耗时
  const plainPassword = 'password123';
  const passwordHash = bcrypt.hashSync(plainPassword, 10);

  // 模拟已存在的用户数据
  const existingUser = {
    id: 1,
    phone: '13800000001',
    email: 'existing@test.com',
    passwordHash,
    nickname: '已存在用户',
    role: 'user',
    status: 'active',
    inviteCode: 'ABCD1234',
    balance: { permanentBalance: 100, tempBalance: 0 },
  };

  beforeAll(async () => {
    // 设置 JWT 密钥，供 JwtModule 读取
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  beforeEach(async () => {
    prismaMock = createMockPrismaService();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    // 与 main.ts 保持一致的全局校验管道
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    authService = moduleFixture.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  /* ===================== 注册接口 ===================== */

  describe('POST /api/auth/register', () => {
    it('注册成功应返回 token 和用户信息', async () => {
      // 注册时查询不存在用户
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 10,
        phone: '13800000010',
        email: null,
        passwordHash,
        nickname: '新用户',
        role: 'user',
        status: 'active',
        inviteCode: 'NEWWWWWW',
        balance: { permanentBalance: 100, tempBalance: 0 },
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          phone: '13800000010',
          password: 'password123',
          nickname: '新用户',
          verifyCode: '000000', // 开发模式跳过验证码校验
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.phone).toBe('13800000010');
      // 不应返回密码哈希
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('重复注册应失败', async () => {
      prismaMock.user.findFirst.mockResolvedValue(existingUser);

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          phone: '13800000001',
          password: 'password123',
          verifyCode: '000000',
        });

      expect(res.status).toBe(201); // 业务层返回 success:false，HTTP 仍为 201
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('已注册');
    });

    it('未提供手机号和邮箱应失败', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          password: 'password123',
          verifyCode: '000000',
        });

      // 缺少 phone/email 由 AuthService 校验返回 success:false
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(false);
    });

    it('密码过短应触发 DTO 校验错误', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          phone: '13800000020',
          password: '123', // 短于 6 位
          verifyCode: '000000',
        });

      // ValidationPipe 应返回 400
      expect(res.status).toBe(400);
    });
  });

  /* ===================== 登录接口 ===================== */

  describe('POST /api/auth/login', () => {
    it('登录成功应返回 token', async () => {
      prismaMock.user.findFirst.mockResolvedValue(existingUser);

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          phone: '13800000001',
          password: plainPassword,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.phone).toBe('13800000001');
    });

    it('密码错误应失败', async () => {
      prismaMock.user.findFirst.mockResolvedValue(existingUser);

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          phone: '13800000001',
          password: 'wrong-password',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('密码错误');
    });

    it('用户不存在应失败', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          phone: '13999999999',
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('用户不存在');
    });
  });

  /* ===================== 获取当前用户 ===================== */

  describe('GET /api/auth/me', () => {
    it('带有效 token 应返回当前用户信息', async () => {
      // JwtStrategy.validate 会调用 user.findUnique
      prismaMock.user.findUnique.mockResolvedValue(existingUser);

      const token = createToken(jwtService, existingUser.id, 'user');

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(existingUser.id);
      expect(res.body.data.phone).toBe(existingUser.phone);
    });

    it('不带 token 应返回 401 未授权', async () => {
      const res = await request(app.getHttpServer()).get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('带无效 token 应返回 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
    });
  });

  /* ===================== 登出接口 ===================== */

  describe('POST /api/auth/logout', () => {
    it('带有效 token 登出成功', async () => {
      prismaMock.user.findUnique.mockResolvedValue(existingUser);
      const token = createToken(jwtService, existingUser.id, 'user');

      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('登出成功');
    });

    it('登出后该 token 进入黑名单', async () => {
      prismaMock.user.findUnique.mockResolvedValue(existingUser);
      const token = createToken(jwtService, existingUser.id, 'user');

      // 登出
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      // 该 token 应已被加入黑名单
      expect(authService.isTokenBlacklisted(token)).toBe(true);
    });

    it('不带 token 登出应返回 401', async () => {
      const res = await request(app.getHttpServer()).post('/api/auth/logout');

      expect(res.status).toBe(401);
    });
  });
});
