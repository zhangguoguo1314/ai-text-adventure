import { IsString, IsNumber, IsOptional, IsNotEmpty, IsIn, Min } from 'class-validator';
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

/** 使用物品 DTO */
export class UseItemDto {
  @ApiProperty({ description: '物品ID' })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ description: '使用目标（可选）', required: false })
  @IsOptional()
  @IsString()
  target?: string;
}

/** 使用技能 DTO */
export class UseSkillDto {
  @ApiProperty({ description: '技能ID' })
  @IsString()
  @IsNotEmpty()
  skillId: string;
}

/** 战斗行动 DTO */
export class CombatActionDto {
  @ApiProperty({ description: '战斗行动类型' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['attack', 'defend', 'skill', 'item', 'flee'])
  action: string;

  @ApiProperty({ description: '使用的技能ID（可选）', required: false })
  @IsOptional()
  @IsString()
  skillId?: string;

  @ApiProperty({ description: '使用的物品ID（可选）', required: false })
  @IsOptional()
  @IsString()
  itemId?: string;
}

/** 商店交易 DTO */
export class TradeDto {
  @ApiProperty({ description: '交易类型' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['buy', 'sell'])
  action: string;

  @ApiProperty({ description: '物品ID' })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ description: '数量（可选）', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}

/** NPC 对话查询参数 DTO */
export class NpcDialogueDto {
  @ApiProperty({ description: 'NPC名称' })
  @IsString()
  @IsNotEmpty()
  npcName: string;
}
