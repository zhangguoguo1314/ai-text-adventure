import { Injectable, Logger } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

/**
 * 实时通知服务
 *
 * 封装 RealtimeGateway 的发送方法，供其他模块（Community / Game / Admin 等）调用。
 * 所有发送操作均做安全包装：即使 Gateway 尚未就绪也不会抛出异常中断业务流程。
 */
@Injectable()
export class RealtimeService {
  private readonly logger = new Logger('RealtimeService');

  constructor(private readonly gateway: RealtimeGateway) {}

  /**
   * 向指定用户发送实时事件
   * @param userId 目标用户 ID
   * @param event  事件名（notification / balance_update / ...）
   * @param data   负载数据
   */
  notifyUser(userId: number, event: string, data: any): void {
    try {
      const server = this.gateway.server;
      if (!server) {
        this.logger.debug(`WebSocket 服务尚未就绪，跳过向用户 ${userId} 发送 ${event}`);
        return;
      }
      server.to(`user:${userId}`).emit(event, data);
    } catch (err) {
      this.logger.error(`向用户 ${userId} 发送实时事件 ${event} 失败`, err);
    }
  }

  /**
   * 全局广播事件（所有在线用户）
   * @param event 事件名（announcement / ...）
   * @param data  负载数据
   */
  broadcast(event: string, data: any): void {
    try {
      const server = this.gateway.server;
      if (!server) {
        this.logger.debug(`WebSocket 服务尚未就绪，跳过广播 ${event}`);
        return;
      }
      server.emit(event, data);
    } catch (err) {
      this.logger.error(`广播实时事件 ${event} 失败`, err);
    }
  }

  /**
   * 向指定游戏会话相关用户发送更新（game_update 事件）
   * @param sessionId 游戏会话 ID
   * @param data      负载数据
   */
  notifyGameSession(sessionId: number, data: any): void {
    try {
      this.gateway.sendGameUpdate(sessionId, data);
    } catch (err) {
      this.logger.error(`向会话 ${sessionId} 发送游戏更新失败`, err);
    }
  }

  /**
   * 便捷方法：向指定用户发送通知（'notification' 事件）
   */
  sendNotification(userId: number, notification: any): void {
    this.notifyUser(userId, 'notification', notification);
  }

  /**
   * 便捷方法：广播公告（'announcement' 事件）
   */
  broadcastAnnouncement(announcement: any): void {
    this.broadcast('announcement', announcement);
  }

  /**
   * 便捷方法：向指定用户发送余额变更（'balance_update' 事件）
   */
  sendBalanceUpdate(userId: number, data: any): void {
    this.notifyUser(userId, 'balance_update', data);
  }
}
