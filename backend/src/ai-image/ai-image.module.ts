import { Module } from '@nestjs/common';
import { AiImageController } from './ai-image.controller';
import { AiImageService } from './ai-image.service';

@Module({
  controllers: [AiImageController],
  providers: [AiImageService],
  exports: [AiImageService],
})
export class AiImageModule {}
