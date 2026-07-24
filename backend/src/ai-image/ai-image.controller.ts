import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiImageService } from './ai-image.service';
import {
  GenerateAvatarDto,
  GenerateSceneDto,
  GenerateCoverDto,
} from './dto/ai-image.dto';
import { CombinedAuthGuard } from '../auth/auth.guard';

@ApiTags('AI 图片')
@Controller('api/ai-image')
@UseGuards(CombinedAuthGuard)
@ApiBearerAuth()
export class AiImageController {
  constructor(private readonly aiImageService: AiImageService) {}

  @Post('generate-avatar')
  @ApiOperation({ summary: '生成角色头像' })
  async generateAvatar(@Body() dto: GenerateAvatarDto) {
    return this.aiImageService.generateAvatar(dto);
  }

  @Post('generate-scene')
  @ApiOperation({ summary: '生成场景插图' })
  async generateScene(@Body() dto: GenerateSceneDto) {
    return this.aiImageService.generateScene(dto);
  }

  @Post('generate-cover')
  @ApiOperation({ summary: '生成剧本封面' })
  async generateCover(@Body() dto: GenerateCoverDto) {
    return this.aiImageService.generateCover(dto);
  }
}
