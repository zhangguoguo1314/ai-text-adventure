import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface UserStats {
  scriptCount: number;
  playCount: number;
  followerCount: number;
  favoriteCount: number;
  commentCount: number;
  inviteCount: number;
  totalSpent: number;
  isToday: boolean;
}

interface AchievementCondition {
  type: string;
  threshold: number;
}

@Injectable()
export class AchievementService {
  constructor(private prisma: PrismaService) {}

  // ==================== 查询接口 ====================

  /**
   * 所有成就列表（含用户解锁状态 + 进度）
   */
  async getAllAchievements(userId?: number) {
    const achievements = await this.prisma.achievement.findMany({
      orderBy: [{ category: 'asc' }, { id: 'asc' }],
    });

    let unlockedMap = new Map<number, Date>();
    let stats: UserStats | null = null;

    if (userId) {
      const [unlocked, user] = await Promise.all([
        this.prisma.userAchievement.findMany({
          where: { userId },
          select: { achievementId: true, unlockedAt: true },
        }),
        this.prisma.user.findUnique({ where: { id: userId } }),
      ]);
      unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));
      if (user) stats = await this.collectUserStats(userId, user);
    }

    const items = achievements.map((a) => {
      const unlockedAt = unlockedMap.get(a.id);
      const condition = this.parseCondition(a.condition);
      const progress = this.computeProgress(condition, stats);
      return {
        id: a.id,
        code: a.code,
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
        reward: a.reward,
        unlocked: !!unlockedAt,
        unlockedAt: unlockedAt || null,
        progress,
      };
    });

    const unlockedCount = items.filter((i) => i.unlocked).length;

    return {
      success: true,
      data: { list: items, total: items.length, unlockedCount },
    };
  }

  /**
   * 我的成就（已解锁）
   */
  async getMyAchievements(userId: number) {
    const list = await this.prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' },
      include: { achievement: true },
    });

    const items = list.map((ua) => ({
      id: ua.achievement.id,
      code: ua.achievement.code,
      name: ua.achievement.name,
      description: ua.achievement.description,
      icon: ua.achievement.icon,
      category: ua.achievement.category,
      reward: ua.achievement.reward,
      unlockedAt: ua.unlockedAt,
    }));

    return { success: true, data: { list: items, count: items.length } };
  }

  // ==================== 成就检查与解锁 ====================

  /**
   * 检查并解锁成就（遍历所有成就条件，满足则解锁并发放奖励）
   */
  async checkAchievements(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, createdAt: true },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const achievements = await this.prisma.achievement.findMany();
    if (achievements.length === 0) {
      return { success: true, data: { unlocked: [] } };
    }

    // 已解锁集合
    const unlocked = await this.prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    const unlockedSet = new Set(unlocked.map((u) => u.achievementId));

    // 用户统计
    const stats = await this.collectUserStats(userId, user);

    const newlyUnlocked: any[] = [];

    for (const ach of achievements) {
      if (unlockedSet.has(ach.id)) continue;
      const condition = this.parseCondition(ach.condition);
      if (!condition) continue;

      const met = this.evaluateCondition(condition, stats);
      if (!met) continue;

      // 解锁成就
      const ua = await this.prisma.userAchievement.create({
        data: { userId, achievementId: ach.id },
      });

      // 发放奖励
      if (ach.reward > 0) {
        await this.addPermanentBalance(userId, ach.reward);
        await this.prisma.transactionLog.create({
          data: {
            userId,
            type: 'income',
            amount: ach.reward,
            currency: 'uu',
            description: `成就奖励：${ach.name}`,
            relatedType: 'achievement',
            relatedId: ach.id,
          },
        });
      }

      // 通知用户
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'achievement',
          title: '解锁新成就',
          content: `恭喜解锁成就「${ach.name}」${
            ach.reward > 0 ? `，获得 ${ach.reward} UU币奖励` : ''
          }`,
        },
      });

      newlyUnlocked.push({
        id: ach.id,
        code: ach.code,
        name: ach.name,
        icon: ach.icon,
        category: ach.category,
        reward: ach.reward,
        unlockedAt: ua.unlockedAt,
      });
    }

    return { success: true, data: { unlocked: newlyUnlocked } };
  }

  // ==================== 工具方法 ====================

  /**
   * 收集用户各项统计数据用于成就判定
   */
  private async collectUserStats(userId: number, user: { createdAt: Date }): Promise<UserStats> {
    const [
      scriptCount,
      playCount,
      followerCount,
      favoriteCount,
      commentCount,
      inviteCount,
      spentAgg,
    ] = await Promise.all([
      this.prisma.script.count({ where: { authorId: userId } }),
      this.prisma.gameSession.count({ where: { userId } }),
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.favorite.count({
        where: { userId, targetType: 'script' },
      }),
      this.prisma.comment.count({ where: { userId } }),
      this.prisma.invitation.count({ where: { inviterId: userId } }),
      this.prisma.transactionLog.aggregate({
        where: { userId, type: 'spend' },
        _sum: { amount: true },
      }),
    ]);

    return {
      scriptCount,
      playCount,
      followerCount,
      favoriteCount,
      commentCount,
      inviteCount,
      totalSpent: spentAgg._sum.amount || 0,
      isToday: this.isToday(user.createdAt),
    };
  }

  private parseCondition(conditionStr: string): AchievementCondition | null {
    if (!conditionStr) return null;
    try {
      return JSON.parse(conditionStr);
    } catch {
      return null;
    }
  }

  private evaluateCondition(
    condition: AchievementCondition,
    stats: UserStats,
  ): boolean {
    const { type, threshold } = condition;
    switch (type) {
      case 'first_login':
        return stats.isToday;
      case 'script_count':
        return stats.scriptCount >= threshold;
      case 'play_count':
        return stats.playCount >= threshold;
      case 'follower_count':
        return stats.followerCount >= threshold;
      case 'favorite_count':
        return stats.favoriteCount >= threshold;
      case 'comment_count':
        return stats.commentCount >= threshold;
      case 'invite_count':
        return stats.inviteCount >= threshold;
      case 'total_spent':
        return stats.totalSpent >= threshold;
      default:
        return false;
    }
  }

  private computeProgress(
    condition: AchievementCondition | null,
    stats: UserStats | null,
  ): { current: number; threshold: number; percentage: number } | null {
    if (!condition || !stats) return null;
    const { type, threshold } = condition;
    let current = 0;
    switch (type) {
      case 'first_login':
        current = stats.isToday ? 1 : 0;
        break;
      case 'script_count':
        current = stats.scriptCount;
        break;
      case 'play_count':
        current = stats.playCount;
        break;
      case 'follower_count':
        current = stats.followerCount;
        break;
      case 'favorite_count':
        current = stats.favoriteCount;
        break;
      case 'comment_count':
        current = stats.commentCount;
        break;
      case 'invite_count':
        current = stats.inviteCount;
        break;
      case 'total_spent':
        current = stats.totalSpent;
        break;
      default:
        return null;
    }
    const t = threshold || 1;
    const percentage = Math.min(100, Math.round((current / t) * 100));
    return { current, threshold: t, percentage };
  }

  private isToday(date: Date): boolean {
    const d = new Date(date);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }

  /**
   * 增加用户永久余额（不存在则创建）
   */
  private async addPermanentBalance(userId: number, amount: number) {
    const existing = await this.prisma.userBalance.findUnique({
      where: { userId },
    });

    if (!existing) {
      await this.prisma.userBalance.create({
        data: {
          userId,
          permanentBalance: amount,
          totalIncome: amount,
        },
      });
    } else {
      await this.prisma.userBalance.update({
        where: { userId },
        data: {
          permanentBalance: { increment: amount },
          totalIncome: { increment: amount },
        },
      });
    }
  }
}
