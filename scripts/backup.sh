#!/bin/bash
# ============================================
# AI Text Adventure 数据库备份脚本
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
BACKUP_DIR="$PROJECT_DIR/backups"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  AI Text Adventure 数据库备份${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ============================================
# 1. 检查服务状态
# ============================================
echo -e "${YELLOW}[1/3] 检查服务状态...${NC}"

cd "$PROJECT_DIR"

if ! docker compose ps backend --status running | grep -q "running"; then
    echo -e "${RED}错误: 后端服务未运行，请先启动服务${NC}"
    exit 1
fi

echo -e "${GREEN}  后端服务运行中${NC}"

# ============================================
# 2. 创建备份目录
# ============================================
echo -e "${YELLOW}[2/3] 准备备份目录...${NC}"

mkdir -p "$BACKUP_DIR"

# 生成带时间戳的备份文件名
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dev.db.$TIMESTAMP"

# ============================================
# 3. 复制数据库文件
# ============================================
echo -e "${YELLOW}[3/3] 备份数据库...${NC}"

# 使用 docker cp 从容器中复制数据库文件
docker compose cp backend:/app/data/dev.db "$BACKUP_FILE"

# 验证备份文件
if [ -f "$BACKUP_FILE" ]; then
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}  备份成功！${NC}"
    echo ""
    echo -e "  备份文件: ${BLUE}$BACKUP_FILE${NC}"
    echo -e "  文件大小: ${GREEN}$FILE_SIZE${NC}"
    echo ""
else
    echo -e "${RED}  备份失败！${NC}"
    exit 1
fi

# ============================================
# 清理旧备份（保留最近 30 个）
# ============================================
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/dev.db.* 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 30 ]; then
    echo -e "${YELLOW}清理旧备份（保留最近 30 个）...${NC}"
    ls -1t "$BACKUP_DIR"/dev.db.* | tail -n +31 | xargs rm -f
    echo -e "${GREEN}  清理完成${NC}"
fi

echo -e "${GREEN}============================================${NC}"
echo -e "  备份总数: $BACKUP_COUNT 个"
echo -e "${GREEN}============================================${NC}"
