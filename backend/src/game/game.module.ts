import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { AiService } from './ai.service';
import { ScriptLogicModule } from '../script-logic/script-logic.module';

@Module({
  imports: [ScriptLogicModule],
  controllers: [GameController],
  providers: [GameService, AiService],
  exports: [GameService, AiService],
})
export class GameModule {}
