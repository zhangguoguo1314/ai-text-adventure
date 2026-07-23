import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

const SALT_ROUNDS = 10;

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

@Injectable()
export class AuthService {
  // JWT blacklist: token -> expiry timestamp (memory-based for dev)
  private tokenBlacklist = new Map<string, number>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.phone && !dto.email) {
      return { success: false, message: '手机号或邮箱必须提供其中之一' };
    }

    // Check for verify code (skip in dev mode when not provided)
    if (dto.verifyCode && dto.verifyCode !== '000000') {
      return { success: false, message: '验证码错误' };
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(dto.phone ? [{ phone: dto.phone }] : []),
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      },
    });

    if (existingUser) {
      return { success: false, message: '该手机号或邮箱已注册' };
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const inviteCode = generateInviteCode();

    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        nickname: dto.nickname || `用户${Date.now() % 10000}`,
        inviteCode,
        balance: {
          create: {
            permanentBalance: 100, // 注册赠送100UU
          },
        },
        preferences: {
          create: {},
        },
      },
      include: { balance: true },
    });

    const token = this.generateToken(user.id, user.role);

    return {
      success: true,
      data: {
        token,
        user: this.sanitizeUser(user),
      },
    };
  }

  async login(dto: LoginDto) {
    if (!dto.phone && !dto.email) {
      return { success: false, message: '手机号或邮箱必须提供其中之一' };
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(dto.phone ? [{ phone: dto.phone }] : []),
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      },
      include: { balance: true },
    });

    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, message: '密码错误' };
    }

    if (user.status !== 'active') {
      return { success: false, message: '账号已被禁用' };
    }

    const token = this.generateToken(user.id, user.role);

    return {
      success: true,
      data: {
        token,
        user: this.sanitizeUser(user),
      },
    };
  }

  async logout(token: string) {
    // Add token to blacklist with expiry
    const decoded = this.jwtService.decode(token) as any;
    if (decoded && decoded.exp) {
      this.tokenBlacklist.set(token, decoded.exp * 1000);
    }
    return { success: true, message: '登出成功' };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { balance: true, preferences: true },
    });

    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    return {
      success: true,
      data: this.sanitizeUser(user),
    };
  }

  isTokenBlacklisted(token: string): boolean {
    const expiry = this.tokenBlacklist.get(token);
    if (!expiry) return false;
    if (Date.now() > expiry) {
      this.tokenBlacklist.delete(token);
      return false;
    }
    return true;
  }

  generateToken(userId: number, role: string): string {
    return this.jwtService.sign({ sub: userId, role });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...result } = user;
    return result;
  }
}
