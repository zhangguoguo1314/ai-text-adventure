import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StyleTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const templates = await this.prisma.styleTemplate.findMany({
      orderBy: { useCount: 'desc' },
    });
    return { success: true, data: templates };
  }
}
