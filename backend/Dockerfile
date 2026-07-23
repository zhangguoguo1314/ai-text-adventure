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

# 安装所有依赖（包括 devDependencies，构建时需要）
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建 NestJS 项目
RUN pnpm run build

# ============================================
# Stage 2: 运行阶段 (runner)
# ============================================
FROM node:20-alpine AS runner

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 创建非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 设置工作目录
WORKDIR /app

# 先复制依赖清单
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 仅安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 从构建阶段复制产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# 创建数据目录
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

# 切换到非 root 用户
USER appuser

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# 启动命令
CMD ["node", "dist/main"]
