/**
 * E2E 测试通用 Mock 工具
 *
 * 提供 PrismaService 的内存 mock 实现，避免测试依赖真实数据库。
 * 同时提供 JWT token 生成辅助方法，便于鉴权接口测试。
 */
import { JwtService } from '@nestjs/jwt';

/**
 * 创建一个深度可控的 PrismaService mock
 * 每个 model 的每个方法都是 jest.fn，可在测试中按需配置返回值
 */
export function createMockPrismaService() {
  // 内部数据存储，便于在测试中模拟"创建后查询到"的场景
  const store = {
    users: new Map<number, any>(),
    balances: new Map<number, any>(),
    preferences: new Map<number, any>(),
    scripts: new Map<number, any>(),
    npcs: new Map<number, any>(),
    attributes: new Map<number, any>(),
    nodes: new Map<number, any>(),
    sessions: new Map<number, any>(),
    saves: new Map<number, any>(),
    transactions: new Map<number, any>(),
  };

  const mock = {
    // 内部存储，测试可访问以设置数据
    __store: store,

    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    userBalance: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    userPreference: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    script: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    scriptNpc: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    scriptAttribute: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    scriptNode: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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
    transactionLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  return mock;
}

/**
 * 使用 JwtService 为指定用户签发一个有效 JWT
 */
export function createToken(
  jwtService: JwtService,
  userId: number,
  role = 'user',
): string {
  return jwtService.sign({ sub: userId, role });
}
