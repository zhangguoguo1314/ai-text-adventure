import { IsOptional, IsString, IsInt, Min, IsIn, Max, IsNotEmpty } from 'class-validator';
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
