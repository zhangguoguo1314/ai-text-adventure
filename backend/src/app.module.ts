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
import { SearchModule } from './search/search.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiImageModule } from './ai-image/ai-image.module';
import { InviteModule } from './invite/invite.module';
import { RankingModule } from './ranking/ranking.module';
import { AchievementModule } from './achievement/achievement.module';
import { RealtimeModule } from './realtime/realtime.module';
import { TemplatesModule } from './templates/templates.module';
import { PromotionModule } from './promotion/promotion.module';
import { CreatorModule } from './creator/creator.module';
import { InGameAppModule } from './in-game-app/in-game-app.module';
import { ScriptLogicModule } from './script-logic/script-logic.module';

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
    SearchModule,
    AnalyticsModule,
    AiImageModule,
    InviteModule,
    RankingModule,
    AchievementModule,
    RealtimeModule,
    TemplatesModule,
    PromotionModule,
    CreatorModule,
    InGameAppModule,
    ScriptLogicModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
