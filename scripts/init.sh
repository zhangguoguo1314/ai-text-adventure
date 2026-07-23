#!/bin/bash
# ============================================
# AI Text Adventure 一键初始化部署脚本
# ============================================
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目目录
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  AI Text Adventure 部署初始化${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ============================================
# 1. 检查 Docker 是否安装
# ============================================
echo -e "${YELLOW}[1/6] 检查 Docker 环境...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装，请先安装 Docker${NC}"
    echo "  安装文档: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}错误: Docker Compose 未安装${NC}"
    echo "  Docker Compose V2 随 Docker Desktop 自带"
    echo "  独立安装文档: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}  Docker 版本: $(docker --version)${NC}"
echo -e "${GREEN}  Docker Compose 版本: $(docker compose version 2>/dev/null || docker-compose --version)${NC}"
echo ""

# ============================================
# 2. 复制环境变量文件
# ============================================
echo -e "${YELLOW}[2/6] 配置环境变量...${NC}"

cd "$PROJECT_DIR"

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}  已从 .env.example 创建 .env 文件${NC}"
        echo -e "${YELLOW}  请编辑 .env 文件，修改 JWT_SECRET 等敏感配置！${NC}"
    else
        echo -e "${YELLOW}  警告: .env.example 不存在，跳过环境变量配置${NC}"
    fi
else
    echo -e "${GREEN}  .env 文件已存在，跳过${NC}"
fi
echo ""

# ============================================
# 3. 构建并启动 Docker 服务
# ============================================
echo -e "${YELLOW}[3/6] 构建 Docker 镜像...${NC}"
docker compose build

echo ""
echo -e "${YELLOW}[4/6] 启动服务...${NC}"
docker compose up -d
echo ""

# ============================================
# 4. 等待服务启动
# ============================================
echo -e "${YELLOW}[5/6] 等待服务启动...${NC}"

MAX_WAIT=120
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        break
    fi
    sleep 3
    WAITED=$((WAITED + 3))
    echo -n "."
done
echo ""

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${RED}错误: 后端服务启动超时（${MAX_WAIT}秒）${NC}"
    echo "  请检查日志: docker compose logs backend"
    exit 1
fi

echo -e "${GREEN}  后端服务已就绪${NC}"
echo ""

# ============================================
# 5. 运行数据库迁移和种子数据
# ============================================
echo -e "${YELLOW}[6/6] 运行数据库迁移...${NC}"

# 在 backend 容器中执行迁移和种子
docker compose exec backend sh -c "npx prisma migrate deploy 2>/dev/null || npx prisma db push" || {
    echo -e "${YELLOW}  数据库迁移跳过（可能数据库已初始化）${NC}"
}

# 运行种子数据
docker compose exec backend npx tsx prisma/seed.ts 2>/dev/null || {
    echo -e "${YELLOW}  种子数据跳过（可能已存在）${NC}"
}

echo ""

# ============================================
# 输出访问信息
# ============================================
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  前端地址:  ${BLUE}http://localhost${NC}"
echo -e "  后端API:   ${BLUE}http://localhost:3001/api${NC}"
echo -e "  API文档:   ${BLUE}http://localhost:3001/api-docs${NC}"
echo -e "  Nginx:     ${BLUE}http://localhost:80${NC}"
echo ""
echo -e "  常用命令:"
echo -e "    查看日志:     ${BLUE}docker compose logs -f${NC}"
echo -e "    停止服务:     ${BLUE}docker compose down${NC}"
echo -e "    数据库备份:   ${BLUE}bash scripts/backup.sh${NC}"
echo -e "    更新部署:     ${BLUE}bash scripts/update.sh${NC}"
echo ""
echo -e "${YELLOW}  重要提醒: 请修改 .env 中的 JWT_SECRET！${NC}"
echo ""
