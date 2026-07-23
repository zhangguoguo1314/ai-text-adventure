import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchScriptsDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  @IsIn(['adventure', 'romance', 'mystery', 'horror', 'scifi', 'fantasy', 'school', 'campus'])
  category?: string;

  @IsOptional()
  @IsString()
  @IsIn(['hot', 'newest', 'recommended'])
  sort?: string = 'recommended';

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
}

export class SearchSuggestDto {
  @IsOptional()
  @IsString()
  keyword?: string;
}
