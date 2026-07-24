import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInGameAppDto,
  UpdateInGameAppDto,
  ReorderInGameAppDto,
  QueryInGameAppDto,
} from './dto/in-game-app.dto';

@Injectable()
export class InGameAppService {
  constructor(private prisma: PrismaService) {}

  /* ===================== 私有工具方法 ===================== */

  /**
   * 校验 config 是否为合法 JSON 字符串，并返回规范化后的字符串。
   * config 用于存储 APP 的配置（功能模块、数据源等），以 JSON 字符串形式存库。
   */
  private normalizeConfig(config?: string): string {
    if (config === undefined || config === null || config === '') {
      return '{}';
    }
    try {
      const parsed = JSON.parse(config);
      return JSON.stringify(parsed);
    } catch {
      throw new BadRequestException('config 必须是合法的 JSON 字符串');
    }
  }

  /**
   * 校验当前用户是否为指定剧本的作者。
   * 用于更新/删除/创建等仅限作者操作的接口。
   */
  private async assertScriptOwner(scriptId: number, userId: number) {
    const script = await this.prisma.script.findUnique({
      where: { id: scriptId },
      select: { id: true, authorId: true },
    });
    if (!script) {
      throw new NotFoundException('剧本不存在');
    }
    if (script.authorId !== userId) {
      throw new ForbiddenException('无权操作此剧本的内置APP');
    }
    return script;
  }

  /**
   * 根据 (scriptId, appId) 定位单条内置APP，不存在则抛出 404。
   */
  private async getAppOrThrow(scriptId: number, appId: number) {
    const app = await this.prisma.inGameApp.findFirst({
      where: { id: appId, scriptId },
    });
    if (!app) {
      throw new NotFoundException('内置APP不存在');
    }
    return app;
  }

  /* ===================== 作者管理端 ===================== */

  /**
   * 获取剧本的所有内置APP列表（作者管理视图，包含未激活的APP）。
   * 支持按 appType 过滤。
   */
  async listByScript(scriptId: number, dto: QueryInGameAppDto) {
    const script = await this.prisma.script.findUnique({
      where: { id: scriptId },
      select: { id: true },
    });
    if (!script) {
      throw new NotFoundException('剧本不存在');
    }

    const where: any = { scriptId };
    if (dto.appType) {
      where.appType = dto.appType;
    }

    const items = await this.prisma.inGameApp.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    return { success: true, data: items };
  }

  /**
   * 获取单个内置APP详情。
   */
  async findOne(scriptId: number, appId: number) {
    const app = await this.getAppOrThrow(scriptId, appId);
    return { success: true, data: app };
  }

  /**
   * 为剧本创建内置APP（仅作者）。
   * - 未指定 sortOrder 时自动追加到末尾。
   * - config 会做 JSON 合法性校验并规范化。
   */
  async create(scriptId: number, userId: number, dto: CreateInGameAppDto) {
    await this.assertScriptOwner(scriptId, userId);

    // 自动计算排序：未指定时放到末尾
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined) {
      const last = await this.prisma.inGameApp.findFirst({
        where: { scriptId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
      sortOrder = last ? last.sortOrder + 1 : 0;
    }

    const app = await this.prisma.inGameApp.create({
      data: {
        scriptId,
        name: dto.name,
        icon: dto.icon ?? '📱',
        description: dto.description ?? '',
        appType: dto.appType ?? 'utility',
        config: this.normalizeConfig(dto.config),
        sortOrder,
        isActive: dto.isActive ?? true,
      },
    });

    return { success: true, data: app };
  }

  /**
   * 更新内置APP（仅作者）。
   * 仅更新 DTO 中显式提供的字段。
   */
  async update(
    scriptId: number,
    appId: number,
    userId: number,
    dto: UpdateInGameAppDto,
  ) {
    await this.assertScriptOwner(scriptId, userId);
    await this.getAppOrThrow(scriptId, appId);

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.appType !== undefined) data.appType = dto.appType;
    if (dto.config !== undefined) data.config = this.normalizeConfig(dto.config);
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const updated = await this.prisma.inGameApp.update({
      where: { id: appId },
      data,
    });

    return { success: true, data: updated };
  }

  /**
   * 删除内置APP（仅作者）。
   */
  async remove(scriptId: number, appId: number, userId: number) {
    await this.assertScriptOwner(scriptId, userId);
    await this.getAppOrThrow(scriptId, appId);

    await this.prisma.inGameApp.delete({ where: { id: appId } });
    return { success: true, message: '内置APP已删除' };
  }

  /**
   * 批量更新内置APP排序（仅作者）。
   * 接收一个 [{ id, sortOrder }] 数组，在事务中统一更新。
   */
  async reorder(scriptId: number, userId: number, dto: ReorderInGameAppDto) {
    await this.assertScriptOwner(scriptId, userId);

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('排序项不能为空');
    }

    // 校验所有 APP 都属于该剧本
    const ids = dto.items.map((i) => i.id);
    const owned = await this.prisma.inGameApp.findMany({
      where: { id: { in: ids }, scriptId },
      select: { id: true },
    });
    if (owned.length !== ids.length) {
      throw new BadRequestException('存在不属于该剧本的内置APP');
    }

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.inGameApp.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    const items = await this.prisma.inGameApp.findMany({
      where: { scriptId },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    return { success: true, data: items };
  }

  /* ===================== 玩家端（游戏中获取APP数据） ===================== */

  /**
   * 游戏中获取APP数据（玩家可访问）。
   * 仅返回该剧本下 isActive=true 的内置APP，按 sortOrder 升序排列。
   * 可选按 appType 过滤。
   */
  async listForPlayer(scriptId: number, appType?: string) {
    const script = await this.prisma.script.findUnique({
      where: { id: scriptId },
      select: { id: true },
    });
    if (!script) {
      throw new NotFoundException('剧本不存在');
    }

    const where: any = { scriptId, isActive: true };
    if (appType) {
      where.appType = appType;
    }

    const items = await this.prisma.inGameApp.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        icon: true,
        description: true,
        appType: true,
        config: true,
        sortOrder: true,
      },
    });

    return { success: true, data: items };
  }
}
