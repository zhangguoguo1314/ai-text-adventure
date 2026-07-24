import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsInt,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

// ==================== 创作者等级体系常量 ====================

/**
 * 创作者等级配置
 * 对标 UU 平台的创作者分成系统，按累计游玩次数划分 5 个等级。
 */
export interface CreatorLevelTier {
  level: number;
  title: string;
  minPlayCount: number;
}

export const CREATOR_LEVEL_TIERS: CreatorLevelTier[] = [
  { level: 1, title: '新人创作者', minPlayCount: 0 },
  { level: 2, title: '潜力创作者', minPlayCount: 1000 },
  { level: 3, title: '人气创作者', minPlayCount: 10000 },
  { level: 4, title: '明星创作者', minPlayCount: 50000 },
  { level: 5, title: '传奇创作者', minPlayCount: 200000 },
];

/**
 * 根据累计游玩次数计算对应的创作者等级与称号
 */
export function resolveCreatorLevel(totalPlayCount: number): CreatorLevelTier {
  let matched = CREATOR_LEVEL_TIERS[0];
  for (const tier of CREATOR_LEVEL_TIERS) {
    if (totalPlayCount >= tier.minPlayCount) {
      matched = tier;
    }
  }
  return matched;
}

// ==================== 创作者等级信息响应 ====================

/**
 * 创作者等级信息（接口返回结构）
 */
export class CreatorLevelInfoDto {
  userId: number;
  level: number;
  title: string;
  totalPlayCount: number;
  totalIncome: number;
  scriptCount: number;
  avgRating: number;
  isVerified: boolean;
  verifiedAt: Date | null;
  /** 头像框：通过认证后为 'galaxy'（星河头像框），否则为 null */
  avatarFrame: string | null;
  /** 当前等级与下一等级的进度信息 */
  nextLevel: {
    level: number;
    title: string;
    minPlayCount: number;
  } | null;
  /** 距离下一等级还需的游玩次数 */
  progressToNext: number | null;
  updatedAt: Date;
}

// ==================== 收益记录查询 ====================

export class QueryIncomeRecordsDto {
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 20))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  /** 时间范围筛选：week / month / total */
  @IsOptional()
  @IsIn(['week', 'month', 'total'])
  period?: string;
}

// ==================== 创作者排行榜查询 ====================

export class QueryCreatorRankingDto {
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 20))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  /** 排序维度：totalPlayCount(默认) / totalIncome / avgRating / scriptCount */
  @IsOptional()
  @IsIn(['totalPlayCount', 'totalIncome', 'avgRating', 'scriptCount'])
  sortBy?: string;

  /** 是否仅展示已认证创作者 */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  verifiedOnly?: boolean;
}

// ==================== 创作者认证（管理员审核） ====================

export class VerifyCreatorDto {
  @IsNotEmpty()
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsString()
  reviewNote?: string;
}

// ==================== 等级体系查询响应 ====================

export class CreatorLevelTierListDto {
  levels: CreatorLevelTier[];
}
