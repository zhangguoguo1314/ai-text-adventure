import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsIn,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

// 支持的推广平台
export const PROMOTION_PLATFORMS = [
  'douyin',
  'xiaohongshu',
  'bilibili',
  'weibo',
] as const;
export type PromotionPlatform = (typeof PROMOTION_PLATFORMS)[number];

// ==================== 提交推广链接 ====================

export class SubmitPromotionDto {
  @IsNotEmpty({ message: '平台不能为空' })
  @IsIn([...PROMOTION_PLATFORMS], { message: '不支持的平台' })
  platform: string;

  @IsNotEmpty({ message: '推广链接不能为空' })
  @IsString()
  @MaxLength(2000, { message: '推广链接过长' })
  link: string;
}

// ==================== 管理员审核 ====================

export class ReviewPromotionDto {
  @IsNotEmpty({ message: '审核状态不能为空' })
  @IsIn(['approved', 'rejected'], {
    message: '审核状态只能为 approved 或 rejected',
  })
  status: string;

  // 审核通过时填写的实际点赞数（用于计算奖励层级）
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== null && value !== ''
      ? parseInt(value, 10)
      : undefined,
  )
  @IsInt({ message: '点赞数必须为整数' })
  @Min(0, { message: '点赞数不能为负' })
  likesCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '审核备注过长' })
  reviewNote?: string;
}

// ==================== 管理员查询 ====================

export class QueryPromotionDto {
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
  pageSize?: number;

  @IsOptional()
  @IsIn([...PROMOTION_PLATFORMS])
  platform?: string;

  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt()
  @Min(1)
  userId?: number;
}
