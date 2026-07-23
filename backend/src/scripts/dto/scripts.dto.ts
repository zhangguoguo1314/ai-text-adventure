import { IsOptional, IsString, IsInt, Min, IsIn, Max, IsNotEmpty, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateScriptDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsOptional()
  @IsString()
  desc?: string;

  @IsOptional()
  @IsString()
  @IsIn(['adventure', 'romance', 'mystery', 'scifi', 'horror', 'fantasy', 'comedy', 'other'])
  category?: string;

  @IsOptional()
  @IsString()
  worldSetting?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  styleId?: number;
}

export class UpdateScriptDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsOptional()
  @IsString()
  desc?: string;

  @IsOptional()
  @IsString()
  @IsIn(['adventure', 'romance', 'mystery', 'scifi', 'horror', 'fantasy', 'comedy', 'other'])
  category?: string;

  @IsOptional()
  @IsString()
  worldSetting?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  styleId?: number;
}

export class QueryScriptDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  @IsIn(['adventure', 'romance', 'mystery', 'scifi', 'horror', 'fantasy', 'comedy', 'other'])
  category?: string;

  @IsOptional()
  @IsString()
  sort?: string = 'createdAt';

  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc' = 'desc';
}

/* ===== NPC DTOs ===== */

export class CreateNpcDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  personality?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class UpdateNpcDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  personality?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

/* ===== Attribute DTOs ===== */

export class CreateAttributeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @IsIn(['number', 'enum', 'boolean'])
  type?: string;

  @IsOptional()
  @IsNumber()
  minVal?: number;

  @IsOptional()
  @IsNumber()
  maxVal?: number;

  @IsOptional()
  @IsString()
  defaultVal?: string;

  @IsOptional()
  @IsString()
  thresholdRules?: string;
}

export class UpdateAttributeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(['number', 'enum', 'boolean'])
  type?: string;

  @IsOptional()
  @IsNumber()
  minVal?: number;

  @IsOptional()
  @IsNumber()
  maxVal?: number;

  @IsOptional()
  @IsString()
  defaultVal?: string;

  @IsOptional()
  @IsString()
  thresholdRules?: string;
}

/* ===== Node DTOs ===== */

export class CreateNodeDto {
  @IsOptional()
  @IsString()
  @IsIn(['scene', 'choice', 'condition', 'preset'])
  type?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  choices?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsNumber()
  posX?: number;

  @IsOptional()
  @IsNumber()
  posY?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;
}

export class UpdateNodeDto {
  @IsOptional()
  @IsString()
  @IsIn(['scene', 'choice', 'condition', 'preset'])
  type?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  choices?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsNumber()
  posX?: number;

  @IsOptional()
  @IsNumber()
  posY?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;
}

export class BatchUpdateAttributesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAttributeDto)
  attributes: UpdateAttributeDto[];
}
