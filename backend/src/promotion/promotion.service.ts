import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SubmitPromotionDto,
  ReviewPromotionDto,
  QueryPromotionDto,
} from './dto/promotion.dto';

// 奖励层级配置（可叠加）
interface TierConfig {
  tier: string;
  threshold: number; // 达到该层级所需的最低点赞数
  reward: number; // 该层级奖励的 UU币
}

const REWARD_TIERS: TierConfig[] = [
  { tier: 'tier1', threshold: 10, reward: 100 },
  { tier: 'tier2', threshold: 100, reward: 1000 },
  { tier: 'tier3', threshold: 1000, reward: 10000 },
];

// 平台中文名映射
const PLATFORM_LABELS: Record<string, string> = {
  douyin: '抖音',
  xiaohongshu: '小红书',
  bilibili: '哔哩哔哩',
  weibo: '微博',
};

@Injectable()
export class PromotionService {
  constructor(private prisma: PrismaService) {}

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

  // ==================== 奖励层级计算 ====================

  /**
   * 根据点赞数计算奖励层级和金额（层级可叠加）
   * tier1(10赞=100币) + tier2(100赞=1000币) + tier3(1000赞=10000币)
   * 例如：1000赞 = 100 + 1000 + 10000 = 11100 UU币
   */
  private calculateReward(likesCount: number): {
    tier: string;
    amount: number;
    reachedTiers: string[];
  } {
    let amount = 0;
    let highestTier = 'none';
    const reachedTiers: string[] = [];

    for (const t of REWARD_TIERS) {
      if (likesCount >= t.threshold) {
        amount += t.reward;
        highestTier = t.tier;
        reachedTiers.push(t.tier);
      }
    }

    return { tier: highestTier, amount, reachedTiers };
  }

  // ==================== 用户端 ====================

  /**
   * 提交推广链接
   */
  async submitPromotion(userId: number, dto: SubmitPromotionDto) {
    // 校验用户存在
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 校验链接格式
    if (!this.isValidLink(dto.link)) {
      throw new BadRequestException('推广链接格式不正确，需为有效的 http/https 链接');
    }

    // 防止重复提交相同链接（全局查重）
    const exists = await this.prisma.promotionReward.findFirst({
      where: { link: dto.link },
      select: { id: true },
    });
    if (exists) {
      throw new BadRequestException('该推广链接已被提交，请勿重复提交');
    }

    const reward = await this.prisma.promotionReward.create({
      data: {
        userId,
        platform: dto.platform,
        link: dto.link,
        likesCount: 0,
        rewardTier: 'pending',
        rewardAmount: 0,
        status: 'pending',
      },
    });

    return {
      success: true,
      message: '推广链接提交成功，等待管理员审核',
      data: {
        id: reward.id,
        platform: reward.platform,
        platformLabel: PLATFORM_LABELS[reward.platform] || reward.platform,
        link: reward.link,
        status: reward.status,
        createdAt: reward.createdAt,
      },
    };
  }

  /**
   * 获取我的推广奖励列表（分页）
   */
  async getMyRewards(userId: number, page = 1, pageSize = 20) {
    const [list, total] = await Promise.all([
      this.prisma.promotionReward.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.promotionReward.count({ where: { userId } }),
    ]);

    return {
      success: true,
      data: {
        list: list.map((r) => this.formatReward(r)),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取我的推广统计
   */
  async getMyStats(userId: number) {
    const [
      totalCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      rewardAgg,
    ] = await Promise.all([
      this.prisma.promotionReward.count({ where: { userId } }),
      this.prisma.promotionReward.count({
        where: { userId, status: 'pending' },
      }),
      this.prisma.promotionReward.count({
        where: { userId, status: 'approved' },
      }),
      this.prisma.promotionReward.count({
        where: { userId, status: 'rejected' },
      }),
      this.prisma.promotionReward.aggregate({
        where: { userId, status: 'approved' },
        _sum: { rewardAmount: true },
      }),
    ]);

    return {
      success: true,
      data: {
        totalCount,
        pendingCount,
        approvedCount,
        rejectedCount,
        totalReward: rewardAgg._sum.rewardAmount || 0,
      },
    };
  }

  /**
   * 推广活动说明
   */
  async getPromotionInfo() {
    return {
      success: true,
      data: {
        title: '分享得UU币',
        description:
          '在社交平台分享您的游戏内容，即可获得丰厚UU币奖励。点赞越多，奖励越高，层级可叠加！',
        platforms: Object.entries(PLATFORM_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
        tiers: REWARD_TIERS.map((t) => ({
          tier: t.tier,
          likesRequired: t.threshold,
          reward: t.reward,
          description: `达到 ${t.threshold} 赞，获得 ${t.reward} UU币`,
        })),
        rules: [
          '1. 在抖音、小红书、哔哩哔哩或微博分享平台内的游戏内容。',
          '2. 提交您的分享链接，等待管理员审核。',
          '3. 审核通过后，根据点赞数自动发放对应层级的UU币奖励到永久余额。',
          '4. 奖励层级可叠加：例如达到1000赞，将同时获得tier1+tier2+tier3的全部奖励。',
          '5. 每个推广链接仅可提交一次，禁止刷赞或提交虚假链接。',
          '6. UU币奖励将发放至永久余额，可用于AI对话和游戏内消费。',
        ],
        rewardExamples: [
          { likes: 10, reward: 100, tiers: ['tier1'] },
          { likes: 100, reward: 1100, tiers: ['tier1', 'tier2'] },
          { likes: 1000, reward: 11100, tiers: ['tier1', 'tier2', 'tier3'] },
        ],
        notice: '奖励发放至永久余额，最终解释权归平台所有。',
      },
    };
  }

  // ==================== 管理员端 ====================

  /**
   * 管理员获取推广奖励列表（分页、筛选）
   */
  async getPromotionList(userId: number, dto: QueryPromotionDto) {
    await this.checkAdmin(userId);

    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;

    const where: any = {};
    if (dto.platform) where.platform = dto.platform;
    if (dto.status) where.status = dto.status;
    if (dto.userId) where.userId = dto.userId;

    const [list, total] = await Promise.all([
      this.prisma.promotionReward.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.promotionReward.count({ where }),
    ]);

    return {
      success: true,
      data: {
        list: list.map((r) => ({
          ...this.formatReward(r),
          user: r.user,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 管理员审核推广链接（通过/拒绝）
   * 通过时根据点赞数计算奖励层级并自动发放UU币到用户永久余额
   */
  async reviewPromotion(
    adminId: number,
    rewardId: number,
    dto: ReviewPromotionDto,
  ) {
    await this.checkAdmin(adminId);

    const reward = await this.prisma.promotionReward.findUnique({
      where: { id: rewardId },
    });
    if (!reward) {
      throw new NotFoundException('推广记录不存在');
    }

    if (reward.status !== 'pending') {
      throw new BadRequestException('该推广记录已审核，无法重复审核');
    }

    // 拒绝：必须填写审核备注
    if (dto.status === 'rejected' && !dto.reviewNote) {
      throw new BadRequestException('拒绝时必须填写审核备注');
    }

    // 审核通过：计算奖励并发放
    if (dto.status === 'approved') {
      const likesCount =
        dto.likesCount !== undefined ? dto.likesCount : reward.likesCount;
      const { tier, amount } = this.calculateReward(likesCount);

      // 使用事务保证：更新记录 + 发放奖励 + 记录流水 + 通知 的原子性
      const updated = await this.prisma.$transaction(async (tx) => {
        const record = await tx.promotionReward.update({
          where: { id: rewardId },
          data: {
            status: 'approved',
            likesCount,
            rewardTier: tier,
            rewardAmount: amount,
            reviewNote: dto.reviewNote || null,
            reviewedAt: new Date(),
          },
        });

        // 发放UU币到永久余额
        if (amount > 0) {
          await this.addPermanentBalance(tx, reward.userId, amount);

          await tx.transactionLog.create({
            data: {
              userId: reward.userId,
              type: 'income',
              amount,
              currency: 'uu',
              description: `推广奖励（${
                PLATFORM_LABELS[reward.platform] || reward.platform
              }，${likesCount}赞，${tier}）`,
              relatedType: 'promotion',
              relatedId: rewardId,
            },
          });
        }

        await tx.notification.create({
          data: {
            userId: reward.userId,
            type: 'promotion',
            title: '推广奖励审核通过',
            content:
              amount > 0
                ? `您的推广链接已审核通过，获得 ${amount} UU币奖励（${likesCount}赞），已发放至永久余额。`
                : `您的推广链接已审核通过（${likesCount}赞），暂未达到奖励门槛。`,
          },
        });

        return record;
      });

      return {
        success: true,
        message:
          amount > 0
            ? `审核通过，已发放 ${amount} UU币奖励`
            : '审核通过，未达到奖励门槛',
        data: this.formatReward(updated),
      };
    }

    // 审核拒绝
    const updated = await this.prisma.promotionReward.update({
      where: { id: rewardId },
      data: {
        status: 'rejected',
        reviewNote: dto.reviewNote,
        reviewedAt: new Date(),
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: reward.userId,
        type: 'promotion',
        title: '推广奖励审核未通过',
        content: `您的推广链接审核未通过。原因：${dto.reviewNote}`,
      },
    });

    return {
      success: true,
      message: '已拒绝该推广链接',
      data: this.formatReward(updated),
    };
  }

  // ==================== 工具方法 ====================

  /**
   * 增加用户永久余额（不存在则创建），需在事务内执行
   */
  private async addPermanentBalance(
    tx: any,
    userId: number,
    amount: number,
  ) {
    const existing = await tx.userBalance.findUnique({
      where: { userId },
    });

    if (!existing) {
      await tx.userBalance.create({
        data: {
          userId,
          permanentBalance: amount,
          totalIncome: amount,
        },
      });
    } else {
      await tx.userBalance.update({
        where: { userId },
        data: {
          permanentBalance: { increment: amount },
          totalIncome: { increment: amount },
        },
      });
    }
  }

  /**
   * 格式化推广记录输出
   */
  private formatReward(r: any) {
    return {
      id: r.id,
      userId: r.userId,
      platform: r.platform,
      platformLabel: PLATFORM_LABELS[r.platform] || r.platform,
      link: r.link,
      likesCount: r.likesCount,
      rewardTier: r.rewardTier,
      rewardAmount: r.rewardAmount,
      status: r.status,
      reviewNote: r.reviewNote,
      reviewedAt: r.reviewedAt,
      createdAt: r.createdAt,
    };
  }

  /**
   * 校验链接是否为合法的 http/https 链接
   */
  private isValidLink(link: string): boolean {
    try {
      const url = new URL(link);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
