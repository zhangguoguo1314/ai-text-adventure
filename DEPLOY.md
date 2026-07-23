# AI Text Adventure 部署文档

## 环境要求

| 依赖 | 最低版本 | 说明 |
|------|----------|------|
| Docker | 20.10+ | 容器运行环境 |
| Docker Compose | V2.0+ | 编排工具（V2 语法：`docker compose`） |
| Git | 2.x+ | 代码拉取（可选） |
| curl | 任意 | 健康检查脚本依赖 |

> Docker Compose V2 已随 Docker Desktop 内置，Linux 系统可能需要单独安装插件。

## 快速开始

只需 3 步即可完成部署：

```bash
# 1. 克隆项目
git clone <your-repo-url> ai-text-adventure
cd ai-text-adventure

# 2. 给脚本执行权限
chmod +x scripts/*.sh

# 3. 一键初始化部署
bash scripts/init.sh
```

部署完成后访问：

- **前端页面**: http://localhost
- **后端 API**: http://localhost:3001/api
- **API 文档**: http://localhost:3001/api-docs
- **Nginx 代理**: http://localhost:80

## 环境变量配置

复制 `.env.example` 为 `.env` 并根据需要修改：

```bash
cp .env.example .env
```

### 后端配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DATABASE_URL` | `file:/app/data/dev.db` | SQLite 数据库路径（Docker 内路径） |
| `JWT_SECRET` | `change-me-in-production` | JWT 签名密钥，**生产环境必须修改** |
| `JWT_EXPIRES_IN` | `7d` | Token 过期时间 |
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | `3001` | 后端监听端口 |

### 前端配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NEXT_PUBLIC_API_URL` | `http://backend:3001/api` | API 地址（Docker 内部通信使用服务名） |

> **注意**: `NEXT_PUBLIC_API_URL` 在构建时会被嵌入前端代码。如果需要修改外部访问地址，需重新构建前端镜像。

## 架构说明

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (:80/:443) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │                         │
    /api/* → 后端                 /* → 前端
              │                         │
              ▼                         ▼
    ┌─────────────────┐     ┌─────────────────┐
    │   NestJS Backend │     │  Next.js Frontend│
    │     (:3001)      │     │     (:3000)      │
    │                  │     │                  │
    │  SQLite (Volume) │     │  Standalone Mode │
    └─────────────────┘     └─────────────────┘
```

### SSE（Server-Sent Events）支持

游戏聊天接口使用 SSE 流式返回 AI 生成内容。Nginx 已配置：
- `proxy_buffering off` - 禁用代理缓冲
- `proxy_cache off` - 禁用缓存
- `proxy_read_timeout 300s` - 长连接超时 5 分钟
- `gzip off` - 禁用压缩（避免 SSE 数据被压缩导致延迟）

## SSL 证书配置

### 使用 Let's Encrypt（推荐）

```bash
# 1. 安装 certbot
apt install certbot

# 2. 获取证书
certbot certonly --standalone -d your-domain.com

# 3. 复制证书到项目目录
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/

# 4. 修改 nginx/nginx.conf，取消注释 HTTPS server 块
# 5. 重启 Nginx
docker compose restart nginx
```

### 使用自签名证书（仅开发测试）

```bash
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem
```

## 数据备份与恢复

### 自动备份

```bash
# 执行备份脚本（建议设置 cron 定时任务）
bash scripts/backup.sh

# 设置每天凌晨 3 点自动备份
crontab -e
# 添加以下行：
0 3 * * * cd /path/to/ai-text-adventure && bash scripts/backup.sh >> /var/log/backup.log 2>&1
```

### 手动备份

```bash
# 方法 1：使用脚本
bash scripts/backup.sh

# 方法 2：直接从 Docker 卷复制
docker cp backend:/app/data/dev.db ./backup-$(date +%Y%m%d).db
```

### 数据恢复

```bash
# 1. 停止后端服务
docker compose stop backend

# 2. 恢复数据库文件
docker cp ./backup-20260101.db backend:/app/data/dev.db

# 3. 重启服务
docker compose start backend
```

## 常用运维命令

```bash
# 查看服务状态
docker compose ps

# 查看实时日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx

# 重启单个服务
docker compose restart backend

# 停止所有服务
docker compose down

# 停止并清除数据卷（危险操作！）
docker compose down -v

# 进入容器 Shell
docker compose exec backend sh
docker compose exec frontend sh

# 查看后端容器中的数据库
docker compose exec backend sqlite3 /app/data/dev.db ".tables"

# 手动运行数据库迁移
docker compose exec backend npx prisma migrate deploy

# 重新构建单个服务
docker compose build backend
docker compose up -d backend
```

## 常见问题排查

### 1. 后端服务启动失败

```bash
# 查看后端日志
docker compose logs backend

# 常见原因：
# - 数据库文件权限问题 → 检查 backend_data 卷权限
# - 端口被占用 → lsof -i :3001
# - 环境变量错误 → 检查 .env 文件
```

### 2. 前端无法连接后端

```bash
# 检查网络连通性
docker compose exec frontend wget -qO- http://backend:3001/api/health

# 常见原因：
# - Nginx 配置错误 → docker compose logs nginx
# - NEXT_PUBLIC_API_URL 未正确设置（需重新 build）
# - 后端未启动 → docker compose ps backend
```

### 3. SSE 游戏聊天无响应

```bash
# 测试 SSE 接口
curl -N http://localhost/api/game/1/chat -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"action": "测试"}'

# 常见原因：
# - Nginx 缓冲未关闭 → 检查 nginx.conf 中的 SSE location 配置
# - 超时设置过短 → 增加 proxy_read_timeout
```

### 4. 数据库迁移失败

```bash
# 查看迁移状态
docker compose exec backend npx prisma migrate status

# 强制重置（仅开发环境，会丢失数据！）
docker compose exec backend npx prisma migrate reset
```

### 5. 健康检查失败导致容器重启

```bash
# 查看容器重启记录
docker compose ps -a

# 临时禁用健康检查，排查问题
# 编辑 docker-compose.yml，添加 healthcheck: disable
docker compose up -d
```

### 6. 磁盘空间不足

```bash
# 清理无用镜像和构建缓存
docker system prune -a

# 清理未使用的卷
docker volume ls
docker volume rm <unused-volume>
```

## 生产环境建议

### 安全

1. **修改默认密钥**: 务必修改 `.env` 中的 `JWT_SECRET` 为高强度随机字符串
2. **启用 HTTPS**: 使用 Let's Encrypt 或云服务商证书
3. **限制端口暴露**: 生产环境可移除 docker-compose.yml 中 frontend/backend 的直接端口映射，仅通过 Nginx 暴露 80/443
4. **定期更新**: 保持 Docker 和基础镜像更新，修复安全漏洞

### 性能

1. **资源限制**: 在 docker-compose.yml 中添加 `deploy.resources` 限制内存和 CPU
2. **日志轮转**: 配置 Docker 日志驱动，避免日志文件过大
3. **CDN 加速**: 静态资源建议通过 CDN 分发
4. **SQLite 优化**: 对于高并发场景，可考虑切换到 PostgreSQL

### 监控

1. **健康检查**: Docker 内置健康检查已配置（每 30 秒）
2. **日志收集**: 接入 ELK 或 Loki 等日志系统
3. **告警**: 配置容器异常退出告警

### 日志轮转配置示例

在 `/etc/docker/daemon.json` 中添加：

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```
