import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsBoolean,
  IsIn,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

// ==================== 通用分页查询 ====================

export class PaginationDto {
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

  @IsOptional()
  @IsString()
  keyword?: string;
}

// ==================== 用户管理 ====================

export class QueryUsersDto extends PaginationDto {
  @IsOptional()
  @IsIn(['active', 'banned', 'deactivated'])
  status?: string;
}

export class UpdateUserStatusDto {
  @IsNotEmpty()
  @IsIn(['active', 'banned', 'deactivated'])
  status: string;
}

export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsIn(['user', 'creator', 'admin'])
  role: string;
}

export class AdjustUserBalanceDto {
  @IsNotEmpty()
  @IsInt()
  amount: number; // 正数为赠送，负数为扣除
}

// ==================== 剧本管理 ====================

export class QueryScriptsDto extends PaginationDto {
  @IsOptional()
  @IsIn(['draft', 'reviewing', 'published', 'rejected', 'archived'])
  status?: string;
}

export class UpdateScriptStatusDto {
  @IsNotEmpty()
  @IsIn(['published', 'rejected'])
  status: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class ToggleFeaturedDto {
  @IsNotEmpty()
  @IsBoolean()
  featured: boolean;
}

// ==================== 模型管理 ====================

export class CreateModelDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  displayName: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;

  @IsNotEmpty()
  @IsString()
  backendModel: string;

  @IsOptional()
  @IsBoolean()
  multimodal?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxTokens?: number;
}

export class UpdateModelDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;

  @IsOptional()
  @IsString()
  backendModel?: string;

  @IsOptional()
  @IsBoolean()
  multimodal?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxTokens?: number;
}

// ==================== 公告管理 ====================

export class CreateAnnouncementDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsIn(['normal', 'urgent'])
  type?: string;
}

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsIn(['normal', 'urgent'])
  type?: string;
}

// ==================== 兑换码管理 ====================

export class CreateRedemptionCodeDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  uuAmount: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

// ==================== 交易记录查询 ====================

export class QueryTransactionsDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsIn(['spend', 'income', 'recharge', 'withdraw', 'redeem'])
  type?: string;
}
