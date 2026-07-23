import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScriptDto, UpdateScriptDto, QueryScriptDto } from './dto/scripts.dto';

@Injectable()
export class ScriptsService {
  constructor(private prisma: PrismaService) {}

  async list(dto: QueryScriptDto) {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {
      status: 'published',
    };

    if (dto.keyword) {
      where.title = { contains: dto.keyword };
    }

    if (dto.category) {
      where.category = dto.category;
    }

    const orderBy: any = {};
    const sortField = dto.sort || 'createdAt';
    const order = dto.order || 'desc';
    orderBy[sortField] = order;

    const [items, total] = await Promise.all([
      this.prisma.script.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          author: {
            select: { id: true, nickname: true, avatar: true },
          },
        },
      }),
      this.prisma.script.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const script = await this.prisma.script.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, nickname: true, avatar: true },
        },
        npcs: true,
        attributes: true,
        nodes: true,
        _count: {
          select: { sessions: true, favorites: true, comments: true },
        },
      },
    });

    if (!script) {
      return { success: false, message: '剧本不存在' };
    }

    return { success: true, data: script };
  }

  async create(userId: number, dto: CreateScriptDto) {
    const script = await this.prisma.script.create({
      data: {
        authorId: userId,
        title: dto.title,
        cover: dto.cover,
        desc: dto.desc || '',
        category: dto.category || 'adventure',
        worldSetting: dto.worldSetting || '',
        styleId: dto.styleId,
        status: 'draft',
      },
    });

    return { success: true, data: script };
  }

  async update(id: number, userId: number, dto: UpdateScriptDto) {
    const script = await this.prisma.script.findUnique({ where: { id } });

    if (!script) {
      return { success: false, message: '剧本不存在' };
    }

    if (script.authorId !== userId) {
      return { success: false, message: '无权编辑此剧本' };
    }

    const updated = await this.prisma.script.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.cover !== undefined && { cover: dto.cover }),
        ...(dto.desc !== undefined && { desc: dto.desc }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.worldSetting !== undefined && { worldSetting: dto.worldSetting }),
        ...(dto.styleId !== undefined && { styleId: dto.styleId }),
      },
    });

    return { success: true, data: updated };
  }

  async publish(id: number, userId: number) {
    const script = await this.prisma.script.findUnique({ where: { id } });

    if (!script) {
      return { success: false, message: '剧本不存在' };
    }

    if (script.authorId !== userId) {
      return { success: false, message: '无权发布此剧本' };
    }

    const updated = await this.prisma.script.update({
      where: { id },
      data: { status: 'reviewing' },
    });

    return { success: true, data: updated };
  }
}
