import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoinService {
  constructor(private prisma: PrismaService) {}

  async getModels() {
    const models = await this.prisma.aiModel.findMany({
      where: { isActive: true },
      orderBy: { rate: 'asc' },
    });

    return {
      success: true,
      data: models.map((m) => ({
        id: m.id,
        name: m.name,
        displayName: m.displayName,
        rate: m.rate,
        backendModel: m.backendModel,
        multimodal: m.multimodal,
        maxTokens: m.maxTokens,
      })),
    };
  }

  async setModelPreference(userId: number, modelId: number) {
    const model = await this.prisma.aiModel.findUnique({
      where: { id: modelId },
    });
    if (!model) {
      return { success: false, message: '模型不存在' };
    }

    await this.prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        modelPreference: model.name,
      },
      update: {
        modelPreference: model.name,
      },
    });

    return { success: true, message: '已设置偏好模型' };
  }

  async getUserPreference(userId: number) {
    const pref = await this.prisma.userPreference.findUnique({
      where: { userId },
    });

    return {
      success: true,
      data: pref || { theme: 'light', modelPreference: null, useCustomApi: true },
    };
  }
}
