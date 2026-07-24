import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateAvatarDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  personality: string;

  @IsOptional()
  @IsString()
  style?: string;
}

export class GenerateSceneDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  mood?: string;
}

export class GenerateCoverDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  desc: string;

  @IsNotEmpty()
  @IsString()
  category: string;
}
