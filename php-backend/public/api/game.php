<?php
/**
 * game.php - 游戏 API
 *
 * POST /api/game/start              - 开始新游戏
 * GET  /api/game/{sessionId}        - 获取游戏状态
 * POST /api/game/{sessionId}/chat   - AI 聊天（轮询模式，返回完整结果）
 * GET  /api/game/{sessionId}/saves  - 存档列表
 * POST /api/game/{sessionId}/save   - 手动存档
 *
 * 注意：PHP 不支持 SSE 长连接，聊天接口使用轮询模式，
 * 调用 AI API 后返回完整 JSON 结果
 */

use Helpers as H;

// ============================================================
// POST /api/game/start - 开始新游戏
// ============================================================
$router->post('/api/game/start', function ($params) {
    $userId = Middleware::requireUserId();
    $body = Middleware::json();
    $scriptId = (int)H::get($body, 'scriptId', 0);
    $db = Database::getInstance();

    if (!$scriptId) {
        H::error('请提供剧本 ID');
    }

    // 查询剧本（含 NPC 和属性）
    $script = $db->selectOne('SELECT * FROM `scripts` WHERE id = :id', [':id' => $scriptId]);
    if (!$script) {
        H::error('剧本不存在', 404);
    }
    if ($script['status'] !== 'published') {
        H::error('该剧本尚未发布', 403);
    }

    $npcs = $db->select('SELECT * FROM `script_npcs` WHERE script_id = :id ORDER BY sort_order', [':id' => $scriptId]);
    $attributes = $db->select('SELECT * FROM `script_attributes` WHERE script_id = :id', [':id' => $scriptId]);

    // 从剧本属性初始化默认值
    $gameAttributes = [];
    foreach ($attributes as $attr) {
        if ($attr['default_val'] !== null && $attr['default_val'] !== '') {
            if ($attr['type'] === 'number') {
                $gameAttributes[$attr['name']] = (float)$attr['default_val'];
            } elseif ($attr['type'] === 'boolean') {
                $gameAttributes[$attr['name']] = ($attr['default_val'] === 'true');
            } else {
                $gameAttributes[$attr['name']] = $attr['default_val'];
            }
        }
    }

    // 初始化 NPC 好感度
    $npcRelations = [];
    foreach ($npcs as $npc) {
        $npcRelations[$npc['name']] = 0;
    }

    // 初始游戏状态
    $gameState = [
        'currentNodeId' => null,
        'attributes' => $gameAttributes,
        'npcRelations' => $npcRelations,
        'inventory' => [],
        'history' => [],
    ];

    // 创建游戏会话
    $sessionId = $db->insert('game_sessions', [
        'user_id' => $userId,
        'script_id' => $scriptId,
        'game_state' => H::jsonEncode($gameState),
    ]);

    // 自动创建初始存档
    $db->insert('saves', [
        'user_id' => $userId,
        'session_id' => $sessionId,
        'game_state' => H::jsonEncode($gameState),
        'description' => '初始存档',
        'is_auto' => 1,
    ]);

    // 更新剧本游玩次数
    $db->increment('scripts', 'play_count', 1, 'id = :id', [':id' => $scriptId]);

    H::success([
        'sessionId' => $sessionId,
        'scriptId' => $scriptId,
        'gameState' => $gameState,
    ]);
}, [Middleware::class, 'auth']);

// ============================================================
// GET /api/game/{sessionId} - 获取游戏状态
// ============================================================
$router->get('/api/game/{sessionId}', function ($params) {
    $userId = Middleware::requireUserId();
    $db = Database::getInstance();
    $sessionId = (int)$params['sessionId'];

    $session = $db->selectOne('SELECT * FROM `game_sessions` WHERE id = :id', [':id' => $sessionId]);
    if (!$session) {
        H::error('游戏会话不存在', 404);
    }
    if ($session['user_id'] != $userId) {
        H::error('无权访问此游戏会话', 403);
    }

    // 查询剧本关联数据
    $script = $db->selectOne('SELECT * FROM `scripts` WHERE id = :id', [':id' => $session['script_id']]);
    $script['npcs'] = $db->select('SELECT * FROM `script_npcs` WHERE script_id = :id ORDER BY sort_order', [':id' => $session['script_id']]);
    $script['attributes'] = $db->select('SELECT * FROM `script_attributes` WHERE script_id = :id', [':id' => $session['script_id']]);

    // 解析 JSON 字段
    foreach ($script['npcs'] as &$npc) {
        // NPC 无需额外解析
    }
    foreach ($script['attributes'] as &$attr) {
        $attr['threshold_rules'] = H::jsonDecode($attr['threshold_rules']);
    }

    H::success([
        'id' => (int)$session['id'],
        'scriptId' => (int)$session['script_id'],
        'script' => $script,
        'gameState' => H::jsonDecode($session['game_state'], []),
        'totalTokens' => (int)$session['total_tokens'],
        'totalCost' => (int)$session['total_cost'],
        'createdAt' => $session['created_at'],
        'updatedAt' => $session['updated_at'],
    ]);
}, [Middleware::class, 'auth']);

// ============================================================
// POST /api/game/{sessionId}/chat - AI 聊天（轮询模式）
// 返回完整的 AI 回复结果
// ============================================================
$router->post('/api/game/{sessionId}/chat', function ($params) {
    $userId = Middleware::requireUserId();
    $body = Middleware::json();
    $db = Database::getInstance();
    $config = require __DIR__ . '/../../config/app.php';
    $sessionId = (int)$params['sessionId'];
    $action = H::get($body, 'action', '');

    if (empty($action)) {
        H::error('请输入玩家行动');
    }

    // 获取游戏会话
    $session = $db->selectOne('SELECT * FROM `game_sessions` WHERE id = :id', [':id' => $sessionId]);
    if (!$session) {
        H::error('游戏会话不存在', 404);
    }
    if ($session['user_id'] != $userId) {
        H::error('无权访问此游戏会话', 403);
    }

    $gameState = H::jsonDecode($session['game_state'], []);

    // 查询剧本和 NPC
    $script = $db->selectOne('SELECT * FROM `scripts` WHERE id = :id', [':id' => $session['script_id']]);
    $npcs = $db->select('SELECT * FROM `script_npcs` WHERE script_id = :id ORDER BY sort_order', [':id' => $session['script_id']]);

    // 构建对话历史
    $history = $gameState['history'] ?? [];

    // 添加玩家最新行动
    $history[] = ['role' => 'user', 'content' => $action];

    // 构建系统 Prompt
    $npcList = array_map(function ($npc) {
        return ['name' => $npc['name'], 'personality' => $npc['personality']];
    }, $npcs);

    $systemPrompt = H::buildGamePrompt($script['world_setting'] ?? '', $gameState, $npcList);

    // 构建消息列表（保留最近20条）
    $messages = [['role' => 'system', 'content' => $systemPrompt]];
    $recentHistory = array_slice($history, -20);
    foreach ($recentHistory as $msg) {
        $messages[] = ['role' => $msg['role'], 'content' => $msg['content']];
    }

    // 预估 token 数并检查余额
    $inputChars = array_sum(array_map(fn($m) => strlen($m['content']), $messages));
    $estimatedInputTokens = (int)ceil($inputChars / 4);

    $balance = $db->selectOne('SELECT * FROM `user_balances` WHERE user_id = :id', [':id' => $userId]);
    if (!$balance) {
        H::error('账户余额不存在，请充值', 402);
    }

    $totalBalance = $balance['permanent_balance'] + $balance['temp_balance'];
    $estimatedCost = (int)ceil($estimatedInputTokens * $config['token_cost_rate']);

    if ($totalBalance < $estimatedCost) {
        H::error("余额不足。需要 {$estimatedCost} UU币，当前余额 {$totalBalance} UU币", 402);
    }

    // 获取用户的自定义 API 配置（如果有）
    $customApi = $db->selectOne(
        'SELECT * FROM `user_api_configs` WHERE user_id = :id AND status = :status ORDER BY priority DESC LIMIT 1',
        [':id' => $userId, ':status' => 'verified']
    );

    $aiOptions = [];
    if ($customApi) {
        $aiOptions['apiKey'] = Auth::decryptApiKey($customApi['encrypted_key'], $customApi['iv']);
        $aiOptions['baseUrl'] = $customApi['base_url'];
        $aiOptions['model'] = $customApi['model'] ?: $config['openai_model'];
    }

    // 调用 AI API（轮询模式：等待完整结果）
    $aiResult = H::callAiApi($messages, $aiOptions);

    if (!$aiResult['success']) {
        H::error('AI 生成失败: ' . $aiResult['error'], 500);
    }

    $fullText = $aiResult['content'];

    // 尝试解析 AI 返回的 JSON
    $parsed = H::parseAiResponse($fullText);
    $narrative = $fullText;
    $choices = [];
    $attributeChanges = [];

    if ($parsed) {
        $narrative = $parsed['narrative'] ?? $fullText;
        $choices = $parsed['choices'] ?? [];
        $attributeChanges = $parsed['attribute_changes'] ?? [];

        // 处理属性变化
        if (!empty($attributeChanges)) {
            foreach ($attributeChanges as $key => $val) {
                $numVal = (float)$val;
                if (isset($gameState['attributes'][$key])) {
                    $gameState['attributes'][$key] += $numVal;
                } else {
                    $gameState['attributes'][$key] = $numVal;
                }
            }
        }
    }

    // 更新对话历史
    $gameState['history'] = $history;
    $gameState['history'][] = ['role' => 'assistant', 'content' => $fullText];

    // 计算 token 和费用
    $outputTokens = (int)ceil(strlen($fullText) / 4);
    $totalTokens = $estimatedInputTokens + $outputTokens;
    $cost = (int)ceil($totalTokens * $config['token_cost_rate']);

    // 扣费（优先扣临时余额）
    $newTemp = $balance['temp_balance'];
    $newPermanent = $balance['permanent_balance'];
    $remaining = $cost;

    if ($newTemp >= $remaining) {
        $newTemp -= $remaining;
        $remaining = 0;
    } else {
        $remaining -= $newTemp;
        $newTemp = 0;
        $newPermanent = max(0, $newPermanent - $remaining);
    }

    $db->update('user_balances', [
        'temp_balance' => max(0, $newTemp),
        'permanent_balance' => max(0, $newPermanent),
    ], 'user_id = :id', [':id' => $userId]);

    // 记录交易日志
    $db->insert('transaction_logs', [
        'user_id' => $userId,
        'type' => 'spend',
        'amount' => $cost,
        'currency' => 'uu',
        'description' => "AI 调用消耗 {$totalTokens} tokens",
        'related_type' => 'ai_call',
        'related_id' => $sessionId,
    ]);

    // 创作者分成（10%）
    $creatorShare = (int)ceil($cost * $config['creator_share_rate']);
    if ($creatorShare > 0 && $script['author_id'] != $userId) {
        $authorId = $script['author_id'];
        $authorBalance = $db->selectOne('SELECT * FROM `user_balances` WHERE user_id = :id', [':id' => $authorId]);

        if ($authorBalance) {
            $db->update('user_balances', [
                'permanent_balance' => $authorBalance['permanent_balance'] + $creatorShare,
                'total_income' => $authorBalance['total_income'] + $creatorShare,
            ], 'user_id = :id', [':id' => $authorId]);
        } else {
            $db->insert('user_balances', [
                'user_id' => $authorId,
                'permanent_balance' => $creatorShare,
                'total_income' => $creatorShare,
            ]);
        }

        $db->insert('transaction_logs', [
            'user_id' => $authorId,
            'type' => 'income',
            'amount' => $creatorShare,
            'currency' => 'uu',
            'description' => '剧本被游玩，创作者分成（10%）',
            'related_type' => 'creator_income',
            'related_id' => $sessionId,
        ]);
    }

    // 更新游戏状态
    $db->update('game_sessions', [
        'game_state' => H::jsonEncode($gameState),
        'total_tokens' => $session['total_tokens'] + $totalTokens,
        'total_cost' => $session['total_cost'] + $cost,
    ], 'id = :id', [':id' => $sessionId]);

    // 返回完整结果（轮询模式，一次性返回所有内容）
    H::success([
        'narrative' => $narrative,
        'choices' => $choices,
        'attributeChanges' => $attributeChanges,
        'gameState' => $gameState,
        'cost' => $cost,
        'totalTokens' => $totalTokens,
        'remainingBalance' => max(0, $newPermanent) + max(0, $newTemp),
    ]);
}, [Middleware::class, 'auth']);

// ============================================================
// GET /api/game/{sessionId}/saves - 存档列表
// ============================================================
$router->get('/api/game/{sessionId}/saves', function ($params) {
    $userId = Middleware::requireUserId();
    $db = Database::getInstance();
    $sessionId = (int)$params['sessionId'];

    $session = $db->selectOne('SELECT * FROM `game_sessions` WHERE id = :id', [':id' => $sessionId]);
    if (!$session) {
        H::error('游戏会话不存在', 404);
    }
    if ($session['user_id'] != $userId) {
        H::error('无权访问此游戏会话', 403);
    }

    $saves = $db->select(
        'SELECT * FROM `saves` WHERE session_id = :id AND user_id = :uid ORDER BY created_at DESC',
        [':id' => $sessionId, ':uid' => $userId]
    );

    $result = array_map(function ($s) {
        return [
            'id' => (int)$s['id'],
            'gameState' => H::jsonDecode($s['game_state'], []),
            'description' => $s['description'],
            'isAuto' => (bool)$s['is_auto'],
            'createdAt' => $s['created_at'],
        ];
    }, $saves);

    H::success($result);
}, [Middleware::class, 'auth']);

// ============================================================
// POST /api/game/{sessionId}/save - 手动存档
// ============================================================
$router->post('/api/game/{sessionId}/save', function ($params) {
    $userId = Middleware::requireUserId();
    $body = Middleware::json();
    $db = Database::getInstance();
    $sessionId = (int)$params['sessionId'];

    $session = $db->selectOne('SELECT * FROM `game_sessions` WHERE id = :id', [':id' => $sessionId]);
    if (!$session) {
        H::error('游戏会话不存在', 404);
    }
    if ($session['user_id'] != $userId) {
        H::error('无权访问此游戏会话', 403);
    }

    $saveId = $db->insert('saves', [
        'user_id' => $userId,
        'session_id' => $sessionId,
        'game_state' => $session['game_state'],
        'description' => H::get($body, 'description', '手动存档'),
        'is_auto' => 0,
    ]);

    $save = $db->selectOne('SELECT * FROM `saves` WHERE id = :id', [':id' => $saveId]);

    H::success([
        'id' => (int)$save['id'],
        'description' => $save['description'],
        'createdAt' => $save['created_at'],
    ], '存档成功');
}, [Middleware::class, 'auth']);
