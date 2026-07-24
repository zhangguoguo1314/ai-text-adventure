import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * 在 vi.hoisted 中创建 mock 实例，确保工厂函数与测试用例引用同一对象。
 * vi.hoisted 的回调在模块加载前执行，且内部可使用 vi.fn()。
 */
const mocks = vi.hoisted(() => {
  // 捕获请求拦截器 / 响应拦截器处理函数
  const requestHandlers: Function[] = [];
  const responseHandlers: { onFulfilled?: Function; onRejected?: Function }[] = [];

  // mock 的 axios 实例
  const instance = {
    interceptors: {
      request: {
        use: vi.fn((fn: Function) => {
          requestHandlers.push(fn);
          return requestHandlers.length;
        }),
      },
      response: {
        use: vi.fn((onFulfilled?: Function, onRejected?: Function) => {
          responseHandlers.push({ onFulfilled, onRejected });
          return responseHandlers.length;
        }),
      },
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  };

  return {
    instance,
    requestHandlers,
    responseHandlers,
    createFn: vi.fn(() => instance),
  };
});

/**
 * Mock axios 模块
 * - axios.create 返回上方定义的 mock 实例
 * - 拦截器注册会被捕获到 requestHandlers / responseHandlers
 */
vi.mock('axios', () => ({
  default: {
    create: mocks.createFn,
  },
}));

// 在 mock 注册之后导入 api（导入时触发 axios.create 与拦截器注册）
import api from '../api';

/**
 * API 工具测试
 *
 * 覆盖：
 * - 请求拦截器：自动注入 Authorization 头（有/无 token）
 * - 响应拦截器成功分支：解包返回 res.data
 * - 响应拦截器错误分支：401 清除 token 并跳转登录页
 */
describe('api (axios 实例)', () => {
  beforeEach(() => {
    // 每个用例前重置 localStorage
    window.localStorage.clear();
    // 重置 location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应通过 axios.create 创建实例', () => {
    expect(mocks.createFn).toHaveBeenCalledTimes(1);
  });

  it('请求拦截器：localStorage 有 token 时应注入 Authorization 头', () => {
    // 导入 api 时已注册请求拦截器
    expect(mocks.requestHandlers.length).toBeGreaterThanOrEqual(1);
    const requestInterceptor = mocks.requestHandlers[0];

    window.localStorage.setItem('token', 'my-test-token');
    const config = { headers: {} as any };
    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBe('Bearer my-test-token');
  });

  it('请求拦截器：无 token 时不应注入 Authorization 头', () => {
    const requestInterceptor = mocks.requestHandlers[0];
    const config = { headers: {} as any };
    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('响应拦截器成功分支：应返回 res.data 而非整个 response', () => {
    expect(mocks.responseHandlers.length).toBeGreaterThanOrEqual(1);
    const onFulfilled = mocks.responseHandlers[0].onFulfilled;
    expect(onFulfilled).toBeDefined();

    const response = {
      data: { success: true, data: { id: 1 } },
      status: 200,
    };
    const result = (onFulfilled as Function)(response);

    // 应直接返回 data 部分
    expect(result).toEqual({ success: true, data: { id: 1 } });
    expect(result).not.toHaveProperty('status');
  });

  it('响应拦截器错误分支：401 应清除 token 并跳转登录页', async () => {
    const onRejected = mocks.responseHandlers[0].onRejected;
    expect(onRejected).toBeDefined();

    window.localStorage.setItem('token', 'expired-token');

    const error = {
      response: { status: 401 },
    };

    // onRejected 应 reject
    await expect((onRejected as Function)(error)).rejects.toEqual(error);

    // token 应被清除
    expect(window.localStorage.getItem('token')).toBeNull();
    // 应跳转到登录页
    expect(window.location.href).toBe('/login');
  });

  it('响应拦截器错误分支：非 401 错误应直接 reject 且不清除 token', async () => {
    const onRejected = mocks.responseHandlers[0].onRejected;
    window.localStorage.setItem('token', 'keep-token');

    const error = {
      response: { status: 500, data: { message: '服务器错误' } },
    };

    await expect((onRejected as Function)(error)).rejects.toEqual(error);
    // token 应保留
    expect(window.localStorage.getItem('token')).toBe('keep-token');
    // 不应跳转
    expect(window.location.href).not.toBe('/login');
  });

  it('响应拦截器错误分支：无 response 字段（网络错误）应直接 reject', async () => {
    const onRejected = mocks.responseHandlers[0].onRejected;
    const error = new Error('Network Error');

    await expect((onRejected as Function)(error)).rejects.toEqual(error);
  });

  it('api 实例应暴露 get/post/put/delete/patch 方法', () => {
    // 验证导出的 api 就是 mock 实例
    expect(api).toBe(mocks.instance);
    expect(api.get).toBeDefined();
    expect(api.post).toBeDefined();
    expect(api.put).toBeDefined();
    expect(api.delete).toBeDefined();
    expect(api.patch).toBeDefined();
  });
});
