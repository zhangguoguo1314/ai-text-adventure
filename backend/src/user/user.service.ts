import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, AddCustomAiDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: number) {
    const balance = await this.prisma.userBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      // Auto-create if not exists
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
    const config = await this.prisma.userApiConfig.create({
      data: {
        userId,
        provider: dto.provider,
        baseUrl: dto.baseUrl,
        encryptedKey: dto.apiKey, // In production, this should be encrypted
        model: dto.model || '',
      },
    });

    return { success: true, data: config };
  }

  async getCustomAiList(userId: number) {
    const configs = await this.prisma.userApiConfig.findMany({
      where: { userId },
      orderBy: { priority: 'desc' },
    });

    return { success: true, data: configs };
  }
}
