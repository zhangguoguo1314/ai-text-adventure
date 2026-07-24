/**
 * Jest 配置（单元测试）
 *
 * - rootDir 设为 src，仅运行 *.spec.ts 单元测试
 * - 使用 ts-jest 转换 TypeScript
 * - E2E 测试使用 test/jest-e2e.json 独立配置
 */
module.exports = {
  // 支持的模块文件扩展名
  moduleFileExtensions: ['js', 'json', 'ts'],

  // 测试根目录：src（仅包含单元测试 *.spec.ts）
  rootDir: 'src',

  // 匹配 *.spec.ts 文件作为单元测试
  testRegex: '.*\\.spec\\.ts$',

  // 使用 ts-jest 转换 TypeScript
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // 覆盖率收集范围
  collectCoverageFrom: ['**/*.(t|j)s'],

  // 覆盖率报告输出目录
  coverageDirectory: '../coverage',

  // 测试环境：Node.js
  testEnvironment: 'node',
};
