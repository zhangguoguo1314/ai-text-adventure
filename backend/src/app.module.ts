import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ScriptsModule } from './scripts/scripts.module';
import { StyleTemplatesModule } from './style-templates/style-templates.module';
import { GameModule } from './game/game.module';
import { CommunityModule } from './community/community.module';
import { CoinModule } from './coin/coin.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    ScriptsModule,
    StyleTemplatesModule,
    GameModule,
    CommunityModule,
    CoinModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
