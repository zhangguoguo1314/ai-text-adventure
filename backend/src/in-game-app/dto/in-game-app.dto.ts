import {
  IsOptional,
  IsString,
  IsInt,
  IsIn,
  IsNotEmpty,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 内置APP类型
 * - utility: 工具（如校园助手、记事本等）
 * - social: 社交（如直播小助手、聊天室等）
 * - shop: 商店
 * - ranking: 排行
 * - quest: 任务
 * - custom: 自定义
 */
export type AppType =
  | 'utility'
  | 'social'
  | 'shop'
  | 'ranking'
  | 'quest'
  | 'custom';

export const APP_TYPES: AppType[] = [
  'utility',
  'social',
  'shop',
  'ranking',
  'quest',
  'custom',
];

/**
 * 创建内置APP
 */
export class CreateInGameAppDto {
  @IsNotEmpty({ message: 'APP名称不能为空' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(APP_TYPES)
  appType?: string;

  /** JSON 字符串：存储 APP 的配置（功能模块、数据源等） */
  @IsOptional()
  @IsString()
  config?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * 更新内置APP（所有字段均为可选）
 */
export class UpdateInGameAppDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(APP_TYPES)
  appType?: string;

  /** JSON 字符串：存储 APP 的配置（功能模块、数据源等） */
  @IsOptional()
  @IsString()
  config?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * 单个排序项
 */
export class AppOrderItemDto {
  @Type(() => Number)
  @IsInt()
  id: number;

  @Type(() => Number)
  @IsInt()
  sortOrder: number;
}

/**
 * 批量更新排序
 */
export class ReorderInGameAppDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppOrderItemDto)
  items: AppOrderItemDto[];
}

/**
 * 查询参数
 */
export class QueryInGameAppDto {
  @IsOptional()
  @IsString()
  @IsIn(APP_TYPES)
  appType?: string;
}
