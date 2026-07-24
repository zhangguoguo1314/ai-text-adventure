import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  QueryTemplateDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  RateTemplateDto,
} from './dto/templates.dto';

/* ===== 模板内部 JSON 结构 ===== */
interface NpcTemplateItem {
  name: string;
  personality?: string;
}
interface AttrTemplateItem {
  name: string;
  type?: string;
  defaultVal?: string;
  minVal?: number;
  maxVal?: number;
}
interface NodeTemplateItem {
  type?: string;
  content?: string;
  choices?: Array<{ text: string; nextNodeId?: number | null }>;
}

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  /* ===== 列表（分页 + 分类筛选 + 排序） ===== */
  async list(dto: QueryTemplateDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (dto.category && dto.category !== 'all') {
      where.category = dto.category;
    }

    if (dto.keyword) {
      where.name = { contains: dto.keyword };
    }

    const sort = dto.sort || 'hot';
    let orderBy: any;
    switch (sort) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'rating':
        orderBy = [{ rating: 'desc' }, { useCount: 'desc' }];
        break;
      case 'hot':
      default:
        orderBy = [{ useCount: 'desc' }, { createdAt: 'desc' }];
        break;
    }

    const [items, total] = await Promise.all([
      this.prisma.scriptTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.scriptTemplate.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items: items.map((t) => this.parseJsonFields(t)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /* ===== 详情（解析 JSON 字段） ===== */
  async findOne(id: number) {
    const template = await this.prisma.scriptTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return { success: false, message: '模板不存在' };
    }

    return { success: true, data: this.parseJsonFields(template) };
  }

  /* ===== 应用模板创建剧本 ===== */
  async apply(id: number, userId: number) {
    const template = await this.prisma.scriptTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('模板不存在');
    }

    const npcs = this.safeParse<NpcTemplateItem[]>(template.npcTemplate, []);
    const attrs = this.safeParse<AttrTemplateItem[]>(
      template.attrTemplate,
      [],
    );
    const nodes = this.safeParse<NodeTemplateItem[]>(
      template.nodeTemplate,
      [],
    );

    // title 从模板名生成
    const title = `${template.name} - 我的剧本`;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. 创建 Script（含 charConfig、narrativeRules、tags 等扩展字段）
      const script = await tx.script.create({
        data: {
          authorId: userId,
          title,
          desc: template.description || '',
          category: template.category || 'adventure',
          worldSetting: template.worldSetting || '',
          status: 'draft',
          // 传递模板的 charConfig 到剧本（对标UU角色创建配置）
          charConfig: template.charConfig || '{}',
          // stylePrompt 作为叙事规则
          narrativeRules: template.stylePrompt || '',
          // 传递模板标签
          tags: template.tags || '[]',
        },
      });

      // 2. 批量创建 ScriptNpc
      if (npcs.length > 0) {
        await tx.scriptNpc.createMany({
          data: npcs.map((npc, index) => ({
            scriptId: script.id,
            name: npc.name || `NPC${index + 1}`,
            personality: npc.personality || '',
            sortOrder: index,
          })),
        });
      }

      // 3. 批量创建 ScriptAttribute
      if (attrs.length > 0) {
        await tx.scriptAttribute.createMany({
          data: attrs.map((attr) => ({
            scriptId: script.id,
            name: attr.name || '',
            type: attr.type || 'number',
            minVal: attr.minVal ?? null,
            maxVal: attr.maxVal ?? null,
            defaultVal: attr.defaultVal ?? null,
          })),
        });
      }

      // 4. 批量创建 ScriptNode
      if (nodes.length > 0) {
        await tx.scriptNode.createMany({
          data: nodes.map((node, index) => ({
            scriptId: script.id,
            type: node.type || 'scene',
            content: node.content || '',
            choices: node.choices ? JSON.stringify(node.choices) : null,
            posX: 100 + index * 40,
            posY: 100 + index * 40,
          })),
        });
      }

      // 5. 模板使用次数 +1
      await tx.scriptTemplate.update({
        where: { id },
        data: { useCount: { increment: 1 } },
      });

      return script;
    });

    return { success: true, data: { scriptId: result.id, title: result.title } };
  }

  /* ===== 从剧本生成模板 ===== */
  async create(userId: number, dto: CreateTemplateDto) {
    const script = await this.prisma.script.findUnique({
      where: { id: dto.scriptId },
      include: {
        npcs: { orderBy: { sortOrder: 'asc' } },
        attributes: true,
        nodes: { orderBy: { id: 'asc' } },
      },
    });

    if (!script) {
      throw new NotFoundException('剧本不存在');
    }

    if (script.authorId !== userId) {
      throw new ForbiddenException('无权使用此剧本生成模板');
    }

    // 序列化为 JSON
    const npcTemplate: NpcTemplateItem[] = script.npcs.map((n) => ({
      name: n.name,
      personality: n.personality,
    }));

    const attrTemplate: AttrTemplateItem[] = script.attributes.map((a) => ({
      name: a.name,
      type: a.type,
      defaultVal: a.defaultVal ?? undefined,
      minVal: a.minVal ?? undefined,
      maxVal: a.maxVal ?? undefined,
    }));

    const nodeTemplate: NodeTemplateItem[] = script.nodes.map((n) => ({
      type: n.type,
      content: n.content,
      choices: n.choices ? this.safeParse(n.choices, undefined) : undefined,
    }));

    const template = await this.prisma.scriptTemplate.create({
      data: {
        name: dto.name,
        category: dto.category || script.category || 'adventure',
        description: dto.description || script.desc || '',
        coverEmoji: dto.coverEmoji || '📖',
        worldSetting: script.worldSetting || '',
        stylePrompt: '',
        npcTemplate: JSON.stringify(npcTemplate),
        attrTemplate: JSON.stringify(attrTemplate),
        nodeTemplate: JSON.stringify(nodeTemplate),
        authorId: userId,
        isOfficial: false,
      },
    });

    return { success: true, data: this.parseJsonFields(template) };
  }

  /* ===== 更新模板（仅作者或管理员） ===== */
  async update(id: number, userId: number, userRole: string, dto: UpdateTemplateDto) {
    const template = await this.prisma.scriptTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('模板不存在');
    }

    if (template.authorId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('无权编辑此模板');
    }

    const updated = await this.prisma.scriptTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.coverEmoji !== undefined && { coverEmoji: dto.coverEmoji }),
        ...(dto.worldSetting !== undefined && { worldSetting: dto.worldSetting }),
        ...(dto.stylePrompt !== undefined && { stylePrompt: dto.stylePrompt }),
      },
    });

    return { success: true, data: this.parseJsonFields(updated) };
  }

  /* ===== 删除模板（仅作者或管理员） ===== */
  async remove(id: number, userId: number, userRole: string) {
    const template = await this.prisma.scriptTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('模板不存在');
    }

    if (template.authorId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('无权删除此模板');
    }

    await this.prisma.scriptTemplate.delete({ where: { id } });
    return { success: true, message: '模板已删除' };
  }

  /* ===== 评分（简单平均分计算） ===== */
  async rate(id: number, userId: number, dto: RateTemplateDto) {
    const template = await this.prisma.scriptTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('模板不存在');
    }

    if (dto.rating < 0 || dto.rating > 5) {
      throw new BadRequestException('评分范围 0-5');
    }

    // 简单平均分：(旧均分 * 旧人数 + 新评分) / (旧人数 + 1)
    const oldCount = template.ratingCount || 0;
    const oldRating = template.rating || 0;
    const newCount = oldCount + 1;
    const newRating = (oldRating * oldCount + dto.rating) / newCount;

    const updated = await this.prisma.scriptTemplate.update({
      where: { id },
      data: {
        rating: Math.round(newRating * 100) / 100,
        ratingCount: newCount,
      },
    });

    return {
      success: true,
      data: {
        rating: updated.rating,
        ratingCount: updated.ratingCount,
      },
    };
  }

  /* ===== 工具方法 ===== */
  private safeParse<T>(value: string | null | undefined, fallback: T): T {
    if (!value) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  private parseJsonFields(template: any) {
    return {
      ...template,
      npcTemplate: this.safeParse(template.npcTemplate, []),
      attrTemplate: this.safeParse(template.attrTemplate, []),
      nodeTemplate: this.safeParse(template.nodeTemplate, []),
    };
  }
}
