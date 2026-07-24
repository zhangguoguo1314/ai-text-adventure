<?php
/**
 * auth.php - 认证 API
 *
 * POST /api/auth/register - 注册
 * POST /api/auth/login - 登录
 * POST /api/auth/logout - 登出
 * GET  /api/auth/me - 当前用户
 */

use Helpers as H;

// ============================================================
// POST /api/auth/register - 注册
// ============================================================
$router->post('/api/auth/register', function ($params) {
    $body = Middleware::json();
    $phone = H::get($body, 'phone');
    $email = H::get($body, 'email');
    $password = H::get($body, 'password');
    $nickname = H::get($body, 'nickname');
    $verifyCode = H::get($body, 'verifyCode');
    $inviteCode = H::get($body, 'inviteCode');

    // 验证：手机号或邮箱至少提供一个
    if (empty($phone) && empty($email)) {
        H::error('手机号或邮箱必须提供其中之一');
    }

    // 验证密码
    if (empty($password) || strlen($password) < 6) {
        H::error('密码长度至少6位');
    }

    // 开发模式跳过验证码
    $config = require __DIR__ . '/../../config/app.php';
    if (!$config['dev_mode'] && $verifyCode && $verifyCode !== '000000') {
        H::error('验证码错误');
    }

    $db = Database::getInstance();

    // 检查是否已注册
    $existing = null;
    if ($phone) {
        $existing = $db->selectOne('SELECT id FROM `users` WHERE `phone` = :phone', [':phone' => $phone]);
    }
    if (!$existing && $email) {
        $existing = $db->selectOne('SELECT id FROM `users` WHERE `email` = :email', [':email' => $email]);
    }
    if ($existing) {
        H::error('该手机号或邮箱已注册');
    }

    // 处理邀请码
    $invitedBy = null;
    if ($inviteCode) {
        $inviter = $db->selectOne('SELECT id FROM `users` WHERE `invite_code` = :code', [':code' => $inviteCode]);
        if ($inviter) {
            $invitedBy = $inviter['id'];
        }
    }

    // 生成唯一邀请码
    $newInviteCode = Auth::generateInviteCode();

    // 密码加密
    $passwordHash = Auth::hashPassword($password);

    // 创建用户
    $userId = $db->insert('users', [
        'phone' => $phone ?: null,
        'email' => $email ?: null,
        'password_hash' => $passwordHash,
        'nickname' => $nickname ?: ('用户' . substr(time(), -4)),
        'invite_code' => $newInviteCode,
        'invited_by' => $invitedBy,
    ]);

    // 创建用户余额（注册赠送）
    $db->insert('user_balances', [
        'user_id' => $userId,
        'permanent_balance' => $config['register_bonus'],
    ]);

    // 创建用户偏好
    $db->insert('user_preferences', [
        'user_id' => $userId,
    ]);

    // 记录注册赠送交易
    $db->insert('transaction_logs', [
        'user_id' => $userId,
        'type' => 'income',
        'amount' => $config['register_bonus'],
        'currency' => 'uu',
        'description' => '注册赠送',
    ]);

    // 处理邀请关系
    if ($invitedBy) {
        $db->insert('invitations', [
            'inviter_id' => $invitedBy,
            'invitee_id' => $userId,
            'code' => $inviteCode,
            'invitee_reward_granted' => 1,
        ]);
    }

    // 查询完整用户信息
    $user = $db->selectOne('SELECT * FROM `users` WHERE `id` = :id', [':id' => $userId]);
    $balance = $db->selectOne('SELECT * FROM `user_balances` WHERE `user_id` = :id', [':id' => $userId]);
    $user['balance'] = $balance;

    // 生成 token
    $token = Auth::generateToken($userId, $user['role']);

    H::success([
        'token' => $token,
        'user' => Auth::sanitizeUser($user),
    ]);
});

// ============================================================
// POST /api/auth/login - 登录
// ============================================================
$router->post('/api/auth/login', function ($params) {
    $body = Middleware::json();
    $phone = H::get($body, 'phone');
    $email = H::get($body, 'email');
    $password = H::get($body, 'password');

    if (empty($phone) && empty($email)) {
        H::error('手机号或邮箱必须提供其中之一');
    }

    $db = Database::getInstance();

    // 查询用户
    $user = null;
    if ($phone) {
        $user = $db->selectOne('SELECT * FROM `users` WHERE `phone` = :phone', [':phone' => $phone]);
    }
    if (!$user && $email) {
        $user = $db->selectOne('SELECT * FROM `users` WHERE `email` = :email', [':email' => $email]);
    }

    if (!$user) {
        H::error('用户不存在', 404);
    }

    // 验证密码
    if (!Auth::verifyPassword($password, $user['password_hash'])) {
        H::error('密码错误');
    }

    // 检查状态
    if ($user['status'] !== 'active') {
        H::error('账号已被禁用');
    }

    // 查询余额和偏好
    $balance = $db->selectOne('SELECT * FROM `user_balances` WHERE `user_id` = :id', [':id' => $user['id']]);
    $preferences = $db->selectOne('SELECT * FROM `user_preferences` WHERE `user_id` = :id', [':id' => $user['id']]);
    $user['balance'] = $balance;
    $user['preferences'] = $preferences;

    // 生成 token
    $token = Auth::generateToken($user['id'], $user['role']);

    H::success([
        'token' => $token,
        'user' => Auth::sanitizeUser($user),
    ]);
});

// ============================================================
// POST /api/auth/logout - 登出
// ============================================================
$router->post('/api/auth/logout', function ($params) {
    // JWT 是无状态的，登出在前端清除 token 即可
    // 如需服务端黑名单，可在此记录 token
    H::success(null, '登出成功');
}, [Middleware::class, 'auth']);

// ============================================================
// GET /api/auth/me - 当前用户信息
// ============================================================
$router->get('/api/auth/me', function ($params) {
    $userId = Auth::getCurrentUserId();
    $db = Database::getInstance();

    $user = $db->selectOne('SELECT * FROM `users` WHERE `id` = :id', [':id' => $userId]);
    if (!$user) {
        H::error('用户不存在', 404);
    }

    $balance = $db->selectOne('SELECT * FROM `user_balances` WHERE `user_id` = :id', [':id' => $userId]);
    $preferences = $db->selectOne('SELECT * FROM `user_preferences` WHERE `user_id` = :id', [':id' => $userId]);
    $user['balance'] = $balance;
    $user['preferences'] = $preferences;

    H::success(Auth::sanitizeUser($user));
}, [Middleware::class, 'auth']);
