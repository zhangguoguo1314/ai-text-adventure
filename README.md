# AI 文字冒险游戏平台

基于 [开发文档](./ai-text-adventure-platform-dev-doc/ai-text-adventure-platform-dev-doc.html) 构建的 AI 驱动文字冒险游戏平台。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS |
| 状态管理 | Zustand + TanStack Query |
| 后端 | NestJS 10 + TypeScript |
| ORM | Prisma 5 |
| 数据库 | SQLite (开发) / PostgreSQL (生产) |
| 认证 | JWT + Passport |
| 缓存 | 内存 Map (开发) / Redis (生产) |

## 项目结构

```
ai-text-adventure/
├── frontend/          # Next.js 前端 (端口 3000)
│   └── src/
│       ├── app/       # 页面路由
│       │   ├── (auth)/login, register
│       │   └── (main)/create, editor, play, game, plaza, profile, my-works
│       ├── components/ # 组件
│       │   ├── layout/Sidebar.tsx
│       │   ├── home/Banner, SearchBar, RankTabs, ScriptCard
│       │   ├── auth/AuthModal.tsx
│       │   ├── common/Modal, Loading
│       │   └── settings/ModelExchangeModal.tsx
│       ├── store/     # Zustand (authStore, appStore)
│       ├── lib/       # Axios 配置 + 工具函数
│       ├── types/     # TypeScript 类型
│       └── providers/ # TanStack Query Provider
├── backend/           # NestJS 后端 (端口 3001)
│   └── src/
│       ├── auth/      # 认证模块 (注册/登录/登出/JWT策略)
│       ├── user/      # 用户模块 (余额/资料/自定义API)
│       ├── scripts/   # 剧本模块 (CRUD/发布/搜索)
│       ├── style-templates/ # 文风模板
│       └── prisma/    # Prisma 服务
└── dev-doc/           # 开发文档
```

## 快速开始

```bash
# 1. 安装依赖
cd frontend && pnpm install
cd ../backend && pnpm install

# 2. 初始化数据库
cd backend
npx prisma migrate dev
npx prisma db seed

# 3. 启动后端 (端口 3001)
cd backend
pnpm run start:dev

# 4. 启动前端 (端口 3000，新终端)
cd frontend
pnpm run dev
```

## API 接口

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/auth/register | 用户注册 | 否 |
| POST | /api/auth/login | 用户登录 | 否 |
| POST | /api/auth/logout | 用户登出 | 是 |
| GET | /api/auth/me | 当前用户信息 | 是 |
| GET | /api/user/balance | 获取余额 | 是 |
| PUT | /api/user/profile | 更新资料 | 是 |
| POST/GET | /api/user/custom-ai | 自定义API配置 | 是 |
| GET | /api/scripts | 剧本列表(分页/搜索/排序) | 否 |
| GET | /api/scripts/:id | 剧本详情 | 否 |
| POST | /api/scripts | 创建剧本 | 是 |
| PUT | /api/scripts/:id | 更新剧本 | 是 |
| POST | /api/scripts/:id/publish | 发布剧本 | 是 |
| GET | /api/style-templates | 文风模板列表 | 否 |

## 数据库表 (19 张)

users, user_balances, user_preferences, scripts, style_templates, script_npcs, script_attributes, script_nodes, game_sessions, saves, transaction_logs, payment_orders, user_api_configs, redemption_codes, ai_models, posts, comments, follows, favorites, notifications, announcements, invitations

## 开发计划

- **阶段 1 (当前)**: 基础架构 + 用户认证 + 首页 + 侧边栏 ✅
- **阶段 2**: 剧本创作系统 (三步向导 + 可视化编辑器)
- **阶段 3**: AI 游玩引擎 (SSE流式 + 选项 + 属性 + 存档)
- **阶段 4**: 货币 + 支付
- **阶段 5**: 社区 + 设置
- **阶段 6**: 自定义 API + 模型弹窗
- **阶段 7**: 优化 + 上线
