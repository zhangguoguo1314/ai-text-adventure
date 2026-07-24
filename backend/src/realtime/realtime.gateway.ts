import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

/**
 * 实时通知 WebSocket Gateway
 *
 * 事件:
 * - 'notification'   新通知（定向到用户）
 * - 'announcement'   新公告（全局广播）
 * - 'game_update'    游戏更新（定向到游戏会话）
 * - 'balance_update' 余额变更（定向到用户）
 *
 * Room 规则:
 * - `user:{userId}`      用户私人房间，用于接收定向通知
 * - `session:{sessionId}` 游戏会话房间，用于接收游戏更新
 */
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  path: '/socket.io',
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('RealtimeGateway');

  /** socket.id -> userId 映射，用于断开连接时清理 */
  private readonly socketUserMap = new Map<string, number>();

  constructor(private readonly jwtService: JwtService) {}

  /**
   * 客户端建立连接时：验证 JWT token（从 handshake auth 获取），
   * 验证通过后将 socket 加入 `user:{userId}` 房间
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization as string)?.replace(
          'Bearer ',
          '',
        );

      if (!token) {
        this.logger.warn(
          `连接被拒绝: 未提供认证令牌 (socket ${client.id})`,
        );
        client.emit('error', { message: '未提供认证令牌' });
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify<{ sub: number; role: string }>(
        token,
      );
      const userId = payload.sub;

      this.socketUserMap.set(client.id, userId);
      client.join(`user:${userId}`);

      this.logger.log(
        `用户 ${userId} 已连接 (socket ${client.id})`,
      );
    } catch (err) {
      this.logger.warn(
        `连接被拒绝: 认证令牌无效 (socket ${client.id})`,
      );
      client.emit('error', { message: '认证令牌无效' });
      client.disconnect(true);
    }
  }

  /**
   * 客户端断开连接时：清理 socket 与用户的映射
   */
  handleDisconnect(client: Socket): void {
    const userId = this.socketUserMap.get(client.id);
    if (userId) {
      this.logger.log(
        `用户 ${userId} 已断开连接 (socket ${client.id})`,
      );
    }
    this.socketUserMap.delete(client.id);
  }

  /**
   * 客户端加入游戏会话房间，用于接收该会话的实时更新
   */
  @SubscribeMessage('join_session')
  handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number },
  ): { joined: boolean } {
    if (data?.sessionId) {
      client.join(`session:${data.sessionId}`);
      this.logger.debug(
        `socket ${client.id} 加入会话房间 session:${data.sessionId}`,
      );
      return { joined: true };
    }
    return { joined: false };
  }

  /**
   * 客户端离开游戏会话房间
   */
  @SubscribeMessage('leave_session')
  handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number },
  ): { left: boolean } {
    if (data?.sessionId) {
      client.leave(`session:${data.sessionId}`);
      return { left: true };
    }
    return { left: false };
  }

  // ==================== 发送方法 ====================

  /**
   * 向指定用户发送实时通知
   */
  sendNotification(userId: number, notification: any): void {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  /**
   * 广播公告给所有在线用户
   */
  broadcastAnnouncement(announcement: any): void {
    this.server.emit('announcement', announcement);
  }

  /**
   * 向游戏会话相关用户发送更新
   */
  sendGameUpdate(sessionId: number, data: any): void {
    this.server.to(`session:${sessionId}`).emit('game_update', data);
  }

  /**
   * 向指定用户发送余额变更通知
   */
  sendBalanceUpdate(userId: number, data: any): void {
    this.server.to(`user:${userId}`).emit('balance_update', data);
  }

  /**
   * 获取当前在线用户数
   */
  getOnlineUserCount(): number {
    return new Set(this.socketUserMap.values()).size;
  }
}
