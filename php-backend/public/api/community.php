<?php
/**
 * community.php - 社区 API
 *
 * GET    /api/posts                  - 动态列表
 * POST   /api/posts                  - 发布动态
 * POST   /api/posts/{id}/like        - 点赞/取消点赞
 * POST   /api/posts/{id}/comment     - 发表评论
 * GET    /api/posts/{id}/comments    - 帖子评论列表
 * GET    /api/notifications          - 通知列表
 * PUT    /api/notifications/read     - 标记全部已读
 * GET    /api/announcements          - 公告列表
 * POST   /api/follow/{userId}        - 关注/取消关注
 * GET    /api/users/{userId}/profile - 获取公开用户资料
 * POST   /api/scripts/{id}/favorite  - 收藏/取消收藏
 * GET    /api/scripts/favorites      - 我的收藏列表
 */

use Helpers as H;

// ============================================================
// 动态相关
// ============================================================

// GET /api/posts - 动态列表
$router->get('/api/posts', function ($params) {
    Middleware::optionalAuth();
    $db = Database::getInstance();
    [$page, $pageSize, $offset] = H::getPagination();

    $sort = $_GET['sort'] ?? 'latest';
    $orderBy = $sort === 'hot' ? 'p.like_count DESC, p.created_at DESC' : 'p.created_at DESC';

    $total = $db->selectValue('SELECT COUNT(*) FROM `posts`');

    $posts = $db->select(
        "SELECT p.*, u.nickname AS author_name, u.avatar AS author_avatar
         FROM `posts` p
         JOIN `users` u ON p.user_id = u.id
         ORDER BY {$orderBy}
         LIMIT {$offset}, {$pageSize}"
    );

    // 解析图片 JSON 并添加用户是否已点赞标记
    $userId = Auth::getCurrentUserId();
    foreach ($posts as &$post) {
        $post['images'] = H::jsonDecode($post['images'], []);
        $post['id'] = (int)$post['id'];
        $post['user_id'] = (int)$post['user_id'];
        $post['like_count'] = (int)$post['like_count'];
        $post['comment_count'] = (int)$post['comment_count'];
    }

    H::success(H::pagination($posts, $total, $page, $pageSize));
});

// POST /api/posts - 发布动态
$router->post('/api/posts', function ($params) {
    $userId = Middleware::requireUserId();
    $body = Middleware::json();
    $db = Database::getInstance();

    $content = H::get($body, 'content', '');
    $images = H::get($body, 'images', []);

    if (empty($content) && empty($images)) {
        H::error('动态内容不能为空');
    }

    $postId = $db->insert('posts', [
        'user_id' => $userId,
        'content' => $content,
        'images' => H::jsonEncode($images),
    ]);

    $post = $db->selectOne('SELECT * FROM `posts` WHERE id = :id', [':id' => $postId]);
    $post['images'] = H::jsonDecode($post['images'], []);

    H::success($post, '发布成功', 201);
}, [Middleware::class, 'auth']);

// POST /api/posts/{id}/like - 点赞/取消点赞
$router->post('/api/posts/{id}/like', function ($params) {
    $userId = Middleware::requireUserId();
    $db = Database::getInstance();
    $postId = (int)$params['id'];

    $post = $db->selectOne('SELECT * FROM `posts` WHERE id = :id', [':id' => $postId]);
    if (!$post) {
        H::error('动态不存在', 404);
    }

    // 简单实现：使用 favorites 表记录点赞（target_type = 'post'）
    $existing = $db->selectOne(
        'SELECT * FROM `favorites` WHERE user_id = :uid AND target_type = :type AND target_id = :tid',
        [':uid' => $userId, ':type' => 'post', ':tid' => $postId]
    );

    if ($existing) {
        // 已点赞，取消
        $db->delete('favorites', 'user_id = :uid AND target_type = :type AND target_id = :tid',
            [':uid' => $userId, ':type' => 'post', ':tid' => $postId]);
        $db->update('posts', ['like_count' => max(0, $post['like_count'] - 1)], 'id = :id', [':id' => $postId]);
        H::success(['liked' => false], '取消点赞');
    } else {
        // 未点赞，添加
        $db->insert('favorites', [
            'user_id' => $userId,
            'target_type' => 'post',
            'target_id' => $postId,
        ]);
        $db->increment('posts', 'like_count', 1, 'id = :id', [':id' => $postId]);

        // 通知作者
        if ($post['user_id'] != $userId) {
            $db->insert('notifications', [
                'user_id' => $post['user_id'],
                'type' => 'like',
                'title' => '收到新的点赞',
                'content' => '有人赞了你的动态',
            ]);
        }

        H::success(['liked' => true], '点赞成功');
    }
}, [Middleware::class, 'auth']);

// POST /api/posts/{id}/comment - 发表评论
$router->post('/api/posts/{id}/comment', function ($params) {
    $userId = Middleware::requireUserId();
    $body = Middleware::json();
    $db = Database::getInstance();
    $postId = (int)$params['id'];

    $content = H::get($body, 'content', '');
    if (empty($content)) {
        H::error('评论内容不能为空');
    }

    $post = $db->selectOne('SELECT * FROM `posts` WHERE id = :id', [':id' => $postId]);
    if (!$post) {
        H::error('动态不存在', 404);
    }

    $commentId = $db->insert('comments', [
        'user_id' => $userId,
        'target_type' => 'post',
        'target_id' => $postId,
        'content' => $content,
    ]);

    $db->increment('posts', 'comment_count', 1, 'id = :id', [':id' => $postId]);

    // 通知作者
    if ($post['user_id'] != $userId) {
        $db->insert('notifications', [
            'user_id' => $post['user_id'],
            'type' => 'comment',
            'title' => '收到新的评论',
            'content' => '有人评论了你的动态',
        ]);
    }

    $comment = $db->selectOne(
        'SELECT c.*, u.nickname AS author_name, u.avatar AS author_avatar FROM `comments` c JOIN `users` u ON c.user_id = u.id WHERE c.id = :id',
        [':id' => $commentId]
    );

    H::success($comment, '评论成功', 201);
}, [Middleware::class, 'auth']);

// GET /api/posts/{id}/comments - 帖子评论列表
$router->get('/api/posts/{id}/comments', function ($params) {
    $db = Database::getInstance();
    [$page, $pageSize, $offset] = H::getPagination();
    $postId = (int)$params['id'];

    $total = $db->selectValue(
        'SELECT COUNT(*) FROM `comments` WHERE target_type = :type AND target_id = :tid',
        [':type' => 'post', ':tid' => $postId]
    );

    $comments = $db->select(
        "SELECT c.*, u.nickname AS author_name, u.avatar AS author_avatar
         FROM `comments` c
         JOIN `users` u ON c.user_id = u.id
         WHERE c.target_type = :type AND c.target_id = :tid
         ORDER BY c.created_at DESC
         LIMIT {$offset}, {$pageSize}",
        [':type' => 'post', ':tid' => $postId]
    );

    H::success(H::pagination($comments, $total, $page, $pageSize));
});

// ============================================================
// 通知相关
// ============================================================

// GET /api/notifications - 通知列表
$router->get('/api/notifications', function ($params) {
    $userId = Middleware::requireUserId();
    $db = Database::getInstance();
    [$page, $pageSize, $offset] = H::getPagination();

    $total = $db->selectValue('SELECT COUNT(*) FROM `notifications` WHERE user_id = :id', [':id' => $userId]);

    $notifications = $db->select(
        "SELECT * FROM `notifications` WHERE user_id = :id ORDER BY created_at DESC LIMIT {$offset}, {$pageSize}",
        [':id' => $userId]
    );

    // 统计未读数
    $unreadCount = $db->selectValue('SELECT COUNT(*) FROM `notifications` WHERE user_id = :id AND is_read = 0', [':id' => $userId]);

    $result = H::pagination($notifications, $total, $page, $pageSize);
    $result['unreadCount'] = $unreadCount;

    H::success($result);
}, [Middleware::class, 'auth']);

// PUT /api/notifications/read - 标记全部通知已读
$router->put('/api/notifications/read', function ($params) {
    $userId = Middleware::requireUserId();
    $db = Database::getInstance();

    $db->update('notifications', ['is_read' => 1], 'user_id = :id AND is_read = 0', [':id' => $userId]);
    H::success(null, '已全部标记为已读');
}, [Middleware::class, 'auth']);

// ============================================================
// 公告相关
// ============================================================

// GET /api/announcements - 公告列表
$router->get('/api/announcements', function ($params) {
    $db = Database::getInstance();

    $announcements = $db->select('SELECT * FROM `announcements` ORDER BY created_at DESC LIMIT 20');
    H::success($announcements);
});

// ============================================================
// 关注相关
// ============================================================

// POST /api/follow/{userId} - 关注/取消关注
$router->post('/api/follow/{userId}', function ($params) {
    $userId = Middleware::requireUserId();
    $db = Database::getInstance();
    $targetUserId = (int)$params['userId'];

    if ($userId == $targetUserId) {
        H::error('不能关注自己');
    }

    $targetUser = $db->selectOne('SELECT * FROM `users` WHERE id = :id', [':id' => $targetUserId]);
    if (!$targetUser) {
        H::error('用户不存在', 404);
    }

    $existing = $db->selectOne(
        'SELECT * FROM `follows` WHERE follower_id = :fid AND following_id = :tid',
        [':fid' => $userId, ':tid' => $targetUserId]
    );

    if ($existing) {
        // 已关注，取消
        $db->delete('follows', 'follower_id = :fid AND following_id = :tid', [':fid' => $userId, ':tid' => $targetUserId]);
        H::success(['following' => false], '已取消关注');
    } else {
        // 未关注，添加
        $db->insert('follows', [
            'follower_id' => $userId,
            'following_id' => $targetUserId,
        ]);

        // 通知被关注者
        $follower = $db->selectOne('SELECT nickname FROM `users` WHERE id = :id', [':id' => $userId]);
        $db->insert('notifications', [
            'user_id' => $targetUserId,
            'type' => 'follow',
            'title' => '收到新的关注',
            'content' => ($follower['nickname'] ?? '有人') . '关注了你',
        ]);

        H::success(['following' => true], '关注成功');
    }
}, [Middleware::class, 'auth']);

// ============================================================
// 用户公开资料
// ============================================================

// GET /api/users/{userId}/profile - 获取公开用户资料
$router->get('/api/users/{userId}/profile', function ($params) {
    $db = Database::getInstance();
    $userId = (int)$params['userId'];

    $user = $db->selectOne('SELECT id, nickname, avatar, bio, level, role, created_at FROM `users` WHERE id = :id', [':id' => $userId]);
    if (!$user) {
        H::error('用户不存在', 404);
    }

    // 统计数据
    $user['scriptCount'] = $db->selectValue('SELECT COUNT(*) FROM `scripts` WHERE author_id = :id AND status = :status', [':id' => $userId, ':status' => 'published']);
    $user['followerCount'] = $db->selectValue('SELECT COUNT(*) FROM `follows` WHERE following_id = :id', [':id' => $userId]);
    $user['followingCount'] = $db->selectValue('SELECT COUNT(*) FROM `follows` WHERE follower_id = :id', [':id' => $userId]);

    // 检查当前用户是否已关注
    $currentUserId = Auth::getCurrentUserId();
    $user['isFollowing'] = false;
    if ($currentUserId) {
        $follow = $db->selectOne('SELECT id FROM `follows` WHERE follower_id = :fid AND following_id = :tid', [':fid' => $currentUserId, ':tid' => $userId]);
        $user['isFollowing'] = $follow ? true : false;
    }

    H::success($user);
});

// ============================================================
// 收藏相关
// ============================================================

// POST /api/scripts/{id}/favorite - 收藏/取消收藏剧本
$router->post('/api/scripts/{id}/favorite', function ($params) {
    $userId = Middleware::requireUserId();
    $db = Database::getInstance();
    $scriptId = (int)$params['id'];

    $script = $db->selectOne('SELECT * FROM `scripts` WHERE id = :id', [':id' => $scriptId]);
    if (!$script) {
        H::error('剧本不存在', 404);
    }

    $existing = $db->selectOne(
        'SELECT * FROM `favorites` WHERE user_id = :uid AND target_type = :type AND target_id = :tid',
        [':uid' => $userId, ':type' => 'script', ':tid' => $scriptId]
    );

    if ($existing) {
        $db->delete('favorites', 'user_id = :uid AND target_type = :type AND target_id = :tid',
            [':uid' => $userId, ':type' => 'script', ':tid' => $scriptId]);
        $db->update('scripts', ['fav_count' => max(0, $script['fav_count'] - 1)], 'id = :id', [':id' => $scriptId]);
        H::success(['favorited' => false], '已取消收藏');
    } else {
        $db->insert('favorites', [
            'user_id' => $userId,
            'target_type' => 'script',
            'target_id' => $scriptId,
        ]);
        $db->increment('scripts', 'fav_count', 1, 'id = :id', [':id' => $scriptId]);
        H::success(['favorited' => true], '收藏成功');
    }
}, [Middleware::class, 'auth']);

// GET /api/scripts/favorites - 我的收藏列表
$router->get('/api/scripts/favorites', function ($params) {
    $userId = Middleware::requireUserId();
    $db = Database::getInstance();
    [$page, $pageSize, $offset] = H::getPagination();

    $total = $db->selectValue(
        'SELECT COUNT(*) FROM `favorites` WHERE user_id = :uid AND target_type = :type',
        [':uid' => $userId, ':type' => 'script']
    );

    $scripts = $db->select(
        "SELECT s.*, u.nickname AS author_name, f.created_at AS favorited_at
         FROM `favorites` f
         JOIN `scripts` s ON f.target_id = s.id
         JOIN `users` u ON s.author_id = u.id
         WHERE f.user_id = :uid AND f.target_type = :type
         ORDER BY f.created_at DESC
         LIMIT {$offset}, {$pageSize}",
        [':uid' => $userId, ':type' => 'script']
    );

    H::success(H::pagination($scripts, $total, $page, $pageSize));
}, [Middleware::class, 'auth']);
