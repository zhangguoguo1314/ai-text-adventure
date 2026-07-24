import { Global, Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';
import { AuthModule } from '../auth/auth.module';

/**
 * 实时通知模块
 *
 * 标记为 @Global，使得 CommunityModule / GameModule / AdminModule 等
 * 无需各自 import 即可直接注入 RealtimeService。
 *
 * 依赖 AuthModule 以获取 JwtService 用于 WebSocket 握手阶段的 token 校验。
 */
@Global()
@Module({
  imports: [AuthModule],
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
