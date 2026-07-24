import { Module } from '@nestjs/common';
import { ScriptsController } from './scripts.controller';
import { ScriptsService } from './scripts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AiImageModule } from '../ai-image/ai-image.module';

@Module({
  imports: [PrismaModule, AuthModule, AiImageModule],
  controllers: [ScriptsController],
  providers: [ScriptsService],
  exports: [ScriptsService],
})
export class ScriptsModule {}
