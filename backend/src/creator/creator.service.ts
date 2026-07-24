import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import {
  CREATOR_LEVEL_TIERS,
  resolveCreatorLevel,
  CreatorLevelTier,
  QueryIncomeRecordsDto,
  QueryCreatorRankingDto,
  VerifyCreatorDto,
} from './dto/creator.dto';

@Injectable()
export class CreatorService {
  private readonly logger = new Logger('CreatorService');

  constructor(
    private prisma: PrismaService,
    private realtimeService: RealtimeService,
  ) {}

  // ==================== 权限校验 ====================

  /**
   * 校验用户是否为管理员
   */
  private async checkAdmin(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('无管理员权限');
    }
    return user;
  }

  // ==================== 创作者等级信息 ====================

  /**
   * 获取创作者等级信息
   * - 若用户尚无 CreatorLevel 记录，则自动创建（默认等级 1）
   * - 返回时附带星河头像框标识与下一等级进度
   */
  async getCreatorLevel(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nickname: true, avatar: true, role: true },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    let creatorLevel = await this.prisma.creatorLevel.findUnique({
      where: { userId },
    });

    // 不存在则按默认值创建
    if (!creatorLevel) {
      creatorLevel = await this.prisma.creatorLevel.create({
        data: { userId },
      });
    }

    return {
      success: true,
      data: this.formatCreatorLevel(creatorLevel),
    };
  }

  /**
   * 手动触发等级统计刷新（基于剧本数据统计）
   * 也可由剧本发布 / 游玩等事件异步调用
   */
  async refreshCreatorLevel(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const updated = await this.recalculateCreatorLevel(userId);

    return {
      success: true,
      message: '创作者等级已刷新',
      data: this.formatCreatorLevel(updated),
    };
  }

  /**
   * 根据剧本数据统计自动更新创作者等级
   * 统计维度：累计游玩次数、剧本数、累计收益、平均评分
   * 等级判定：依据累计游玩次数匹配等级阈值
   */
  async recalculateCreatorLevel(userId: number) {
    // 1. 聚合该用户已发布剧本的游玩次数与剧本数
    const scriptAgg = await this.prisma.script.aggregate({
      where: { authorId: userId, status: 'published' },
      _sum: { playCount: true },
      _count: { id: true },
    });
    const totalPlayCount = scriptAgg._sum.playCount ?? 0;
    const scriptCount = scriptAgg._count.id ?? 0;

    // 2. 聚合创作者收益（type=income & relatedType=creator_income）
    const incomeAgg = await this.prisma.transactionLog.aggregate({
      where: {
        userId,
        type: 'income',
        relatedType: 'creator_income',
      },
      _sum: { amount: true },
    });
    const totalIncome = incomeAgg._sum.amount ?? 0;

    // 3. 聚合剧本平均评分（评论中的 rating）
    const publishedScripts = await this.prisma.script.findMany({
      where: { authorId: userId, status: 'published' },
      select: { id: true },
    });
    const scriptIds = publishedScripts.map((s) => s.id);

    let avgRating = 0;
    if (scriptIds.length > 0) {
      const ratingAgg = await this.prisma.comment.aggregate({
        where: {
          targetType: 'script',
          targetId: { in: scriptIds },
          rating: { not: null },
        },
        _avg: { rating: true },
      });
      avgRating = ratingAgg._avg.rating
        ? Math.round(ratingAgg._avg.rating * 10) / 10
        : 0;
    }

    // 4. 依据累计游玩次数匹配等级
    const tier = resolveCreatorLevel(totalPlayCount);

    // 5. 写入 / 更新 CreatorLevel 记录（保留 isVerified / verifiedAt）
    const existing = await this.prisma.creatorLevel.findUnique({
      where: { userId },
    });

    if (!existing) {
      return this.prisma.creatorLevel.create({
        data: {
          userId,
          level: tier.level,
          title: tier.title,
          totalPlayCount,
          totalIncome,
          scriptCount,
          avgRating,
        },
      });
    }

    return this.prisma.creatorLevel.update({
      where: { userId },
      data: {
        level: tier.level,
        title: tier.title,
        totalPlayCount,
        totalIncome,
        scriptCount,
        avgRating,
      },
    });
  }

  // ==================== 收益记录 ====================

  /**
   * 获取创作者收益记录
   * 数据来源：TransactionLog 中 type=income 且 relatedType=creator_income 的记录
   */
  async getIncomeRecords(userId: number, dto: QueryIncomeRecordsDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      type: 'income',
      relatedType: 'creator_income',
    };

    // 时间范围筛选
    if (dto.period && dto.period !== 'total') {
      const now = Date.now();
      const durationMs =
        dto.period === 'month' ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
      where.createdAt = { gte: new Date(now - durationMs) };
    }

    const [items, total, sumAgg] = await Promise.all([
      this.prisma.transactionLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transactionLog.count({ where }),
      this.prisma.transactionLog.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    return {
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        /** 当前筛选范围内的累计收益 */
        periodIncome: sumAgg._sum.amount ?? 0,
      },
    };
  }

  // ==================== 创作者认证（管理员审核） ====================

  /**
   * 管理员审核创作者认证
   * - 通过：授予创作者身份（User.role=creator）+ 星河头像框（isVerified=true）
   * - 拒绝：取消认证状态
   */
  async verifyCreator(adminId: number, targetUserId: number, dto: VerifyCreatorDto) {
    await this.checkAdmin(adminId);

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, nickname: true, role: true },
    });
    if (!targetUser) {
      throw new NotFoundException('用户不存在');
    }

    // 确保创作者等级记录存在
    let creatorLevel = await this.prisma.creatorLevel.findUnique({
      where: { userId: targetUserId },
    });
    if (!creatorLevel) {
      creatorLevel = await this.prisma.creatorLevel.create({
        data: { userId: targetUserId },
      });
    }

    if (dto.approved) {
      // 通过认证：授予创作者身份 + 星河头像框
      const updated = await this.prisma.creatorLevel.update({
        where: { userId: targetUserId },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
        },
      });

      // 同步用户角色为 creator（不覆盖已有的 admin 角色）
      if (targetUser.role !== 'admin' && targetUser.role !== 'creator') {
        await this.prisma.user.update({
          where: { id: targetUserId },
          data: { role: 'creator' },
        });
      }

      // 站内通知
      const notification = await this.prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'creator_verified',
          title: '创作者认证通过',
          content:
            `恭喜！您的创作者认证已通过审核。${
              dto.reviewNote ? `审核备注：${dto.reviewNote}` : ''
            }您已获得创作者身份与「星河」头像框，快来开启创作之旅吧！`,
        },
      });

      // 实时通知
      this.realtimeService.sendNotification(targetUserId, {
        type: 'creator_verified',
        title: '创作者认证通过',
        message: '您已获得创作者身份与「星河」头像框',
        avatarFrame: 'galaxy',
      });

      return {
        success: true,
        message: '创作者认证已通过，已授予创作者身份与星河头像框',
        data: {
          ...this.formatCreatorLevel(updated),
          reviewNote: dto.reviewNote || null,
          notification,
        },
      };
    } else {
      // 拒绝认证：取消认证状态（保留等级数据）
      const updated = await this.prisma.creatorLevel.update({
        where: { userId: targetUserId },
        data: {
          isVerified: false,
          verifiedAt: null,
        },
      });

      const notification = await this.prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'creator_verified',
          title: '创作者认证未通过',
          content: `您的创作者认证未通过审核。${
            dto.reviewNote ? `原因：${dto.reviewNote}` : '请完善作品后重新申请。'
          }`,
        },
      });

      this.realtimeService.sendNotification(targetUserId, {
        type: 'creator_verified',
        title: '创作者认证未通过',
        message: dto.reviewNote || '您的创作者认证未通过审核',
      });

      return {
        success: true,
        message: '已拒绝创作者认证',
        data: {
          ...this.formatCreatorLevel(updated),
          reviewNote: dto.reviewNote || null,
          notification,
        },
      };
    }
  }

  // ==================== 创作者排行榜 ====================

  /**
   * 获取创作者排行榜
   * 排序维度：totalPlayCount（默认）/ totalIncome / avgRating / scriptCount
   * 支持仅展示已认证创作者
   */
  async getCreatorRanking(dto: QueryCreatorRankingDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = dto.sortBy || 'totalPlayCount';

    const where: any = {};
    if (dto.verifiedOnly) {
      where.isVerified = true;
    }

    const [items, total] = await Promise.all([
      this.prisma.creatorLevel.findMany({
        where,
        orderBy: { [sortBy]: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              bio: true,
            },
          },
        },
      }),
      this.prisma.creatorLevel.count({ where }),
    ]);

    const list = items.map((item, index) => ({
      rank: skip + index + 1,
      userId: item.userId,
      nickname: item.user?.nickname || '匿名用户',
      avatar: item.user?.avatar || null,
      bio: item.user?.bio || null,
      level: item.level,
      title: item.title,
      totalPlayCount: item.totalPlayCount,
      totalIncome: item.totalIncome,
      scriptCount: item.scriptCount,
      avgRating: item.avgRating,
      isVerified: item.isVerified,
      avatarFrame: item.isVerified ? 'galaxy' : null,
    }));

    return {
      success: true,
      data: {
        items: list,
        total,
        page,
        limit,
        sortBy,
      },
    };
  }

  // ==================== 等级体系查询 ====================

  /**
   * 获取创作者等级体系配置（供前端展示等级阶梯）
   */
  getLevelTiers() {
    return {
      success: true,
      data: {
        levels: CREATOR_LEVEL_TIERS,
      },
    };
  }

  // ==================== 工具方法 ====================

  /**
   * 将 CreatorLevel 记录格式化为接口响应结构
   * 附带星河头像框标识与下一等级进度信息
   */
  private formatCreatorLevel(creatorLevel: any) {
    const currentTier = CREATOR_LEVEL_TIERS.find(
      (t) => t.level === creatorLevel.level,
    ) || CREATOR_LEVEL_TIERS[0];

    // 计算下一等级
    const nextTier: CreatorLevelTier | null =
      currentTier.level < CREATOR_LEVEL_TIERS.length
        ? CREATOR_LEVEL_TIERS.find((t) => t.level === currentTier.level + 1) || null
        : null;

    const progressToNext = nextTier
      ? Math.max(0, nextTier.minPlayCount - creatorLevel.totalPlayCount)
      : null;

    return {
      userId: creatorLevel.userId,
      level: creatorLevel.level,
      title: creatorLevel.title,
      totalPlayCount: creatorLevel.totalPlayCount,
      totalIncome: creatorLevel.totalIncome,
      scriptCount: creatorLevel.scriptCount,
      avgRating: creatorLevel.avgRating,
      isVerified: creatorLevel.isVerified,
      verifiedAt: creatorLevel.verifiedAt,
      /** 通过认证后拥有「星河」头像框 */
      avatarFrame: creatorLevel.isVerified ? 'galaxy' : null,
      nextLevel: nextTier
        ? {
            level: nextTier.level,
            title: nextTier.title,
            minPlayCount: nextTier.minPlayCount,
          }
        : null,
      progressToNext,
      updatedAt: creatorLevel.updatedAt,
    };
  }
}
