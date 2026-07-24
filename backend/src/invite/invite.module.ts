import { Module } from '@nestjs/common';
import { InviteController } from './invite.controller';
import { InviteService } from './invite.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [InviteController],
  providers: [InviteService],
  exports: [InviteService],
})
export class InviteModule {}
