import { Module } from '@nestjs/common';
import { ScriptsController } from './scripts.controller';
import { ScriptsService } from './scripts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AiImageModule } from '../ai-image/ai-image.module';
import { ScriptLogicModule } from '../script-logic/script-logic.module';

@Module({
  imports: [PrismaModule, AuthModule, AiImageModule, ScriptLogicModule],
  controllers: [ScriptsController],
  providers: [ScriptsService],
  exports: [ScriptsService],
})
export class ScriptsModule {}
