import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // ==================== 工具方法 ====================

  /**
   * 将 Date 格式化为 YYYY-MM-DD（基于服务器本地时区）
   */
  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * 构建最近 N 天的日期数组（升序，今天为最后一天）
   */
  private buildDateRange(days: number): string[] {
    const dates: string[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      dates.push(this.formatDate(d));
    }
    return dates;
  }

  /**
   * 将 YYYY-MM-DD 字符串解析为当天零点的 Date（本地时区）
   */
  private parseDateStart(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  // ==================== 仪表盘概览 ====================

  /**
   * 创作者仪表盘概览
   */
  async getDashboard(userId: number) {
    // 拉取作者的所有剧本（仅需要的字段）
    const scripts = await this.prisma.script.findMany({
      where: { authorId: userId },
      select: { id: true, status: true, playCount: true, favCount: true },
    });

    const scriptIds = scripts.map((s) => s.id);

    const totalScripts = scripts.length;
    const publishedCount = scripts.filter(
      (s) => s.status === 'published',
    ).length;
    const draftCount = scripts.filter((s) => s.status === 'draft').length;
    const totalPlayCount = scripts.reduce((sum, s) => sum + s.playCount, 0);
    const totalFavCount = scripts.reduce((sum, s) => sum + s.favCount, 0);

    // 总评论数（针对作者剧本的评论）
    const totalComments =
      scriptIds.length > 0
        ? await this.prisma.comment.count({
            where: { targetType: 'script', targetId: { in: scriptIds } },
          })
        : 0;

    // 总收入（创作者分成收入）
    const revenueAgg = await this.prisma.transactionLog.aggregate({
      where: { userId, type: 'income', relatedType: 'creator_income' },
      _sum: { amount: true },
    });
    const totalRevenue = revenueAgg._sum.amount || 0;

    // 本月起止
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // 本月新增游玩次数
    const monthPlayCount =
      scriptIds.length > 0
        ? await this.prisma.gameSession.count({
            where: {
              scriptId: { in: scriptIds },
              createdAt: { gte: monthStart },
            },
          })
        : 0;

    // 本月收入
    const monthRevenueAgg = await this.prisma.transactionLog.aggregate({
      where: {
        userId,
        type: 'income',
        relatedType: 'creator_income',
        createdAt: { gte: monthStart },
      },
      _sum: { amount: true },
    });
    const monthRevenue = monthRevenueAgg._sum.amount || 0;

    return {
      success: true,
      data: {
        totalScripts,
        publishedCount,
        draftCount,
        totalPlayCount,
        totalFavCount,
        totalComments,
        totalRevenue,
        monthPlayCount,
        monthRevenue,
      },
    };
  }

  // ==================== 我的剧本统计列表 ====================

  /**
   * 创作者剧本统计列表（含最近 7 天游玩趋势）
   */
  async getScriptsStats(userId: number) {
    const scripts = await this.prisma.script.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        category: true,
        playCount: true,
        favCount: true,
        createdAt: true,
      },
    });

    if (scripts.length === 0) {
      return { success: true, data: [] };
    }

    const scriptIds = scripts.map((s) => s.id);

    // 每个剧本的评论数
    const commentGroups = await this.prisma.comment.groupBy({
      by: ['targetId'],
      where: { targetType: 'script', targetId: { in: scriptIds } },
      _count: { _all: true },
    });
    const commentMap = new Map<number, number>(
      commentGroups.map((c) => [c.targetId, c._count._all]),
    );

    // 每个剧本的收入（relatedId 关联剧本）
    const revenueGroups = await this.prisma.transactionLog.groupBy({
      by: ['relatedId'],
      where: {
        userId,
        type: 'income',
        relatedType: 'creator_income',
        relatedId: { in: scriptIds },
      },
      _sum: { amount: true },
    });
    const revenueMap = new Map<number, number>(
      revenueGroups.map((r) => [r.relatedId as number, r._sum.amount || 0]),
    );

    // 最近 7 天的日期标签
    const dayLabels = this.buildDateRange(7);

    // 拉取最近 7 天的游玩会话
    const sevenDaysAgo = this.parseDateStart(dayLabels[0]);
    const sessions = await this.prisma.gameSession.findMany({
      where: {
        scriptId: { in: scriptIds },
        createdAt: { gte: sevenDaysAgo },
      },
      select: { scriptId: true, createdAt: true },
    });

    // trendMap: scriptId -> date -> count
    const trendMap = new Map<number, Map<string, number>>();
    for (const s of sessions) {
      const dateKey = this.formatDate(s.createdAt);
      let m = trendMap.get(s.scriptId);
      if (!m) {
        m = new Map<string, number>();
        trendMap.set(s.scriptId, m);
      }
      m.set(dateKey, (m.get(dateKey) || 0) + 1);
    }

    const data = scripts.map((script) => {
      const scriptTrend = trendMap.get(script.id);
      const trend = dayLabels.map((date) => scriptTrend?.get(date) || 0);
      return {
        id: script.id,
        title: script.title,
        status: script.status,
        category: script.category,
        playCount: script.playCount,
        favCount: script.favCount,
        commentCount: commentMap.get(script.id) || 0,
        revenue: revenueMap.get(script.id) || 0,
        trendLabels: dayLabels,
        trend,
      };
    });

    return { success: true, data };
  }

  // ==================== 收入趋势图 ====================

  /**
   * 最近 N 天每天的收入数据
   */
  async getRevenueChart(userId: number, days: number) {
    const dayLabels = this.buildDateRange(days);
    const startDate = this.parseDateStart(dayLabels[0]);

    const transactions = await this.prisma.transactionLog.findMany({
      where: {
        userId,
        type: 'income',
        relatedType: 'creator_income',
        createdAt: { gte: startDate },
      },
      select: { amount: true, createdAt: true },
    });

    const map = new Map<string, number>();
    for (const t of transactions) {
      const dateKey = this.formatDate(t.createdAt);
      map.set(dateKey, (map.get(dateKey) || 0) + t.amount);
    }

    const data = dayLabels.map((date) => ({
      date,
      amount: map.get(date) || 0,
    }));

    return { success: true, data };
  }

  // ==================== 游玩趋势图 ====================

  /**
   * 最近 N 天每天的游玩次数
   */
  async getPlayChart(userId: number, days: number) {
    const dayLabels = this.buildDateRange(days);
    const startDate = this.parseDateStart(dayLabels[0]);

    const scripts = await this.prisma.script.findMany({
      where: { authorId: userId },
      select: { id: true },
    });
    const scriptIds = scripts.map((s) => s.id);

    if (scriptIds.length === 0) {
      return {
        success: true,
        data: dayLabels.map((date) => ({ date, count: 0 })),
      };
    }

    const sessions = await this.prisma.gameSession.findMany({
      where: {
        scriptId: { in: scriptIds },
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
    });

    const map = new Map<string, number>();
    for (const s of sessions) {
      const dateKey = this.formatDate(s.createdAt);
      map.set(dateKey, (map.get(dateKey) || 0) + 1);
    }

    const data = dayLabels.map((date) => ({
      date,
      count: map.get(date) || 0,
    }));

    return { success: true, data };
  }

  // ==================== 受众分析 ====================

  /**
   * 受众分析：按剧本分类的游玩分布 + 游玩时段分布（0-23 点）
   */
  async getAudience(userId: number) {
    const scripts = await this.prisma.script.findMany({
      where: { authorId: userId },
      select: { id: true, category: true, playCount: true },
    });

    // 空数据兜底
    const emptyHourly = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: 0,
    }));

    if (scripts.length === 0) {
      return {
        success: true,
        data: {
          categoryDistribution: [],
          hourlyDistribution: emptyHourly,
        },
      };
    }

    const scriptIds = scripts.map((s) => s.id);

    // 拉取作者所有剧本的游玩会话，同时带出剧本分类
    const sessions = await this.prisma.gameSession.findMany({
      where: { scriptId: { in: scriptIds } },
      select: {
        createdAt: true,
        script: { select: { category: true } },
      },
    });

    // 按分类统计游玩次数
    const categoryMap = new Map<string, number>();
    // 按小时统计游玩次数
    const hourly: number[] = Array.from({ length: 24 }, () => 0);

    for (const s of sessions) {
      const cat = s.script.category;
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      hourly[s.createdAt.getHours()] += 1;
    }

    // 若没有会话记录，则退化为按 playCount 累加的分布，保证有数据展示
    let categoryDistribution: Array<{ category: string; count: number }>;
    if (sessions.length === 0) {
      const fallback = new Map<string, number>();
      for (const s of scripts) {
        fallback.set(s.category, (fallback.get(s.category) || 0) + s.playCount);
      }
      categoryDistribution = Array.from(fallback.entries())
        .filter(([, count]) => count > 0)
        .map(([category, count]) => ({ category, count }));
    } else {
      categoryDistribution = Array.from(categoryMap.entries()).map(
        ([category, count]) => ({ category, count }),
      );
    }

    const hourlyDistribution = hourly.map((count, hour) => ({ hour, count }));

    return {
      success: true,
      data: {
        categoryDistribution,
        hourlyDistribution,
      },
    };
  }
}
