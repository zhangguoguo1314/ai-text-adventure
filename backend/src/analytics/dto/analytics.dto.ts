import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 收入/游玩趋势图查询参数
 */
export class RevenueChartDto {
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 30))
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}
