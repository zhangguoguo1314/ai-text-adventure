/**
 * Vitest 全局初始化
 *
 * 注册 @testing-library/jest-dom 提供的自定义 DOM 断言匹配器，
 * 例如 toBeInTheDocument、toBeDisabled、toHaveTextContent 等。
 */
import '@testing-library/jest-dom/vitest';

// 模拟 window.matchMedia（部分组件或库会调用，jsdom 默认未实现）
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// 模拟 IntersectionObserver（部分 UI 组件依赖）
if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
  class IntersectionObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  (window as any).IntersectionObserver = IntersectionObserverMock;
}
