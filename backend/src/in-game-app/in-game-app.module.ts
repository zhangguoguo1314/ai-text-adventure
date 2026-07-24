import { Module } from '@nestjs/common';
import { InGameAppController } from './in-game-app.controller';
import { InGameAppService } from './in-game-app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [InGameAppController],
  providers: [InGameAppService],
  exports: [InGameAppService],
})
export class InGameAppModule {}
