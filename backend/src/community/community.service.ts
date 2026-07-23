import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  /**
   * 动态列表（分页+排序）
   */
  async getPosts(userId?: number, sort = 'latest', page = 1, pageSize = 20) {
    const where: any = {};

    // 关注筛选：仅显示关注用户的动态
    if (sort === 'following' && userId) {
      const follows = await this.prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      where.userId = { in: follows.map((f) => f.followingId) };
    }

    const orderBy =
      sort === 'hot'
        ? { likeCount: 'desc' as const }
        : { createdAt: 'desc' as const };

    const [list, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: { id: true, nickname: true, avatar: true, level: true },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    // 检查当前用户是否已点赞
    let likedPostIds = new Set<number>();
    if (userId) {
      const favorites = await this.prisma.favorite.findMany({
        where: {
          userId,
          targetType: 'post',
          targetId: { in: list.map((p) => p.id) },
        },
        select: { targetId: true },
      });
      likedPostIds = new Set(favorites.map((f) => f.targetId));
    }

    return {
      success: true,
      data: {
        list: list.map((post) => ({
          ...post,
          liked: likedPostIds.has(post.id),
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 发布动态
   */
  async createPost(userId: number, content: string, images?: string[]) {
    const post = await this.prisma.post.create({
      data: {
        userId,
        content,
        images: images ? JSON.stringify(images) : '[]',
      },
      include: {
        user: {
          select: { id: true, nickname: true, avatar: true, level: true },
        },
      },
    });

    return { success: true, data: post };
  }

  /**
   * 点赞/取消点赞
   */
  async toggleLike(userId: number, postId: number) {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: 'post',
          targetId: postId,
        },
      },
    });

    if (existing) {
      // 取消点赞
      await this.prisma.favorite.delete({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType: 'post',
            targetId: postId,
          },
        },
      });
      await this.prisma.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
      });
      return { success: true, data: { liked: false } };
    } else {
      // 点赞
      await this.prisma.favorite.create({
        data: {
          userId,
          targetType: 'post',
          targetId: postId,
        },
      });
      await this.prisma.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      });
      return { success: true, data: { liked: true } };
    }
  }

  /**
   * 发表评论
   */
  async createComment(userId: number, postId: number, content: string) {
    const comment = await this.prisma.comment.create({
      data: {
        userId,
        targetType: 'post',
        targetId: postId,
        content,
      },
      include: {
        user: {
          select: { id: true, nickname: true, avatar: true, level: true },
        },
      },
    });

    // 更新评论计数
    await this.prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    // 通知帖子作者
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    });
    if (post && post.userId !== userId) {
      const commenter = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { nickname: true },
      });
      await this.prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'comment',
          title: '新的评论',
          content: `${commenter?.nickname || '匿名用户'} 评论了你的动态`,
        },
      });
    }

    return { success: true, data: comment };
  }

  /**
   * 获取帖子评论列表
   */
  async getComments(postId: number, page = 1, pageSize = 20) {
    const [list, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { targetType: 'post', targetId: postId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: { id: true, nickname: true, avatar: true, level: true },
          },
        },
      }),
      this.prisma.comment.count({
        where: { targetType: 'post', targetId: postId },
      }),
    ]);

    return {
      success: true,
      data: { list, total, page, pageSize },
    };
  }

  /**
   * 通知列表
   */
  async getNotifications(userId: number, page = 1, pageSize = 20) {
    const [list, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return {
      success: true,
      data: {
        list,
        total,
        page,
        pageSize,
        unreadCount,
      },
    };
  }

  /**
   * 标记全部通知已读
   */
  async markAllNotificationsRead(userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return {
      success: true,
      data: { updatedCount: result.count },
    };
  }

  /**
   * 公告列表
   */
  async getAnnouncements() {
    const list = await this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: list };
  }

  /**
   * 关注/取消关注
   */
  async toggleFollow(followerId: number, followingId: number) {
    if (followerId === followingId) {
      return { success: false, message: '不能关注自己' };
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
    });
    if (!targetUser) {
      return { success: false, message: '用户不存在' };
    }

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existing) {
      // 取消关注
      await this.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
      return { success: true, data: { following: false } };
    } else {
      // 关注
      await this.prisma.follow.create({
        data: { followerId, followingId },
      });

      // 通知被关注用户
      const follower = await this.prisma.user.findUnique({
        where: { id: followerId },
        select: { nickname: true },
      });
      await this.prisma.notification.create({
        data: {
          userId: followingId,
          type: 'follow',
          title: '新的关注者',
          content: `${follower?.nickname || '匿名用户'} 关注了你`,
        },
      });

      return { success: true, data: { following: true } };
    }
  }

  /**
   * 获取公开用户资料
   */
  async getUserProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        bio: true,
        level: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    const scriptCount = await this.prisma.script.count({
      where: { authorId: userId, status: 'published' },
    });

    const followerCount = await this.prisma.follow.count({
      where: { followingId: userId },
    });

    const followingCount = await this.prisma.follow.count({
      where: { followerId: userId },
    });

    return {
      success: true,
      data: {
        ...user,
        scriptCount,
        followerCount,
        followingCount,
      },
    };
  }

  /**
   * 收藏/取消收藏剧本
   */
  async toggleFavorite(userId: number, scriptId: number) {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: 'script',
          targetId: scriptId,
        },
      },
    });

    if (existing) {
      await this.prisma.favorite.delete({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType: 'script',
            targetId: scriptId,
          },
        },
      });
      await this.prisma.script.update({
        where: { id: scriptId },
        data: { favCount: { decrement: 1 } },
      });
      return { success: true, data: { favorited: false } };
    } else {
      await this.prisma.favorite.create({
        data: {
          userId,
          targetType: 'script',
          targetId: scriptId,
        },
      });
      await this.prisma.script.update({
        where: { id: scriptId },
        data: { favCount: { increment: 1 } },
      });
      return { success: true, data: { favorited: true } };
    }
  }

  /**
   * 我的收藏列表
   */
  async getMyFavorites(userId: number, page = 1, pageSize = 20) {
    const [list, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId, targetType: 'script' },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          script: {
            include: {
              author: {
                select: { id: true, nickname: true, avatar: true },
              },
            },
          },
        },
      }),
      this.prisma.favorite.count({
        where: { userId, targetType: 'script' },
      }),
    ]);

    return {
      success: true,
      data: {
        list: list.map((f) => f.script),
        total,
        page,
        pageSize,
      },
    };
  }
}
