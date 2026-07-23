#!/bin/bash
# ============================================
# AI Text Adventure 更新部署脚本
# ============================================
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 项目目录
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  AI Text Adventure 更新部署${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ============================================
# 1. 拉取最新代码
# ============================================
echo -e "${YELLOW}[1/5] 拉取最新代码...${NC}"

cd "$PROJECT_DIR"

if [ -d .git ]; then
    git pull origin main || {
        echo -e "${YELLOW}  git pull 失败，尝试继续更新...${NC}"
    }
else
    echo -e "${YELLOW}  非 Git 仓库，跳过代码拉取${NC}"
fi
echo ""

# ============================================
# 2. 建议备份
# ============================================
echo -e "${YELLOW}[2/5] 数据库备份...${NC}"

if [ -f "$PROJECT_DIR/scripts/backup.sh" ]; then
    bash "$PROJECT_DIR/scripts/backup.sh"
else
    echo -e "${YELLOW}  备份脚本不存在，跳过备份（建议手动备份）${NC}"
fi
echo ""

# ============================================
# 3. 重新构建镜像
# ============================================
echo -e "${YELLOW}[3/5] 重新构建 Docker 镜像...${NC}"

cd "$PROJECT_DIR"
docker compose build --no-cache

echo ""

# ============================================
# 4. 启动新版本
# ============================================
echo -e "${YELLOW}[4/5] 启动新版本服务...${NC}"

docker compose up -d

echo ""

# ============================================
# 5. 运行数据库迁移
# ============================================
echo -e "${YELLOW}[5/5] 运行数据库迁移...${NC}"

# 等待后端服务就绪
MAX_WAIT=60
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
    if docker compose exec -T backend wget --spider http://localhost:3001/api/health > /dev/null 2>&1; then
        break
    fi
    sleep 3
    WAITED=$((WAITED + 3))
done

if [ $WAITED -lt $MAX_WAIT ]; then
    # 执行数据库迁移
    docker compose exec backend sh -c "npx prisma migrate deploy 2>/dev/null || npx prisma db push" || {
        echo -e "${YELLOW}  数据库迁移跳过${NC}"
    }
    echo -e "${GREEN}  迁移完成${NC}"
else
    echo -e "${YELLOW}  等待后端超时，跳过自动迁移${NC}"
    echo -e "${YELLOW}  请手动运行: docker compose exec backend npx prisma migrate deploy${NC}"
fi

echo ""

# ============================================
# 清理旧镜像
# ============================================
echo -e "${YELLOW}清理无用 Docker 镜像...${NC}"
docker image prune -f > /dev/null 2>&1

# ============================================
# 输出结果
# ============================================
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  更新部署完成！${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# 显示服务状态
docker compose ps

echo ""
echo -e "  常用命令:"
echo -e "    查看日志:     ${BLUE}docker compose logs -f${NC}"
echo -e "    回滚版本:     ${BLUE}git checkout <commit> && bash scripts/update.sh${NC}"
echo ""
