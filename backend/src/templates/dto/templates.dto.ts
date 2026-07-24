import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
  IsNumber,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTemplateDto {
  @IsOptional()
  @IsString()
  category?: string = 'all'; // all / adventure / romance / mystery / horror / scifi / fantasy / school / wuxia

  @IsOptional()
  @IsString()
  @IsIn(['hot', 'newest', 'rating'])
  sort?: string = 'hot';

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
  limit?: number = 20;

  @IsOptional()
  @IsString()
  keyword?: string;
}

export class CreateTemplateDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  scriptId: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'adventure',
    'romance',
    'mystery',
    'horror',
    'scifi',
    'fantasy',
    'school',
    'wuxia',
  ])
  category?: string;

  @IsOptional()
  @IsString()
  coverEmoji?: string;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'adventure',
    'romance',
    'mystery',
    'horror',
    'scifi',
    'fantasy',
    'school',
    'wuxia',
  ])
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverEmoji?: string;

  @IsOptional()
  @IsString()
  worldSetting?: string;

  @IsOptional()
  @IsString()
  stylePrompt?: string;
}

export class RateTemplateDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;
}
