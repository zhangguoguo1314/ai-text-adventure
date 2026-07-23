import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartGameDto {
  @ApiProperty({ description: '剧本ID' })
  @IsNumber()
  @IsNotEmpty()
  scriptId: number;
}

export class ChatDto {
  @ApiProperty({ description: '玩家行动文本' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ description: '选择的选项ID（可选）', required: false })
  @IsOptional()
  @IsString()
  choiceId?: string;
}

export class SaveGameDto {
  @ApiProperty({ description: '存档描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
