import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class AddCustomAiDto {
  @IsNotEmpty()
  @IsString()
  provider: string;

  @IsNotEmpty()
  @IsString()
  baseUrl: string;

  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @IsOptional()
  @IsString()
  model?: string;
}
