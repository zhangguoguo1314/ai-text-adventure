# AI 文字冒险 - WSToolbox 部署指南

本文档介绍如何在 Android WSToolbox 应用上部署 AI 文字冒险项目。WSToolbox 支持 Nginx + PHP + MariaDB + Redis，但不支持 Node.js，因此采用 **PWA 静态前端 + PHP 后端 API + MySQL 数据库** 的适配方案。

## 环境要求

- **WSToolbox 2.0+**（Android 应用）
- **PHP 7.4+**（需启用 PDO_MySQL、cURL、openssl 扩展）
- **MariaDB 10.3+ / MySQL 5.7+**
- **Nginx**（WSToolbox 内置）
- 构建前端所需的 **Node.js 18+**（仅在电脑上构建时使用，不在手机上运行）

## 目录结构

```
ai-text-adventure/
├── php-backend/                 # PHP 后端
│   ├── public/                  # Web 根目录（Nginx 指向这里）
│   │   ├── index.php            # 入口文件/路由分发
│   │   ├── .htaccess            # URL 重写
│   │   └── api/                 # API 端点
│   │       ├── auth.php         # 认证 API
│   │       ├── scripts.php      # 剧本 API
│   │       ├── game.php         # 游戏 API
│   │       ├── user.php         # 用户 API
│   │       └── community.php    # 社区 API
│   ├── config/                  # 配置文件
│   │   ├── database.php         # 数据库配置
│   │   └── app.php              # 应用配置
│   ├── src/                     # 核心类
│   │   ├── Database.php         # PDO 封装
│   │   ├── Auth.php             # JWT 认证
│   │   ├── Router.php           # 路由器
│   │   ├── Middleware.php       # 中间件
│   │   └── Helpers.php          # 工具函数
│   ├── migrations/
│   │   └── 001_init.sql         # 数据库初始化脚本
│   ├── nginx.conf               # Nginx 配置
│   └── README.md                # 本文档
├── frontend/                    # 前端（Next.js PWA）
│   ├── public/
│   │   ├── manifest.json        # PWA manifest
│   │   ├── sw.js                # Service Worker
│   │   ├── icon-192.png         # PWA 图标
│   │   ├── icon-512.png         # PWA 图标
│   │   └── offline.html         # 离线页面
│   ├── .env.wstoolbox           # WSToolbox 环境变量
│   └── next.config.ts           # Next.js 配置（支持静态导出）
```

## 部署步骤

### 步骤 1：导入数据库

1. 打开 WSToolbox，启动 MariaDB 服务
2. 使用 phpMyAdmin 或 MySQL 命令行创建数据库：

```sql
CREATE DATABASE ai_adventure CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. 导入初始化脚本：

```bash
mysql -u root ai_adventure < php-backend/migrations/001_init.sql
```

或者在 phpMyAdmin 中：
- 选择 `ai_adventure` 数据库
- 点击「导入」
- 选择 `php-backend/migrations/001_init.sql` 文件
- 点击「执行」

导入后会自动创建所有表，并插入种子数据（管理员账号、风格模板、AI 模型、兑换码、公告、成就、官方剧本模板）。

### 步骤 2：配置数据库连接

编辑 `php-backend/config/database.php`，根据 WSToolbox 的 MariaDB 配置修改：

```php
return [
    'host' => getenv('DB_HOST') ?: 'localhost',
    'port' => (int)(getenv('DB_PORT') ?: 3306),
    'dbname' => getenv('DB_NAME') ?: 'ai_adventure',
    'user' => getenv('DB_USER') ?: 'root',
    'pass' => getenv('DB_PASS') ?: '',
    'charset' => 'utf8mb4',
];
```

WSToolbox 默认配置通常为 `localhost:3306`，用户名 `root`，密码为空。如果你的配置不同，请修改默认值。

### 步骤 3：配置应用

编辑 `php-backend/config/app.php`：

```php
return [
    // JWT 密钥（生产环境务必修改为随机长字符串）
    'jwt_secret' => 'your-random-secret-key-here',

    // AI API 配置（不配置则使用模拟模式）
    'openai_api_key' => 'sk-your-api-key',
    'openai_base_url' => 'https://api.openai.com/v1',
    'openai_model' => 'gpt-4o-mini',

    // 注册赠送 UU 币数量
    'register_bonus' => 100,
];
```

**重要**：如果不配置 `openai_api_key`，AI 聊天功能将返回模拟数据（用于测试）。

### 步骤 4：导出前端静态文件

在电脑上（需要 Node.js 18+）执行：

```bash
cd frontend

# 复制 WSToolbox 环境变量
cp .env.wstoolbox .env.local

# 安装依赖
pnpm install

# 构建静态导出
pnpm build
```

构建完成后，静态文件会输出到 `frontend/out/` 目录。

将 `out/` 目录的所有文件上传到 WSToolbox 的网站目录，例如：

```
/www/wwwroot/ai-adventure/frontend-out/
```

### 步骤 5：部署 PHP 后端

将 `php-backend/` 目录上传到 WSToolbox 的网站目录：

```
/www/wwwroot/ai-adventure/php-backend/
```

确保目录权限正确：

```bash
chmod -R 755 /www/wwwroot/ai-adventure/php-backend/
chmod -R 777 /www/wwwroot/ai-adventure/php-backend/public/
```

### 步骤 6：配置 Nginx

1. 将 `php-backend/nginx.conf` 的内容复制到 WSToolbox 的 Nginx 配置中
2. 根据实际路径调整以下配置项：

```nginx
server {
    listen 80;
    server_name localhost;

    # PHP 后端根目录
    root /www/wwwroot/ai-adventure/php-backend/public;

    # 前端静态文件目录
    # location / 中的 root 指向前端导出目录
    root /www/wwwroot/ai-adventure/frontend-out;

    # PHP-FPM socket 路径（根据 WSToolbox 实际配置调整）
    fastcgi_pass unix:/tmp/php-cgi-74.sock;
    ...
}
```

3. 重载 Nginx 配置：

```bash
nginx -s reload
```

### 步骤 7：启动服务

1. 在 WSToolbox 中确保以下服务已启动：
   - Nginx
   - PHP（PHP-FPM）
   - MariaDB

2. 访问 `http://localhost/` 验证前端页面加载正常
3. 访问 `http://localhost/api/announcements` 验证后端 API 正常（应返回 JSON 格式的公告列表）

## 默认账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin@example.com | admin123 | 管理员 |

兑换码：`WELCOME100`（100 UU币）、`VIP500`（500 UU币）、`TEST999`（999 UU币）

## API 接口说明

所有 API 返回统一格式：

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

错误时：

```json
{
  "success": false,
  "message": "错误描述"
}
```

### 主要接口列表

| 方法 | 路径 | 说明 | 需认证 |
|------|------|------|--------|
| POST | /api/auth/register | 注册 | 否 |
| POST | /api/auth/login | 登录 | 否 |
| POST | /api/auth/logout | 登出 | 是 |
| GET | /api/auth/me | 当前用户 | 是 |
| GET | /api/scripts | 剧本列表 | 否 |
| GET | /api/scripts/{id} | 剧本详情 | 否 |
| POST | /api/scripts | 创建剧本 | 是 |
| PUT | /api/scripts/{id} | 更新剧本 | 是 |
| POST | /api/scripts/{id}/publish | 发布剧本 | 是 |
| POST | /api/game/start | 开始游戏 | 是 |
| GET | /api/game/{sessionId} | 游戏状态 | 是 |
| POST | /api/game/{sessionId}/chat | AI 聊天 | 是 |
| GET | /api/game/{sessionId}/saves | 存档列表 | 是 |
| POST | /api/game/{sessionId}/save | 手动存档 | 是 |
| GET | /api/user/balance | 用户余额 | 是 |
| PUT | /api/user/profile | 更新资料 | 是 |
| POST | /api/user/recharge | 充值 | 是 |
| POST | /api/user/redeem | 兑换码 | 是 |
| GET | /api/posts | 动态列表 | 否 |
| POST | /api/posts | 发布动态 | 是 |
| POST | /api/follow/{userId} | 关注/取消关注 | 是 |
| GET | /api/announcements | 公告列表 | 否 |
| GET | /api/notifications | 通知列表 | 是 |

## 常见问题

### 1. 数据库连接失败

**现象**：API 返回 500 错误，提示「数据库连接失败」

**解决**：
- 检查 MariaDB 服务是否已启动
- 检查 `config/database.php` 中的主机、端口、用户名、密码是否正确
- 确认数据库 `ai_adventure` 已创建
- 检查 PHP PDO_MySQL 扩展是否已启用

### 2. API 返回 404

**现象**：访问 API 返回 404

**解决**：
- 检查 Nginx 配置中的 URL 重写规则是否正确
- 确认 `try_files` 指令包含 `/index.php?$query_string`
- 检查 PHP-FPM 是否正常运行

### 3. AI 聊天返回模拟数据

**现象**：游戏中的 AI 回复是固定的测试文本

**解决**：
- 在 `config/app.php` 中配置 `openai_api_key`
- 或在用户设置页面配置个人 API Key
- 如果使用第三方 API，请同时配置 `openai_base_url`

### 4. 前端页面空白

**现象**：访问首页显示空白

**解决**：
- 检查前端静态文件是否正确部署到 Nginx 配置的 `root` 目录
- 确认 `index.html` 存在
- 检查浏览器控制台是否有 JS 错误
- 确认前端构建时使用了 `.env.wstoolbox` 环境变量

### 5. PHP cURL 请求超时

**现象**：AI 聊天接口超时

**解决**：
- 检查网络连接是否能访问 AI API 地址
- 在 `php.ini` 中增加 `max_execution_time`（建议 120 秒以上）
- Nginx 配置中已设置 `fastcgi_read_timeout 120`

### 6. PWA 无法安装

**现象**：浏览器没有显示「安装到主屏幕」选项

**解决**：
- 确认通过 HTTPS 或 localhost 访问
- 检查 `manifest.json` 是否能正常访问
- 确认 Service Worker 注册成功（浏览器控制台无报错）
- 检查图标文件 `icon-192.png` 和 `icon-512.png` 是否存在

## 与 Node.js 版本的功能差异说明

由于 WSToolbox 不支持 Node.js，PHP 版本与原 NestJS 版本存在以下差异：

| 功能 | NestJS 版本 | PHP 版本 | 说明 |
|------|------------|----------|------|
| AI 聊天 | SSE 流式传输 | 轮询模式（完整返回） | PHP 不支持 SSE 长连接，改为一次性返回完整 AI 回复 |
| 实时通知 | WebSocket 推送 | 轮询拉取 | 通过定时查询 /api/notifications 获取通知 |
| 余额更新 | WebSocket 实时推送 | API 响应中返回 | 每次聊天后返回最新余额 |
| 数据库 | SQLite | MariaDB/MySQL | 数据库类型不同，表结构已适配 |
| ORM | Prisma | 原生 PDO | 使用 PDO 预处理语句，不依赖 ORM |
| 认证 | Passport JWT | 原生 JWT | 原生 PHP 实现 HS256 JWT |
| 密码加密 | bcrypt (Node.js) | bcrypt (PHP) | 使用 PHP password_hash，兼容 |
| 文件上传 | Multer | 需额外实现 | 当前版本暂不支持文件上传功能 |

### 前端适配说明

前端已做以下适配以支持 WSToolbox 部署：

1. **静态导出**：`next.config.ts` 中根据 `WSTOOLBOX` 环境变量切换 `output: 'export'` 模式
2. **API 地址**：使用相对路径 `/api`，由 Nginx 统一代理
3. **PWA 支持**：添加 manifest.json、Service Worker，支持离线访问和安装到主屏幕
4. **图片优化**：静态导出模式禁用 Next.js 图片优化（`unoptimized: true`）
5. **路由**：使用 `trailingSlash: true` 确保静态文件路由正确

### WebSocket 功能替代方案

原 NestJS 版本使用 WebSocket 实现的实时功能，在 PHP 版本中建议通过以下方式替代：

- **通知**：前端使用 `setInterval` 每 30 秒轮询 `/api/notifications`
- **余额更新**：在每次 AI 聊天响应中包含 `remainingBalance` 字段
- **在线状态**：暂不支持（PHP 无状态特性限制）

## 技术栈

- **后端**：PHP 7.4+ / PDO / MySQL / JWT / cURL
- **前端**：Next.js 14 / React 18 / TypeScript / Tailwind CSS / PWA
- **数据库**：MariaDB 10.3+ / MySQL 5.7+
- **Web 服务器**：Nginx + PHP-FPM
