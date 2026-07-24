import { Module } from '@nestjs/common';
import { ScriptLogicService } from './script-logic.service';
import { ScriptLogicController } from './script-logic.controller';

@Module({
  controllers: [ScriptLogicController],
  providers: [ScriptLogicService],
  exports: [ScriptLogicService],
})
export class ScriptLogicModule {}
