# ============================================
# Stage 1: 构建阶段 (builder)
# ============================================
FROM node:20-alpine AS builder

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 设置工作目录
WORKDIR /app

# 先复制依赖清单文件，利用 Docker 缓存层
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 安装所有依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建 Next.js（standalone 模式）
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# ============================================
# Stage 2: 运行阶段 (runner)
# ============================================
FROM node:20-alpine AS runner

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 设置工作目录
WORKDIR /app

# 设置 Next.js 监听所有网卡
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# 从构建阶段复制 standalone 产物
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# 设置目录权限
RUN chown -R appuser:appgroup /app

# 切换到非 root 用户
USER appuser

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# 启动命令
CMD ["node", "server.js"]
