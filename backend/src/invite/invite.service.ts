import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BindInviteDto } from './dto/invite.dto';

// 邀请奖励配置
const INVITER_REWARD = 50; // 邀请人奖励 UU币
const INVITEE_REWARD = 30; // 被邀请人奖励 UU币

@Injectable()
export class InviteService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取我的邀请码和邀请统计
   */
  async getMyCode(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, inviteCode: true, invitedBy: true },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 已邀请人数
    const invitedCount = await this.prisma.invitation.count({
      where: { inviterId: userId },
    });

    // 已获得奖励总额（邀请相关的 income 记录）
    const rewardAgg = await this.prisma.transactionLog.aggregate({
      where: {
        userId,
        type: 'income',
        relatedType: 'invite',
      },
      _sum: { amount: true },
    });

    return {
      success: true,
      data: {
        inviteCode: user.inviteCode,
        invitedBy: user.invitedBy,
        invitedCount,
        totalReward: rewardAgg._sum.amount || 0,
      },
    };
  }

  /**
   * 我邀请的用户列表（分页）
   */
  async getMyInvitations(userId: number, page = 1, pageSize = 20) {
    const [list, total] = await Promise.all([
      this.prisma.invitation.findMany({
        where: { inviterId: userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          invitee: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              level: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.invitation.count({ where: { inviterId: userId } }),
    ]);

    return {
      success: true,
      data: {
        list: list.map((inv) => ({
          id: inv.id,
          code: inv.code,
          inviterRewardGranted: inv.inviterRewardGranted,
          inviteeRewardGranted: inv.inviteeRewardGranted,
          createdAt: inv.createdAt,
          invitee: inv.invitee,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 绑定邀请人（注册后可补绑，只能绑一次）
   */
  async bindInviter(userId: number, dto: BindInviteDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, invitedBy: true },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查是否已绑定过邀请人
    if (user.invitedBy) {
      throw new BadRequestException('您已绑定过邀请人，无法重复绑定');
    }

    // 检查邀请码是否存在
    const inviter = await this.prisma.user.findUnique({
      where: { inviteCode: dto.inviteCode },
      select: { id: true, nickname: true, inviteCode: true },
    });

    if (!inviter) {
      throw new BadRequestException('邀请码不存在');
    }

    // 不能自己邀请自己
    if (inviter.id === userId) {
      throw new BadRequestException('不能邀请自己');
    }

    // 更新被邀请人的 invitedBy
    await this.prisma.user.update({
      where: { id: userId },
      data: { invitedBy: inviter.id },
    });

    // 创建 Invitation 记录，并直接发放奖励
    const invitation = await this.prisma.invitation.create({
      data: {
        inviterId: inviter.id,
        inviteeId: userId,
        code: dto.inviteCode,
        inviterRewardGranted: true,
        inviteeRewardGranted: true,
      },
    });

    // 给邀请人奖励 50 UU币（永久余额）
    await this.addPermanentBalance(inviter.id, INVITER_REWARD);

    // 给被邀请人奖励 30 UU币（永久余额）
    await this.addPermanentBalance(userId, INVITEE_REWARD);

    // 创建两条 TransactionLog（income 类型）
    await this.prisma.transactionLog.create({
      data: {
        userId: inviter.id,
        type: 'income',
        amount: INVITER_REWARD,
        currency: 'uu',
        description: `邀请用户奖励（邀请码：${dto.inviteCode}）`,
        relatedType: 'invite',
        relatedId: invitation.id,
      },
    });

    await this.prisma.transactionLog.create({
      data: {
        userId,
        type: 'income',
        amount: INVITEE_REWARD,
        currency: 'uu',
        description: `被邀请注册奖励（邀请人：${inviter.nickname}）`,
        relatedType: 'invite',
        relatedId: invitation.id,
      },
    });

    // 创建 Notification 通知邀请人
    await this.prisma.notification.create({
      data: {
        userId: inviter.id,
        type: 'invite',
        title: '新的邀请奖励',
        content: `您邀请的用户已注册成功，获得 ${INVITER_REWARD} UU币奖励`,
      },
    });

    return {
      success: true,
      message: `绑定成功，您获得 ${INVITEE_REWARD} UU币奖励`,
      data: {
        inviterReward: INVITER_REWARD,
        inviteeReward: INVITEE_REWARD,
      },
    };
  }

  /**
   * 邀请奖励规则说明
   */
  async getRewards() {
    return {
      success: true,
      data: {
        rules: [
          {
            level: 1,
            title: '注册奖励',
            inviterReward: INVITER_REWARD,
            inviteeReward: INVITEE_REWARD,
            description: `每邀请1人注册，邀请人获得 ${INVITER_REWARD} UU币，被邀请人获得 ${INVITEE_REWARD} UU币`,
          },
          {
            level: 2,
            title: '充值返利',
            description: '被邀请人首次充值，邀请人额外获得充值金额 10% 的奖励',
          },
          {
            level: 3,
            title: '创作奖励',
            description: '被邀请人发布剧本，邀请人获得 20 UU币创作奖励',
          },
        ],
        notice: '邀请奖励将发放至永久余额，被邀请人仅可绑定一次邀请人。',
      },
    };
  }

  /**
   * 邀请排行榜（按邀请人数降序，取前20名）
   */
  async getLeaderboard() {
    const grouped = await this.prisma.invitation.groupBy({
      by: ['inviterId'],
      _count: { inviteeId: true },
      orderBy: {
        _count: { inviteeId: 'desc' },
      },
      take: 20,
    });

    if (grouped.length === 0) {
      return { success: true, data: { list: [] } };
    }

    const inviterIds = grouped.map((g) => g.inviterId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: inviterIds } },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        level: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    const list = grouped.map((g) => {
      const u = userMap.get(g.inviterId);
      return {
        userId: g.inviterId,
        nickname: u?.nickname || '匿名用户',
        avatar: u?.avatar || null,
        level: u?.level || 1,
        invitedCount: g._count.inviteeId,
      };
    });

    return { success: true, data: { list } };
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
