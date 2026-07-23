import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  QueryUsersDto,
  UpdateUserStatusDto,
  UpdateUserRoleDto,
  AdjustUserBalanceDto,
  QueryScriptsDto,
  UpdateScriptStatusDto,
  ToggleFeaturedDto,
  CreateModelDto,
  UpdateModelDto,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  CreateRedemptionCodeDto,
  QueryTransactionsDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
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

  // ==================== 仪表盘统计 ====================

  /**
   * 获取仪表盘统计数据
   */
  async getDashboard(userId: number) {
    await this.checkAdmin(userId);

    // 今日零点时间
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      todayNewUsers,
      totalScripts,
      todayPlayCount,
      totalTransactionsAmount,
      totalUUCirculation,
    ] = await Promise.all([
      // 总用户数
      this.prisma.user.count(),
      // 今日新增用户
      this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      // 总剧本数
      this.prisma.script.count(),
      // 今日游玩次数
      this.prisma.gameSession.count({ where: { createdAt: { gte: todayStart } } }),
      // 总交易额（人民币）
      this.prisma.paymentOrder.aggregate({
        where: { status: 'success' },
        _sum: { amount: true },
      }),
      // 总UU币流通量
      this.prisma.userBalance.aggregate({
        _sum: { permanentBalance: true, tempBalance: true },
      }),
    ]);

    return {
      success: true,
      data: {
        totalUsers,
        todayNewUsers,
        totalScripts,
        todayPlayCount,
        totalTransactionsAmount: totalTransactionsAmount._sum.amount || 0,
        totalUUCirculation:
          (totalUUCirculation._sum.permanentBalance || 0) +
          (totalUUCirculation._sum.tempBalance || 0),
      },
    };
  }

  // ==================== 用户管理 ====================

  /**
   * 获取用户列表（分页、搜索、状态筛选）
   */
  async getUsers(userId: number, dto: QueryUsersDto) {
    await this.checkAdmin(userId);

    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    if (dto.status) {
      where.status = dto.status;
    }
    if (dto.keyword) {
      where.OR = [
        { nickname: { contains: dto.keyword } },
        { email: { contains: dto.keyword } },
        { phone: { contains: dto.keyword } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          nickname: true,
          email: true,
          phone: true,
          avatar: true,
          role: true,
          status: true,
          level: true,
          createdAt: true,
          balance: {
            select: {
              permanentBalance: true,
              tempBalance: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: { items, total, page, limit },
    };
  }

  /**
   * 修改用户状态
   */
  async updateUserStatus(userId: number, targetId: number, dto: UpdateUserStatusDto) {
    await this.checkAdmin(userId);

    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.prisma.user.update({
      where: { id: targetId },
      data: { status: dto.status },
    });

    return { success: true, message: `用户状态已更新为 ${dto.status}` };
  }

  /**
   * 修改用户角色
   */
  async updateUserRole(userId: number, targetId: number, dto: UpdateUserRoleDto) {
    await this.checkAdmin(userId);

    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 不允许修改自己的角色
    if (userId === targetId) {
      throw new BadRequestException('不能修改自己的角色');
    }

    await this.prisma.user.update({
      where: { id: targetId },
      data: { role: dto.role },
    });

    return { success: true, message: `用户角色已更新为 ${dto.role}` };
  }

  /**
   * 调整用户余额（管理员赠送/扣除UU币）
   */
  async adjustUserBalance(userId: number, targetId: number, dto: AdjustUserBalanceDto) {
    await this.checkAdmin(userId);

    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 确保用户有余额记录
    const existingBalance = await this.prisma.userBalance.findUnique({
      where: { userId: targetId },
    });

    if (!existingBalance) {
      // 如果没有余额记录，只有赠送（正数）时才创建
      if (dto.amount < 0) {
        throw new BadRequestException('用户余额不足，无法扣除');
      }
      await this.prisma.userBalance.create({
        data: { userId: targetId, permanentBalance: dto.amount },
      });
    } else {
      // 检查余额是否足够（扣除时）
      const totalBalance =
        existingBalance.permanentBalance + existingBalance.tempBalance;
      if (dto.amount < 0 && totalBalance + dto.amount < 0) {
        throw new BadRequestException('用户余额不足，无法扣除');
      }

      await this.prisma.userBalance.update({
        where: { userId: targetId },
        data: { permanentBalance: { increment: dto.amount } },
      });
    }

    // 创建交易记录
    await this.prisma.transactionLog.create({
      data: {
        userId: targetId,
        type: dto.amount > 0 ? 'income' : 'spend',
        amount: Math.abs(dto.amount),
        currency: 'uu',
        description: `管理员${dto.amount > 0 ? '赠送' : '扣除'} ${Math.abs(dto.amount)} UU币`,
        relatedType: 'payment',
        relatedId: userId,
      },
    });

    // 返回最新余额
    const updatedBalance = await this.prisma.userBalance.findUnique({
      where: { userId: targetId },
    });

    return {
      success: true,
      message: `已${dto.amount > 0 ? '赠送' : '扣除'} ${Math.abs(dto.amount)} UU币`,
      data: {
        newBalance: updatedBalance
          ? updatedBalance.permanentBalance + updatedBalance.tempBalance
          : 0,
      },
    };
  }

  /**
   * 获取用户详情（含余额、交易记录）
   */
  async getUserDetail(adminUserId: number, targetId: number) {
    await this.checkAdmin(adminUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        nickname: true,
        email: true,
        phone: true,
        avatar: true,
        bio: true,
        level: true,
        role: true,
        status: true,
        inviteCode: true,
        createdAt: true,
        balance: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 获取交易记录（最近20条）
    const transactions = await this.prisma.transactionLog.findMany({
      where: { userId: targetId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // 统计数据
    const scriptCount = await this.prisma.script.count({
      where: { authorId: targetId },
    });
    const sessionCount = await this.prisma.gameSession.count({
      where: { userId: targetId },
    });

    return {
      success: true,
      data: {
        ...user,
        scriptCount,
        sessionCount,
        transactions,
      },
    };
  }

  // ==================== 剧本管理 ====================

  /**
   * 获取剧本列表（分页、状态筛选、搜索）
   */
  async getScripts(userId: number, dto: QueryScriptsDto) {
    await this.checkAdmin(userId);

    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    if (dto.status) {
      where.status = dto.status;
    }
    if (dto.keyword) {
      where.title = { contains: dto.keyword };
    }

    const [items, total] = await Promise.all([
      this.prisma.script.findMany({
        where,
        include: {
          author: {
            select: { id: true, nickname: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.script.count({ where }),
    ]);

    return {
      success: true,
      data: { items, total, page, limit },
    };
  }

  /**
   * 审核剧本
   */
  async updateScriptStatus(userId: number, scriptId: number, dto: UpdateScriptStatusDto) {
    await this.checkAdmin(userId);

    const script = await this.prisma.script.findUnique({ where: { id: scriptId } });
    if (!script) {
      throw new NotFoundException('剧本不存在');
    }

    // 如果是拒绝状态，必须提供拒绝理由
    if (dto.status === 'rejected' && !dto.rejectionReason) {
      throw new BadRequestException('拒绝剧本时必须提供拒绝理由');
    }

    await this.prisma.script.update({
      where: { id: scriptId },
      data: {
        status: dto.status,
        ...(dto.rejectionReason && { rejectionReason: dto.rejectionReason }),
      },
    });

    return { success: true, message: `剧本已${dto.status === 'published' ? '通过审核' : '被拒绝'}` };
  }

  /**
   * 设为精选/取消精选
   */
  async toggleFeatured(userId: number, scriptId: number, dto: ToggleFeaturedDto) {
    await this.checkAdmin(userId);

    const script = await this.prisma.script.findUnique({ where: { id: scriptId } });
    if (!script) {
      throw new NotFoundException('剧本不存在');
    }

    // 使用 description 字段暂存精选标记（SQLite无专门字段）
    // 实际项目中建议在 schema 中添加 featured 字段
    await this.prisma.script.update({
      where: { id: scriptId },
      data: { desc: dto.featured ? '[FEATURED]' : '' },
    });

    return {
      success: true,
      message: dto.featured ? '已设为精选' : '已取消精选',
    };
  }

  /**
   * 删除剧本（软删除/归档）
   */
  async deleteScript(userId: number, scriptId: number) {
    await this.checkAdmin(userId);

    const script = await this.prisma.script.findUnique({ where: { id: scriptId } });
    if (!script) {
      throw new NotFoundException('剧本不存在');
    }

    // 软删除：将状态设为 archived
    await this.prisma.script.update({
      where: { id: scriptId },
      data: { status: 'archived' },
    });

    return { success: true, message: '剧本已归档（软删除）' };
  }

  /**
   * 强制删除剧本（硬删除）
   */
  async forceDeleteScript(userId: number, scriptId: number) {
    await this.checkAdmin(userId);

    const script = await this.prisma.script.findUnique({ where: { id: scriptId } });
    if (!script) {
      throw new NotFoundException('剧本不存在');
    }

    // 先删除关联数据（ScriptNode, ScriptNpc, ScriptAttribute 有 onDelete: Cascade，会自动删除）
    // 但 GameSession 没有级联删除，需要手动处理
    await this.prisma.gameSession.deleteMany({
      where: { scriptId },
    });

    // 删除相关评论和收藏
    await this.prisma.comment.deleteMany({
      where: { targetType: 'script', targetId: scriptId },
    });
    await this.prisma.favorite.deleteMany({
      where: { targetType: 'script', targetId: scriptId },
    });

    // 最后删除剧本本身（级联删除 ScriptNode, ScriptNpc, ScriptAttribute）
    await this.prisma.script.delete({
      where: { id: scriptId },
    });

    return { success: true, message: '剧本已强制删除' };
  }

  // ==================== 模型管理 ====================

  /**
   * 获取所有AI模型列表
   */
  async getModels(userId: number) {
    await this.checkAdmin(userId);

    const models = await this.prisma.aiModel.findMany({
      orderBy: { id: 'asc' },
    });

    return {
      success: true,
      data: models,
    };
  }

  /**
   * 创建AI模型配置
   */
  async createModel(userId: number, dto: CreateModelDto) {
    await this.checkAdmin(userId);

    // 检查名称是否已存在
    const existing = await this.prisma.aiModel.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new BadRequestException('模型名称已存在');
    }

    const model = await this.prisma.aiModel.create({
      data: {
        name: dto.name,
        displayName: dto.displayName,
        rate: dto.rate ?? 1.0,
        backendModel: dto.backendModel,
        multimodal: dto.multimodal ?? false,
        maxTokens: dto.maxTokens ?? 4096,
      },
    });

    return { success: true, data: model, message: '模型创建成功' };
  }

  /**
   * 更新模型配置
   */
  async updateModel(userId: number, modelId: number, dto: UpdateModelDto) {
    await this.checkAdmin(userId);

    const model = await this.prisma.aiModel.findUnique({ where: { id: modelId } });
    if (!model) {
      throw new NotFoundException('模型不存在');
    }

    const updateData: any = {};
    if (dto.displayName !== undefined) updateData.displayName = dto.displayName;
    if (dto.rate !== undefined) updateData.rate = dto.rate;
    if (dto.backendModel !== undefined) updateData.backendModel = dto.backendModel;
    if (dto.multimodal !== undefined) updateData.multimodal = dto.multimodal;
    if (dto.maxTokens !== undefined) updateData.maxTokens = dto.maxTokens;

    const updated = await this.prisma.aiModel.update({
      where: { id: modelId },
      data: updateData,
    });

    return { success: true, data: updated, message: '模型更新成功' };
  }

  /**
   * 删除模型
   */
  async deleteModel(userId: number, modelId: number) {
    await this.checkAdmin(userId);

    const model = await this.prisma.aiModel.findUnique({ where: { id: modelId } });
    if (!model) {
      throw new NotFoundException('模型不存在');
    }

    await this.prisma.aiModel.delete({
      where: { id: modelId },
    });

    return { success: true, message: '模型已删除' };
  }

  /**
   * 启用/禁用模型
   */
  async toggleModel(userId: number, modelId: number) {
    await this.checkAdmin(userId);

    const model = await this.prisma.aiModel.findUnique({ where: { id: modelId } });
    if (!model) {
      throw new NotFoundException('模型不存在');
    }

    const updated = await this.prisma.aiModel.update({
      where: { id: modelId },
      data: { isActive: !model.isActive },
    });

    return {
      success: true,
      data: updated,
      message: updated.isActive ? '模型已启用' : '模型已禁用',
    };
  }

  // ==================== 公告管理 ====================

  /**
   * 获取公告列表
   */
  async getAnnouncements(userId: number) {
    await this.checkAdmin(userId);

    const announcements = await this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: announcements,
    };
  }

  /**
   * 创建公告
   */
  async createAnnouncement(userId: number, dto: CreateAnnouncementDto) {
    await this.checkAdmin(userId);

    const announcement = await this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        type: dto.type || 'normal',
      },
    });

    return { success: true, data: announcement, message: '公告创建成功' };
  }

  /**
   * 更新公告
   */
  async updateAnnouncement(userId: number, announcementId: number, dto: UpdateAnnouncementDto) {
    await this.checkAdmin(userId);

    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });
    if (!announcement) {
      throw new NotFoundException('公告不存在');
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.type !== undefined) updateData.type = dto.type;

    const updated = await this.prisma.announcement.update({
      where: { id: announcementId },
      data: updateData,
    });

    return { success: true, data: updated, message: '公告更新成功' };
  }

  /**
   * 删除公告
   */
  async deleteAnnouncement(userId: number, announcementId: number) {
    await this.checkAdmin(userId);

    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });
    if (!announcement) {
      throw new NotFoundException('公告不存在');
    }

    await this.prisma.announcement.delete({
      where: { id: announcementId },
    });

    return { success: true, message: '公告已删除' };
  }

  // ==================== 兑换码管理 ====================

  /**
   * 获取兑换码列表
   */
  async getCodes(userId: number) {
    await this.checkAdmin(userId);

    const codes = await this.prisma.redemptionCode.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: codes,
    };
  }

  /**
   * 创建兑换码
   */
  async createCode(userId: number, dto: CreateRedemptionCodeDto) {
    await this.checkAdmin(userId);

    // 检查兑换码是否已存在
    const existing = await this.prisma.redemptionCode.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestException('兑换码已存在');
    }

    const code = await this.prisma.redemptionCode.create({
      data: {
        code: dto.code,
        uuAmount: dto.uuAmount,
        maxUses: dto.maxUses ?? 1,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    return { success: true, data: code, message: '兑换码创建成功' };
  }

  /**
   * 删除兑换码
   */
  async deleteCode(userId: number, codeId: number) {
    await this.checkAdmin(userId);

    const code = await this.prisma.redemptionCode.findUnique({
      where: { id: codeId },
    });
    if (!code) {
      throw new NotFoundException('兑换码不存在');
    }

    await this.prisma.redemptionCode.delete({
      where: { id: codeId },
    });

    return { success: true, message: '兑换码已删除' };
  }

  // ==================== 交易记录 ====================

  /**
   * 获取交易记录列表
   */
  async getTransactions(userId: number, dto: QueryTransactionsDto) {
    await this.checkAdmin(userId);

    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    if (dto.userId) {
      where.userId = dto.userId;
    }
    if (dto.type) {
      where.type = dto.type;
    }

    const [items, total] = await Promise.all([
      this.prisma.transactionLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, nickname: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transactionLog.count({ where }),
    ]);

    return {
      success: true,
      data: { items, total, page, limit },
    };
  }
}
