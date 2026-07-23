import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { encrypt, decrypt, maskApiKey } from '../lib/crypto.util';
import {
  UpdateProfileDto,
  AddCustomAiDto,
  UpdateCustomAiDto,
  RechargeDto,
  RedeemDto,
  QueryTransactionsDto,
} from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: number) {
    const balance = await this.prisma.userBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      const newBalance = await this.prisma.userBalance.create({
        data: { userId },
      });
      return { success: true, data: newBalance };
    }

    return { success: true, data: balance };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.nickname !== undefined && { nickname: dto.nickname }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
      },
    });

    const { passwordHash, ...result } = user;
    return { success: true, data: result };
  }

  async addCustomAi(userId: number, dto: AddCustomAiDto) {
    const { encrypted, iv } = encrypt(dto.apiKey);

    const config = await this.prisma.userApiConfig.create({
      data: {
        userId,
        provider: dto.provider,
        baseUrl: dto.baseUrl,
        encryptedKey: encrypted,
        iv,
        model: dto.model || '',
      },
    });

    return {
      success: true,
      data: {
        ...config,
        encryptedKey: maskApiKey(dto.apiKey),
      },
    };
  }

  async getCustomAiList(userId: number) {
    const configs = await this.prisma.userApiConfig.findMany({
      where: { userId },
      orderBy: { priority: 'desc' },
    });

    return {
      success: true,
      data: configs.map((c) => ({
        ...c,
        encryptedKey: c.iv ? maskApiKey(decrypt(c.encryptedKey, c.iv)) : '****',
      })),
    };
  }

  async updateCustomAi(userId: number, id: number, dto: UpdateCustomAiDto) {
    const config = await this.prisma.userApiConfig.findUnique({
      where: { id },
    });

    if (!config || config.userId !== userId) {
      throw new NotFoundException('自定义API配置不存在');
    }

    const updateData: any = {};
    if (dto.provider !== undefined) updateData.provider = dto.provider;
    if (dto.baseUrl !== undefined) updateData.baseUrl = dto.baseUrl;
    if (dto.model !== undefined) updateData.model = dto.model;
    if (dto.apiKey !== undefined) {
      const { encrypted, iv } = encrypt(dto.apiKey);
      updateData.encryptedKey = encrypted;
      updateData.iv = iv;
    }

    const updated = await this.prisma.userApiConfig.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      data: {
        ...updated,
        encryptedKey: updated.iv ? maskApiKey(decrypt(updated.encryptedKey, updated.iv)) : '****',
      },
    };
  }

  async deleteCustomAi(userId: number, id: number) {
    const config = await this.prisma.userApiConfig.findUnique({
      where: { id },
    });

    if (!config || config.userId !== userId) {
      throw new NotFoundException('自定义API配置不存在');
    }

    await this.prisma.userApiConfig.delete({
      where: { id },
    });

    return { success: true, message: '删除成功' };
  }

  async testCustomApi(userId: number, id: number) {
    const config = await this.prisma.userApiConfig.findUnique({
      where: { id },
    });

    if (!config || config.userId !== userId) {
      throw new NotFoundException('自定义API配置不存在');
    }

    try {
      const apiKey = config.iv ? decrypt(config.encryptedKey, config.iv) : '';
      const response = await fetch(`${config.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        return { success: true, message: '连接成功' };
      }
      return { success: false, message: `连接失败: ${response.status}` };
    } catch {
      return { success: false, message: '连接失败: 网络错误' };
    }
  }

  async setDefaultCustomAi(userId: number, id: number) {
    const config = await this.prisma.userApiConfig.findUnique({
      where: { id },
    });

    if (!config || config.userId !== userId) {
      throw new NotFoundException('自定义API配置不存在');
    }

    // Set all other configs to lower priority
    await this.prisma.userApiConfig.updateMany({
      where: { userId },
      data: { priority: 0 },
    });

    // Set this one as default (highest priority)
    await this.prisma.userApiConfig.update({
      where: { id },
      data: { priority: 100 },
    });

    return { success: true, message: '已设为默认' };
  }

  async redeem(userId: number, code: string) {
    const dto = { code };
    return this._redeem(userId, dto);
  }

  async _redeem(userId: number, dto: RedeemDto) {
    const codeRecord = await this.prisma.redemptionCode.findUnique({
      where: { code: dto.code },
    });

    if (!codeRecord) {
      return { success: false, message: '兑换码不存在' };
    }

    if (codeRecord.expiresAt && codeRecord.expiresAt < new Date()) {
      return { success: false, message: '兑换码已过期' };
    }

    if (codeRecord.currentUses >= codeRecord.maxUses) {
      return { success: false, message: '兑换码已被使用' };
    }

    const existingBalance = await this.prisma.userBalance.findUnique({
      where: { userId },
    });

    if (!existingBalance) {
      await this.prisma.userBalance.create({
        data: {
          userId,
          permanentBalance: codeRecord.uuAmount,
        },
      });
    } else {
      await this.prisma.userBalance.update({
        where: { userId },
        data: { permanentBalance: { increment: codeRecord.uuAmount } },
      });
    }

    await this.prisma.redemptionCode.update({
      where: { id: codeRecord.id },
      data: { currentUses: { increment: 1 } },
    });

    await this.prisma.transactionLog.create({
      data: {
        userId,
        type: 'redeem',
        amount: codeRecord.uuAmount,
        currency: 'uu',
        description: `兑换码 ${dto.code} 兑换 ${codeRecord.uuAmount} UU币`,
        relatedType: 'payment',
      },
    });

    const updatedBalance = await this.prisma.userBalance.findUnique({
      where: { userId },
    });

    return {
      success: true,
      message: `兑换成功，获得 ${codeRecord.uuAmount} UU币`,
      data: {
        newBalance: updatedBalance
          ? updatedBalance.permanentBalance + updatedBalance.tempBalance
          : 0,
      },
    };
  }

  async recharge(userId: number, dto: RechargeDto) {
    const uuAmount = dto.uuAmount || Math.floor(dto.amount * 10);

    const existingBalance = await this.prisma.userBalance.findUnique({
      where: { userId },
    });

    let newBalance;
    if (!existingBalance) {
      newBalance = await this.prisma.userBalance.create({
        data: {
          userId,
          permanentBalance: uuAmount,
        },
      });
    } else {
      newBalance = await this.prisma.userBalance.update({
        where: { userId },
        data: { permanentBalance: { increment: uuAmount } },
      });
    }

    const orderNo = `DEV_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await this.prisma.paymentOrder.create({
      data: {
        orderNo,
        userId,
        amount: dto.amount,
        uuAmount,
        paymentMethod: dto.paymentMethod || 'dev',
        status: 'success',
      },
    });

    await this.prisma.transactionLog.create({
      data: {
        userId,
        type: 'recharge',
        amount: uuAmount,
        currency: 'uu',
        description: `充值 ${dto.amount} 元`,
        relatedType: 'payment',
      },
    });

    return {
      success: true,
      data: {
        newBalance: newBalance.permanentBalance + newBalance.tempBalance,
        uuAmount,
      },
    };
  }

  async getTransactions(userId: number, dto: QueryTransactionsDto) {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;

    const where: any = { userId };
    if (dto.type) {
      where.type = dto.type;
    }

    const [list, total] = await Promise.all([
      this.prisma.transactionLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.transactionLog.count({ where }),
    ]);

    return {
      success: true,
      data: {
        list,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getUserProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        bio: true,
        level: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    const scriptCount = await this.prisma.script.count({
      where: { authorId: userId, status: 'published' },
    });

    const followerCount = await this.prisma.follow.count({
      where: { followingId: userId },
    });

    const followingCount = await this.prisma.follow.count({
      where: { followerId: userId },
    });

    return {
      success: true,
      data: {
        ...user,
        scriptCount,
        followerCount,
        followingCount,
      },
    };
  }

  async getFollowers(userId: number, page = 1, pageSize = 20) {
    const follows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await this.prisma.follow.count({
      where: { followingId: userId },
    });

    return {
      success: true,
      data: {
        list: follows.map((f) => f.follower),
        total,
        page,
        pageSize,
      },
    };
  }

  async getFollowing(userId: number, page = 1, pageSize = 20) {
    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await this.prisma.follow.count({
      where: { followerId: userId },
    });

    return {
      success: true,
      data: {
        list: follows.map((f) => f.following),
        total,
        page,
        pageSize,
      },
    };
  }
}
