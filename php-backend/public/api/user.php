<?php
/**
 * user.php - 用户 API
 *
 * GET    /api/user/balance          - 获取余额
 * PUT    /api/user/profile          - 更新资料
 * GET    /api/user/custom-ai        - 自定义 API 列表
 * POST   /api/user/custom-ai        - 添加自定义 API
 * PUT    /api/user/custom-ai/{id}   - 更新自定义 API
 * DELETE /api/user/custom-ai/{id}   - 删除自定义 API
 * PUT    /api/user/custom-ai/{id}/default - 设为默认
 * POST   /api/user/recharge         - 充值
 * POST   /api/user/redeem           - 兑换码
 * GET    /api/user/transactions     - 交易记录
 * GET    /api/user/followers        - 粉丝列表
 * GET    /api/user/following        - 关注列表
 */

use Helpers as H;

// ============================================================
// GET /api/user/balance - 获取余额
// ============================================================
$router->get('/api/user/balance', function ($params) {
    $userId = Middleware::requireUserId();
    $db = Database::getInstance();

    $balance = $db->selectOne('SELECT * FROM `user_balances` WHERE user_id = :id', [':id' => $userId]);
    if (!$balance) {
        // 自动创建余额记录
        $db->insert('user_balances', ['user_id' => $userId]);
        $balance = $db->selectOne('SELECT * FROM `user_balances` WHERE user_id = :id', [':id' => $userId]);
    }

    H::success($balance);
}, [Middleware::class, 'auth']);

// ============================================================
// PUT /api/user/profile - 更新资料
// ============================================================
$router->put('/api/user/profile', function ($params) {
    $userId = Middleware::requireUserId();
    $body = Middleware::json();
    $db = Database::getInstance();

    $updateData = [];
    if (isset($body['nickname'])) $updateData['nickname'] = $body['nickname'];
    if (isset($body['avatar'])) $updateData['avatar'] = $body['avatar'];
    if (isset($body['bio'])) $updateData['bio'] = $body['bio'];

    if (!empty($updateData)) {
        $db->update('users', $updateData, 'id = :id', [':id' => $userId]);
    }

    $user = $db->selectOne('SELECT * FROM `users` WHERE id = :id', [':id' => $userId]);
    H::success(Auth::sanitizeUser($user), '更新成功');
}, [Middleware::class, 'auth']);

// ============================================================
// 自定义 AI API 配置
// ============================================================

// GET /api/user/custom-ai - 自定义 API 列表
$router->get('/api/user/custom-ai', function ($params) {
    $userId = Middleware::requireUserId();
    $db = Database::getInstance();

    $configs = $db->select(
        'SELECT * FROM `user_api_configs` WHERE user_id = :id ORDER BY priority DESC',
        [':id' => $userId]
    );

    // 掩码 API Key
    $result = array_map(function ($c) {
        return [
            'id' => (int)$c['id'],
            'provider' => $c['provider'],
            'baseUrl' => $c['base_url'],
            'model' => $c['model'],
            'status' => $c['status'],
            'priority' => (int)$c['priority'],
            'maskedKey' => $c['iv'] ? Auth::maskApiKey(Auth::decryptApiKey($c['encrypted_key'], $c['iv'])) : '****',
            'createdAt' => $c['created_at'],
        ];
    }, $configs);

    H::success($result);
}, [Middleware::class, 'auth']);

// POST /api/user/custom-ai - 添加自定义 API
$router->post('/api/user/custom-ai', function ($params) {
    $userId = Middleware::requireUserId();
    $body = Middleware::json();
    $db = Database::getInstance();

    $apiKey = H::get($body, 'apiKey', '');
    if (empty($apiKey)) {
        H::error('请提供 API Key');
    }

    $encrypted = Auth::encryptApiKey($apiKey);

    $configId = $db->insert('user_api_configs', [
        'user_id' => $userId,
        'provider' => H::get($body, 'provider', 'openai'),
        'base_url' => H::get($body, 'baseUrl', 'https://api.openai.com/v1'),
        'encrypted_key' => $encrypted['encrypted'],
        'iv' => $encrypted['iv'],
        'model' => H::get($body, 'model', ''),
    ]);

    H::success(['id' => $configId, 'maskedKey' => Auth::maskApiKey($apiKey)], '添加成功', 201);
}, [Middleware::class, 'auth']);

// PUT /api/user/custom-ai/{id} - 更新自定义 API
$router->put('/api/user/custom-ai/{id}', function ($params) {
    $userId = Middleware::requireUserId();
    $body = Middleware::json();
    $db = Database::getInstance();
    $id = (int)$params['id'];

    $config = $db->selectOne('SELECT * FROM `user_api_configs` WHERE id = :id AND user_id = :uid', [':id' => $id, ':uid' => $userId]);
    if (!$config) {
        H::error('配置不存在', 404);
    }

    $updateData = [];
    if (isset($body['provider'])) $updateData['provider'] = $body['provider'];
    if (isset($body['baseUrl'])) $updateData['base_url'] = $body['baseUrl'];
    if (isset($body['model'])) $updateData['model'] = $body['model'];
    if (isset($body['status'])) $updateData['status'] = $body['status'];

    // 如果提供了新的 API Key，重新加密
    if (isset($body['apiKey']) && !empty($body['apiKey'])) {
        $encrypted = Auth::encryptApiKey($body['apiKey']);
        $updateData['encrypted_key'] = $encrypted['encrypted'];
        $updateData['iv'] = $encrypted['iv'];
    }

    if (!empty($updateData)) {
        $db->update('user_api_configs', $updateData, 'id = :id', [':id' => $id]);
    }

    H::success(null, '更新成功');
}, [Middleware::class, 'auth']);

// DELETE /api/user/custom-ai/{id} - 删除自定义 API
$router->delete('/api/user/custom-ai/{id}', function ($params) {
    $userId = Middleware::requireUserId();
    $db = Database::getInstance();
    $id = (int)$params['id'];

    $db->delete('user_api_configs', 'id = :id AND user_id = :uid', [':id' => $id, ':uid' => $userId]);
    H::success(null, '删除成功');
}, [Middleware::class, 'auth']);

// PUT /api/user/custom-ai/{id}/default - 设为默认（最高优先级）
$router->put('/api/user/custom-ai/{id}/default', function ($params) {
    $userId = Middleware::requireUserId();
    $db = Database::getInstance();
    $id = (int)$params['id'];

    // 先重置所有优先级为 0
    $db->update('user_api_configs', ['priority' => 0], 'user_id = :uid', [':uid' => $userId]);
    // 设置目标为默认
    $db->update('user_api_configs', ['priority' => 1], 'id = :id AND user_id = :uid', [':id' => $id, ':uid' => $userId]);

    H::success(null, '设置成功');
}, [Middleware::class, 'auth']);

// ============================================================
// 充值与兑换
// ============================================================

// POST /api/user/recharge - 充值（开发模式直接到账）
$router->post('/api/user/recharge', function ($params) {
    $userId = Middleware::requireUserId();
    $body = Middleware::json();
    $db = Database::getInstance();
    $config = require __DIR__ . '/../../config/app.php';

    $amount = (float)H::get($body, 'amount', 0);
    $paymentMethod = H::get($body, 'paymentMethod', 'alipay');

    if ($amount <= 0) {
        H::error('充值金额必须大于0');
    }

    // 计算获得 UU 币
    $uuAmount = (int)ceil($amount * $config['recharge_rate']);

    // 创建支付订单
    $orderNo = H::generateOrderNo();
    $db->insert('payment_orders', [
        'order_no' => $orderNo,
        'user_id' => $userId,
        'amount' => $amount,
        'uu_amount' => $uuAmount,
        'payment_method' => $paymentMethod,
        'trade_no' => $orderNo,
        'status' => 'success', // 开发模式直接成功
    ]);

    // 增加余额
    $balance = $db->selectOne('SELECT * FROM `user_balances` WHERE user_id = :id', [':id' => $userId]);
    if ($balance) {
        $db->update('user_balances', [
            'permanent_balance' => $balance['permanent_balance'] + $uuAmount,
            'total_income' => $balance['total_income'] + $uuAmount,
        ], 'user_id = :id', [':id' => $userId]);
    } else {
        $db->insert('user_balances', [
            'user_id' => $userId,
            'permanent_balance' => $uuAmount,
            'total_income' => $uuAmount,
        ]);
    }

    // 记录交易
    $db->insert('transaction_logs', [
        'user_id' => $userId,
        'type' => 'recharge',
        'amount' => $uuAmount,
        'currency' => 'uu',
        'description' => "充值 {$amount} 元，获得 {$uuAmount} UU币",
        'related_type' => 'payment',
    ]);

    H::success(['uuAmount' => $uuAmount, 'orderNo' => $orderNo], '充值成功');
}, [Middleware::class, 'auth']);

// POST /api/user/redeem - 兑换码
$router->post('/api/user/redeem', function ($params) {
    $userId = Middleware::requireUserId();
    $body = Middleware::json();
    $db = Database::getInstance();

    $code = H::get($body, 'code', '');
    if (empty($code)) {
        H::error('请输入兑换码');
    }

    // 查询兑换码
    $redemption = $db->selectOne('SELECT * FROM `redemption_codes` WHERE code = :code', [':code' => $code]);
    if (!$redemption) {
        H::error('兑换码不存在', 404);
    }
    if ($redemption['current_uses'] >= $redemption['max_uses']) {
        H::error('兑换码已达到最大使用次数');
    }
    if ($redemption['expires_at'] && strtotime($redemption['expires_at']) < time()) {
        H::error('兑换码已过期');
    }

    $uuAmount = $redemption['uu_amount'];

    // 更新兑换码使用次数
    $db->update('redemption_codes', [
        'current_uses' => $redemption['current_uses'] + 1,
    ], 'id = :id', [':id' => $redemption['id']]);

    // 增加余额
    $balance = $db->selectOne('SELECT * FROM `user_balances` WHERE user_id = :id', [':id' => $userId]);
    if ($balance) {
        $db->update('user_balances', [
            'permanent_balance' => $balance['permanent_balance'] + $uuAmount,
            'total_income' => $balance['total_income'] + $uuAmount,
        ], 'user_id = :id', [':id' => $userId]);
    } else {
        $db->insert('user_balances', [
            'user_id' => $userId,
            'permanent_balance' => $uuAmount,
            'total_income' => $uuAmount,
        ]);
    }

    // 记录交易
    $db->insert('transaction_logs', [
        'user_id' => $userId,
        'type' => 'redeem',
        'amount' => $uuAmount,
        'currency' => 'uu',
        'description' => "兑换码 {$code} 兑换 {$uuAmount} UU币",
        'related_type' => 'redeem',
        'related_id' => $redemption['id'],
    ]);

    H::success(['uuAmount' => $uuAmount], '兑换成功');
}, [Middleware::class, 'auth']);

// ============================================================
// GET /api/user/transactions - 交易记录
// ============================================================
$router->get('/api/user/transactions', function ($params) {
    $userId = Middleware::requireUserId();
    $db = Database::getInstance();
    [$page, $pageSize, $offset] = H::getPagination();

    $type = $_GET['type'] ?? '';

    $where = 'user_id = :uid';
    $bindParams = [':uid' => $userId];
    if ($type) {
        $where .= ' AND type = :type';
        $bindParams[':type'] = $type;
    }

    $total = $db->selectValue("SELECT COUNT(*) FROM `transaction_logs` WHERE {$where}", $bindParams);

    $transactions = $db->select(
        "SELECT * FROM `transaction_logs` WHERE {$where} ORDER BY created_at DESC LIMIT {$offset}, {$pageSize}",
        $bindParams
    );

    H::success(H::pagination($transactions, $total, $page, $pageSize));
}, [Middleware::class, 'auth']);

// ============================================================
// GET /api/user/followers - 粉丝列表
// ============================================================
$router->get('/api/user/followers', function ($params) {
    $userId = Middleware::requireUserId();
    $db = Database::getInstance();
    [$page, $pageSize, $offset] = H::getPagination();

    $total = $db->selectValue('SELECT COUNT(*) FROM `follows` WHERE following_id = :id', [':id' => $userId]);

    $followers = $db->select(
        "SELECT u.id, u.nickname, u.avatar, u.bio, f.created_at AS followed_at
         FROM `follows` f
         JOIN `users` u ON f.follower_id = u.id
         WHERE f.following_id = :id
         ORDER BY f.created_at DESC
         LIMIT {$offset}, {$pageSize}",
        [':id' => $userId]
    );

    H::success(H::pagination($followers, $total, $page, $pageSize));
}, [Middleware::class, 'auth']);

// ============================================================
// GET /api/user/following - 关注列表
// ============================================================
$router->get('/api/user/following', function ($params) {
    $userId = Middleware::requireUserId();
    $db = Database::getInstance();
    [$page, $pageSize, $offset] = H::getPagination();

    $total = $db->selectValue('SELECT COUNT(*) FROM `follows` WHERE follower_id = :id', [':id' => $userId]);

    $following = $db->select(
        "SELECT u.id, u.nickname, u.avatar, u.bio, f.created_at AS followed_at
         FROM `follows` f
         JOIN `users` u ON f.following_id = u.id
         WHERE f.follower_id = :id
         ORDER BY f.created_at DESC
         LIMIT {$offset}, {$pageSize}",
        [':id' => $userId]
    );

    H::success(H::pagination($following, $total, $page, $pageSize));
}, [Middleware::class, 'auth']);
