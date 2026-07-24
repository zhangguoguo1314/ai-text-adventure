import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Trend = 'up' | 'down' | 'same';

@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService) {}

  // ==================== 工具方法 ====================

  /**
   * 按周期返回时间窗口大小（毫秒）
   * daily=1天, week=7天, month=30天, total=不限
   */
  private getDurationMs(period: string): number {
    if (period === 'daily') return 24 * 60 * 60 * 1000;
    if (period === 'month') return 30 * 24 * 60 * 60 * 1000;
    return 7 * 24 * 60 * 60 * 1000; // week & total trend
  }

  private computeTrend(current: number, prev: number): Trend {
    if (current > prev) return 'up';
    if (current < prev) return 'down';
    return 'same';
  }

  // ==================== 剧本排行榜 ====================

  /**
   * 剧本排行榜：按 GameSession 创建时间过滤，按游玩次数降序
   */
  async getScriptsRanking(
    period = 'week',
    category = 'all',
    page = 1,
    limit = 20,
  ) {
    const now = Date.now();
    const durationMs = this.getDurationMs(period);
    const periodStart =
      period === 'total' ? undefined : new Date(now - durationMs);
    const trendCurrentStart = new Date(now - durationMs);
    const trendPrevStart = new Date(now - 2 * durationMs);

    const where: any = {};
    if (periodStart) where.createdAt = { gte: periodStart };
    if (category && category !== 'all') where.script = { category };

    // 聚合每个剧本在周期内的游玩次数
    const groups = await this.prisma.gameSession.groupBy({
      by: ['scriptId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const total = groups.length;
    const offset = (page - 1) * limit;
    const pageGroups = groups.slice(offset, offset + limit);

    if (pageGroups.length === 0) {
      return { items: [], total, page, limit };
    }

    const scriptIds = pageGroups.map((g) => g.scriptId);
    const countMap = new Map(pageGroups.map((g) => [g.scriptId, g._count.id]));

    // 剧本信息
    const scripts = await this.prisma.script.findMany({
      where: { id: { in: scriptIds } },
      select: {
        id: true,
        title: true,
        cover: true,
        category: true,
        playCount: true,
        favCount: true,
        author: { select: { id: true, nickname: true, avatar: true } },
      },
    });
    const scriptMap = new Map(scripts.map((s) => [s.id, s]));

    // 趋势：上一周期各剧本游玩次数
    const prevGroups = await this.prisma.gameSession.groupBy({
      by: ['scriptId'],
      where: {
        scriptId: { in: scriptIds },
        createdAt: { gte: trendPrevStart, lt: trendCurrentStart },
      },
      _count: { id: true },
    });
    const prevMap = new Map(prevGroups.map((g) => [g.scriptId, g._count.id]));

    const items = pageGroups.map((g, index) => {
      const script = scriptMap.get(g.scriptId);
      const current = countMap.get(g.scriptId) || 0;
      const prev = prevMap.get(g.scriptId) || 0;
      return {
        rank: offset + index + 1,
        scriptId: g.scriptId,
        playCount: current,
        trend: this.computeTrend(current, prev),
        script: script
          ? {
              id: script.id,
              title: script.title,
              cover: script.cover,
              category: script.category,
              favCount: script.favCount,
              author: script.author,
            }
          : null,
      };
    });

    return { items, total, page, limit };
  }

  // ==================== 创作者排行榜 ====================

  /**
   * 创作者排行榜：按创作者的剧本总游玩次数排序
   */
  async getCreatorsRanking(period = 'week', page = 1, limit = 20) {
    const now = Date.now();
    const durationMs = this.getDurationMs(period);
    const periodStart =
      period === 'total' ? undefined : new Date(now - durationMs);

    // 剧本 -> 作者 映射
    const scripts = await this.prisma.script.findMany({
      select: { id: true, authorId: true },
    });
    const scriptAuthorMap = new Map(scripts.map((s) => [s.id, s.authorId]));

    // 周期内每个剧本的游玩次数
    const sessionWhere: any = {};
    if (periodStart) sessionWhere.createdAt = { gte: periodStart };
    const sessionGroups = await this.prisma.gameSession.groupBy({
      by: ['scriptId'],
      where: sessionWhere,
      _count: { id: true },
    });

    // 按作者聚合游玩次数
    const authorPlays = new Map<number, number>();
    for (const g of sessionGroups) {
      const authorId = scriptAuthorMap.get(g.scriptId);
      if (!authorId) continue;
      authorPlays.set(
        authorId,
        (authorPlays.get(authorId) || 0) + g._count.id,
      );
    }

    const sorted = Array.from(authorPlays.entries()).sort(
      (a, b) => b[1] - a[1],
    );
    const total = sorted.length;
    const offset = (page - 1) * limit;
    const pageAuthors = sorted.slice(offset, offset + limit);

    if (pageAuthors.length === 0) {
      return { items: [], total, page, limit };
    }

    const authorIds = pageAuthors.map(([id]) => id);
    const playsMap = new Map(pageAuthors);

    // 用户信息
    const users = await this.prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        level: true,
        bio: true,
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // 每位作者的已发布剧本数
    const scriptCountGroups = await this.prisma.script.groupBy({
      by: ['authorId'],
      where: { authorId: { in: authorIds }, status: 'published' },
      _count: { id: true },
    });
    const scriptCountMap = new Map(
      scriptCountGroups.map((g) => [g.authorId, g._count.id]),
    );

    // 每位作者周期内的创作收入
    const incomeWhere: any = {
      userId: { in: authorIds },
      type: 'income',
      relatedType: 'creator_income',
    };
    if (periodStart) incomeWhere.createdAt = { gte: periodStart };
    const incomeGroups = await this.prisma.transactionLog.groupBy({
      by: ['userId'],
      where: incomeWhere,
      _sum: { amount: true },
    });
    const incomeMap = new Map(
      incomeGroups.map((g) => [g.userId, g._sum.amount || 0]),
    );

    const items = pageAuthors.map(([authorId, totalPlays], index) => {
      const u = userMap.get(authorId);
      return {
        rank: offset + index + 1,
        user: u
          ? {
              id: u.id,
              nickname: u.nickname,
              avatar: u.avatar,
              level: u.level,
              bio: u.bio,
            }
          : {
              id: authorId,
              nickname: '匿名用户',
              avatar: null,
              level: 1,
              bio: null,
            },
        totalScripts: scriptCountMap.get(authorId) || 0,
        totalPlays,
        totalIncome: incomeMap.get(authorId) || 0,
      };
    });

    return { items, total, page, limit };
  }

  // ==================== 新作榜 ====================

  /**
   * 新作榜：按发布时间排序的最近剧本（7天内发布的，按游玩次数降序）
   */
  async getNewScriptsRanking(category = 'all', page = 1, limit = 20) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const where: any = {
      status: 'published',
      createdAt: { gte: sevenDaysAgo },
    };
    if (category && category !== 'all') where.category = category;

    const total = await this.prisma.script.count({ where });

    const offset = (page - 1) * limit;
    const scripts = await this.prisma.script.findMany({
      where,
      select: {
        id: true,
        title: true,
        cover: true,
        category: true,
        desc: true,
        playCount: true,
        favCount: true,
        createdAt: true,
        author: { select: { id: true, nickname: true, avatar: true } },
      },
      orderBy: [{ playCount: 'desc' }, { createdAt: 'desc' }],
      skip: offset,
      take: limit,
    });

    const items = scripts.map((script, index) => ({
      rank: offset + index + 1,
      scriptId: script.id,
      playCount: script.playCount,
      favCount: script.favCount,
      isNew: true,
      publishedAt: script.createdAt,
      script: {
        id: script.id,
        title: script.title,
        cover: script.cover,
        category: script.category,
        desc: script.desc,
        author: script.author,
      },
    }));

    return { items, total, page, limit };
  }

  // ==================== 玩家排行榜 ====================

  /**
   * 玩家排行榜：按玩家游玩次数（GameSession 数量）排序
   */
  async getPlayersRanking(period = 'week', page = 1, limit = 20) {
    const now = Date.now();
    const durationMs = this.getDurationMs(period);
    const periodStart =
      period === 'total' ? undefined : new Date(now - durationMs);

    const where: any = {};
    if (periodStart) where.createdAt = { gte: periodStart };

    const groups = await this.prisma.gameSession.groupBy({
      by: ['userId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const total = groups.length;
    const offset = (page - 1) * limit;
    const pageGroups = groups.slice(offset, offset + limit);

    if (pageGroups.length === 0) {
      return { items: [], total, page, limit };
    }

    const userIds = pageGroups.map((g) => g.userId);
    const countMap = new Map(pageGroups.map((g) => [g.userId, g._count.id]));

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        level: true,
        bio: true,
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // 每位玩家的收藏剧本数
    const favGroups = await this.prisma.favorite.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, targetType: 'script' },
      _count: { _all: true },
    });
    const favMap = new Map(
      favGroups.map((g) => [g.userId, g._count._all]),
    );

    const items = pageGroups.map((g, index) => {
      const u = userMap.get(g.userId);
      return {
        rank: offset + index + 1,
        user: u
          ? {
              id: u.id,
              nickname: u.nickname,
              avatar: u.avatar,
              level: u.level,
              bio: u.bio,
            }
          : {
              id: g.userId,
              nickname: '匿名用户',
              avatar: null,
              level: 1,
              bio: null,
            },
        playCount: countMap.get(g.userId) || 0,
        favoriteCount: favMap.get(g.userId) || 0,
      };
    });

    return { items, total, page, limit };
  }
}
