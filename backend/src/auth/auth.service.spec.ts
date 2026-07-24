import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * AuthService 单元测试
 *
 * 覆盖方法：
 * - register：成功 / 重复注册 / 缺少手机号和邮箱 / 验证码错误
 * - login：成功 / 密码错误 / 用户不存在 / 账号被禁用
 * - generateToken / JWT 生成与验证
 * - getMe / logout / isTokenBlacklisted
 *
 * PrismaService 和 JwtService 均为 mock，确保测试隔离。
 */
describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<Pick<PrismaService, 'user' | 'userBalance' | 'userPreference'>>;
  let jwtService: jest.Mocked<JwtService>;

  const plainPassword = 'password123';
  const passwordHash = bcrypt.hashSync(plainPassword, 10);

  // 通用 mock 用户
  const mockUser = {
    id: 1,
    phone: '13800000001',
    email: 'test@test.com',
    passwordHash,
    nickname: '测试用户',
    role: 'user',
    status: 'active',
    inviteCode: 'ABCD1234',
    balance: { permanentBalance: 100, tempBalance: 0 },
  };

  beforeEach(async () => {
    // 创建 PrismaService mock
    prismaService = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      } as any,
      userBalance: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      } as any,
      userPreference: {
        findUnique: jest.fn(),
        create: jest.fn(),
      } as any,
    } as any;

    // 创建 JwtService mock
    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
      decode: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /* ===================== register 方法 ===================== */

  describe('register', () => {
    it('注册成功应返回 token 和用户信息', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.register({
        phone: '13800000001',
        password: plainPassword,
        verifyCode: '000000', // 开发模式跳过校验
      });

      expect(result.success).toBe(true);
      expect(result.data.token).toBe('mock-jwt-token');
      expect(result.data.user.phone).toBe('13800000001');
      // 不应返回密码哈希
      expect(result.data.user.passwordHash).toBeUndefined();
      // 应使用 bcrypt 哈希密码
      expect(prismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '13800000001',
            passwordHash: expect.any(String),
          }),
        }),
      );
      // 应签发 token
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 1, role: 'user' });
    });

    it('未提供手机号和邮箱应失败', async () => {
      const result = await service.register({
        password: plainPassword,
      } as any);

      expect(result.success).toBe(false);
      expect(result.message).toContain('手机号或邮箱');
      // 不应查询数据库
      expect(prismaService.user.findFirst).not.toHaveBeenCalled();
    });

    it('重复注册应失败', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.register({
        phone: '13800000001',
        password: plainPassword,
        verifyCode: '000000',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('已注册');
      // 不应执行创建
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('验证码错误应失败', async () => {
      const result = await service.register({
        phone: '13800000001',
        password: plainPassword,
        verifyCode: 'wrong-code',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('验证码错误');
    });

    it('使用邮箱注册应正常工作', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue({
        ...mockUser,
        phone: null,
        email: 'email@test.com',
      });
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.register({
        email: 'email@test.com',
        password: plainPassword,
      });

      expect(result.success).toBe(true);
      // findFirst 查询条件应包含 email
      expect(prismaService.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ email: 'email@test.com' }],
          }),
        }),
      );
    });
  });

  /* ===================== login 方法 ===================== */

  describe('login', () => {
    it('登录成功应返回 token', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login({
        phone: '13800000001',
        password: plainPassword,
      });

      expect(result.success).toBe(true);
      expect(result.data.token).toBe('mock-jwt-token');
      expect(result.data.user.id).toBe(1);
    });

    it('用户不存在应失败', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.login({
        phone: '13999999999',
        password: plainPassword,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('用户不存在');
    });

    it('密码错误应失败', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.login({
        phone: '13800000001',
        password: 'wrong-password',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('密码错误');
    });

    it('账号被禁用应失败', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        status: 'banned',
      });

      const result = await service.login({
        phone: '13800000001',
        password: plainPassword,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('禁用');
    });

    it('未提供手机号和邮箱应失败', async () => {
      const result = await service.login({
        password: plainPassword,
      } as any);

      expect(result.success).toBe(false);
      expect(result.message).toContain('手机号或邮箱');
    });
  });

  /* ===================== JWT 生成和验证 ===================== */

  describe('generateToken', () => {
    it('应使用正确的 payload 签发 token', () => {
      jwtService.sign.mockReturnValue('generated-token');

      const token = service.generateToken(42, 'admin');

      expect(token).toBe('generated-token');
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 42, role: 'admin' });
    });
  });

  describe('getMe', () => {
    it('用户存在时返回用户信息', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMe(1);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
      expect(result.data.passwordHash).toBeUndefined();
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { balance: true, preferences: true },
      });
    });

    it('用户不存在时返回失败', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.getMe(999);

      expect(result.success).toBe(false);
      expect(result.message).toContain('用户不存在');
    });
  });

  /* ===================== logout & token 黑名单 ===================== */

  describe('logout & isTokenBlacklisted', () => {
    it('logout 应将 token 加入黑名单', async () => {
      // jwtService.decode 返回带 exp 的 payload
      jwtService.decode.mockReturnValue({ sub: 1, exp: 9999999999 });

      const result = await service.logout('some-token');

      expect(result.success).toBe(true);
      expect(result.message).toContain('登出成功');
      // token 应在黑名单中
      expect(service.isTokenBlacklisted('some-token')).toBe(true);
    });

    it('未登出的 token 不在黑名单中', () => {
      expect(service.isTokenBlacklisted('unknown-token')).toBe(false);
    });

    it('过期的黑名单 token 应被自动清理', () => {
      // 设置一个已过期的 token 到黑名单
      jwtService.decode.mockReturnValue({ sub: 1, exp: 1 }); // 早已过期
      service.logout('expired-token');

      // 已过期，应返回 false 并清理
      expect(service.isTokenBlacklisted('expired-token')).toBe(false);
    });
  });
});
