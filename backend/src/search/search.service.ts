import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchScriptsDto, SearchSuggestDto } from './dto/search.dto';

const DEFAULT_HOT_KEYWORDS = [
  '冒险',
  '恋爱',
  '悬疑',
  '恐怖',
  '科幻',
  '奇幻',
  '校园',
  '修仙',
  '侦探',
  '末日',
];

@Injectable()
export class SearchService {
  /** 搜索日志：keyword -> count（内存存储） */
  private searchLogs = new Map<string, number>();

  /** 用户搜索历史：userId -> keyword[]（内存存储） */
  private userHistory = new Map<number, string[]>();

  constructor(private prisma: PrismaService) {}

  /**
   * 搜索剧本（分页）
   */
  async searchScripts(dto: SearchScriptsDto, userId?: number) {
    const keyword = dto.keyword?.trim() || '';
    const category = dto.category;
    const sort = dto.sort || 'recommended';
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    // 记录搜索日志
    if (keyword) {
      this.recordSearchLog(keyword, userId);
    }

    // 构建查询条件
    const where: any = { status: 'published' };

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { desc: { contains: keyword } },
      ];
    }

    if (category) {
      where.category = category;
    }

    // 构建排序
    let orderBy: any;
    if (sort === 'hot') {
      orderBy = { playCount: 'desc' };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else {
      // recommended: 按推荐分数降序（playCount * 2 + favCount * 5）
      // SQLite 不支持计算字段排序，先查询再在内存中排序
    }

    let items: any[];
    let total: number;

    if (sort === 'recommended') {
      // 查询所有符合条件的已发布剧本，然后按推荐分数排序
      const allItems = await this.prisma.script.findMany({
        where,
        include: {
          author: {
            select: { id: true, nickname: true, avatar: true },
          },
        },
      });

      // 计算推荐分数并排序
      allItems.sort(
        (a, b) =>
          b.playCount * 2 + b.favCount * 5 -
          (a.playCount * 2 + a.favCount * 5),
      );

      total = allItems.length;
      items = allItems.slice(skip, skip + limit);
    } else {
      [items, total] = await Promise.all([
        this.prisma.script.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            author: {
              select: { id: true, nickname: true, avatar: true },
            },
          },
        }),
        this.prisma.script.count({ where }),
      ]);
    }

    return {
      success: true,
      data: {
        items,
        total,
        page,
        limit,
      },
    };
  }

  /**
   * 获取热门搜索关键词（搜索日志统计 + 默认补充）
   */
  async getHotKeywords() {
    // 从搜索日志中取出搜索次数最多的关键词
    const sortedLogs = [...this.searchLogs.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword);

    // 如果搜索日志不足 10 个，用默认热门标签补充
    if (sortedLogs.length < 10) {
      const existingSet = new Set(sortedLogs);
      for (const defaultKeyword of DEFAULT_HOT_KEYWORDS) {
        if (sortedLogs.length >= 10) break;
        if (!existingSet.has(defaultKeyword)) {
          sortedLogs.push(defaultKeyword);
        }
      }
    }

    return {
      success: true,
      data: sortedLogs,
    };
  }

  /**
   * 搜索建议：根据输入返回匹配的剧本标题前 10 条
   */
  async suggest(dto: SearchSuggestDto) {
    const keyword = dto.keyword?.trim();

    if (!keyword) {
      return { success: true, data: [] };
    }

    const scripts = await this.prisma.script.findMany({
      where: {
        status: 'published',
        title: { contains: keyword },
      },
      select: {
        id: true,
        title: true,
        category: true,
        playCount: true,
        favCount: true,
        cover: true,
        desc: true,
      },
      take: 10,
      orderBy: { playCount: 'desc' },
    });

    return {
      success: true,
      data: scripts,
    };
  }

  /**
   * 获取用户搜索历史（最近 20 条）
   */
  async getSearchHistory(userId: number) {
    const history = this.userHistory.get(userId) || [];
    return {
      success: true,
      data: history.slice(0, 20),
    };
  }

  /**
   * 记录搜索日志（搜索计数 + 用户历史）
   */
  recordSearchLog(keyword: string, userId?: number) {
    // 更新全局搜索计数
    const count = this.searchLogs.get(keyword) || 0;
    this.searchLogs.set(keyword, count + 1);

    // 更新用户搜索历史
    if (userId) {
      const history = this.userHistory.get(userId) || [];
      // 去重：移除已有的相同关键词，再插入到最前面
      const filtered = history.filter((k) => k !== keyword);
      filtered.unshift(keyword);
      // 最多保留 20 条
      this.userHistory.set(userId, filtered.slice(0, 20));
    }
  }
}
