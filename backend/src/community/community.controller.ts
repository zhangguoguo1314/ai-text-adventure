import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { CombinedAuthGuard } from '../auth/auth.guard';

@ApiTags('社区')
@Controller()
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  /* ===== 动态 ===== */

  @Get('api/posts')
  @ApiOperation({ summary: '动态列表（分页+排序）' })
  async getPosts(
    @Req() req: any,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const userId = req.user?.id;
    return this.communityService.getPosts(
      userId,
      sort || 'latest',
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Post('api/posts')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发布动态' })
  async createPost(
    @Req() req: any,
    @Body() body: { content: string; images?: string[] },
  ) {
    return this.communityService.createPost(req.user.id, body.content, body.images);
  }

  @Post('api/posts/:id/like')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '点赞/取消点赞' })
  async toggleLike(@Req() req: any, @Param('id') id: string) {
    return this.communityService.toggleLike(req.user.id, Number(id));
  }

  @Post('api/posts/:id/comment')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发表评论' })
  async createComment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.communityService.createComment(req.user.id, Number(id), body.content);
  }

  @Get('api/posts/:id/comments')
  @ApiOperation({ summary: '获取帖子评论列表' })
  async getComments(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.communityService.getComments(
      Number(id),
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  /* ===== 通知 ===== */

  @Get('api/notifications')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '通知列表' })
  async getNotifications(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.communityService.getNotifications(
      req.user.id,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Put('api/notifications/read')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '标记全部通知已读' })
  async markAllRead(@Req() req: any) {
    return this.communityService.markAllNotificationsRead(req.user.id);
  }

  /* ===== 公告 ===== */

  @Get('api/announcements')
  @ApiOperation({ summary: '公告列表' })
  async getAnnouncements() {
    return this.communityService.getAnnouncements();
  }

  /* ===== 关注 ===== */

  @Post('api/follow/:userId')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '关注/取消关注' })
  async toggleFollow(@Req() req: any, @Param('userId') userId: string) {
    return this.communityService.toggleFollow(req.user.id, Number(userId));
  }

  /* ===== 用户资料 ===== */

  @Get('api/users/:userId/profile')
  @ApiOperation({ summary: '获取公开用户资料' })
  async getUserProfile(@Param('userId') userId: string) {
    return this.communityService.getUserProfile(Number(userId));
  }

  /* ===== 收藏 ===== */

  @Post('api/scripts/:id/favorite')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '收藏/取消收藏剧本' })
  async toggleFavorite(@Req() req: any, @Param('id') id: string) {
    return this.communityService.toggleFavorite(req.user.id, Number(id));
  }

  @Get('api/scripts/favorites')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '我的收藏列表' })
  async getMyFavorites(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.communityService.getMyFavorites(
      req.user.id,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }
}
