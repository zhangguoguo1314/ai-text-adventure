<?php
/**
 * scripts.php - 剧本 API
 *
 * GET    /api/scripts              - 剧本列表（分页+搜索+排序）
 * GET    /api/scripts/{id}         - 剧本详情
 * POST   /api/scripts              - 创建剧本
 * PUT    /api/scripts/{id}         - 更新剧本
 * POST   /api/scripts/{id}/publish - 发布剧本
 * GET    /api/scripts/{id}/npcs        - NPC 列表
 * POST   /api/scripts/{id}/npcs        - 添加 NPC
 * PUT    /api/scripts/{id}/npcs/{npcId} - 更新 NPC
 * DELETE /api/scripts/{id}/npcs/{npcId} - 删除 NPC
 * GET    /api/scripts/{id}/attributes  - 属性列表
 * PUT    /api/scripts/{id}/attributes  - 批量更新属性
 * GET    /api/scripts/{id}/nodes       - 节点列表
 * POST   /api/scripts/{id}/nodes       - 创建节点
 * PUT    /api/scripts/{id}/nodes/{nodeId} - 更新节点
 * DELETE /api/scripts/{id}/nodes/{nodeId} - 删除节点
 */

use Helpers as H;

// ============================================================
// GET /api/scripts - 剧本列表
// ============================================================
$router->get('/api/scripts', function ($params) {
    Middleware::optionalAuth();

    $db = Database::getInstance();
    [$page, $pageSize, $offset] = H::getPagination();

    $search = $_GET['search'] ?? '';
    $category = $_GET['category'] ?? '';
    $sort = $_GET['sort'] ?? 'latest';
    $status = $_GET['status'] ?? 'published';

    // 构建查询条件
    $where = ['s.status = :status'];
    $bindParams = [':status' => $status];

    if ($search) {
        $where[] = '(s.title LIKE :search OR s.desc LIKE :search2)';
        $bindParams[':search'] = "%{$search}%";
        $bindParams[':search2'] = "%{$search}%";
    }
    if ($category) {
        $where[] = 's.category = :category';
        $bindParams[':category'] = $category;
    }

    $whereClause = implode(' AND ', $where);

    // 排序
    $orderBy = 's.created_at DESC';
    if ($sort === 'popular') {
        $orderBy = 's.play_count DESC';
    } elseif ($sort === 'rating') {
        $orderBy = 's.fav_count DESC';
    }

    // 查询总数
    $total = $db->selectValue(
        "SELECT COUNT(*) FROM `scripts` s WHERE {$whereClause}",
        $bindParams
    );

    // 查询列表（带作者信息）
    $sql = "SELECT s.*, u.nickname AS author_name, u.avatar AS author_avatar
            FROM `scripts` s
            LEFT JOIN `users` u ON s.author_id = u.id
            WHERE {$whereClause}
            ORDER BY {$orderBy}
            LIMIT {$offset}, {$pageSize}";

    $scripts = $db->select($sql, $bindParams);

    H::success(H::pagination($scripts, $total, $page, $pageSize));
});

// ============================================================
// GET /api/scripts/{id} - 剧本详情
// ============================================================
$router->get('/api/scripts/{id}', function ($params) {
    $db = Database::getInstance();
    $id = (int)$params['id'];

    $script = $db->selectOne(
        "SELECT s.*, u.nickname AS author_name, u.avatar AS author_avatar
         FROM `scripts` s
         LEFT JOIN `users` u ON s.author_id = u.id
         WHERE s.id = :id",
        [':id' => $id]
    );

    if (!$script) {
        H::error('剧本不存在', 404);
    }

    // 查询关联数据
    $script['npcs'] = $db->select(
        'SELECT * FROM `script_npcs` WHERE script_id = :id ORDER BY sort_order ASC',
        [':id' => $id]
    );
    $script['attributes'] = $db->select(
        'SELECT * FROM `script_attributes` WHERE script_id = :id',
        [':id' => $id]
    );
    $script['nodes'] = $db->select(
        'SELECT * FROM `script_nodes` WHERE script_id = :id ORDER BY id ASC',
        [':id' => $id]
    );

    // 解析 JSON 字段
    foreach ($script['nodes'] as &$node) {
        $node['choices'] = H::jsonDecode($node['choices'], []);
        $node['condition'] = H::jsonDecode($node['condition']);
    }
    foreach ($script['attributes'] as &$attr) {
        $attr['threshold_rules'] = H::jsonDecode($attr['threshold_rules']);
    }

    H::success($script);
});

// ============================================================
// POST /api/scripts - 创建剧本
// ============================================================
$router->post('/api/scripts', function ($params) {
    $userId = Middleware::requireUserId();
    $body = Middleware::json();
    $db = Database::getInstance();

    $scriptId = $db->insert('scripts', [
        'author_id' => $userId,
        'title' => H::get($body, 'title', '未命名剧本'),
        'cover' => H::get($body, 'cover'),
        'desc' => H::get($body, 'desc', ''),
        'category' => H::get($body, 'category', 'adventure'),
        'world_setting' => H::get($body, 'worldSetting', ''),
        'style_id' => H::get($body, 'styleId'),
    ]);

    $script = $db->selectOne('SELECT * FROM `scripts` WHERE id = :id', [':id' => $scriptId]);
    H::success($script, '创建成功', 201);
}, [Middleware::class, 'auth']);

// ============================================================
// PUT /api/scripts/{id} - 更新剧本
// ============================================================
$router->put('/api/scripts/{id}', function ($params) {
    $userId = Middleware::requireUserId();
    $body = Middleware::json();
    $db = Database::getInstance();
    $id = (int)$params['id'];

    // 检查权限
    $script = $db->selectOne('SELECT * FROM `scripts` WHERE id = :id', [':id' => $id]);
    if (!$script) {
        H::error('剧本不存在', 404);
    }
    if ($script['author_id'] != $userId && Auth::getCurrentUserRole() !== 'admin') {
        H::error('无权修改此剧本', 403);
    }

    // 构建更新数据
    $updateData = [];
    $fields = ['title', 'cover', 'desc', 'category', 'world_setting', 'style_id'];
    foreach ($fields as $field) {
        $bodyKey = str_replace('_', '', ucwords($field, '_'));
        $bodyKey = lcfirst($bodyKey);
        if (array_key_exists($field, $body) || array_key_exists($bodyKey, $body)) {
            $updateData[$field] = $body[$field] ?? $body[$bodyKey];
        }
    }

    if (!empty($updateData)) {
        $db->update('scripts', $updateData, 'id = :id', [':id' => $id]);
    }

    $script = $db->selectOne('SELECT * FROM `scripts` WHERE id = :id', [':id' => $id]);
    H::success($script, '更新成功');
}, [Middleware::class, 'auth']);

// ============================================================
// POST /api/scripts/{id}/publish - 发布剧本
// ============================================================
$router->post('/api/scripts/{id}/publish', function ($params) {
    $userId = Middleware::requireUserId();
    $db = Database::getInstance();
    $id = (int)$params['id'];

    $script = $db->selectOne('SELECT * FROM `scripts` WHERE id = :id', [':id' => $id]);
    if (!$script) {
        H::error('剧本不存在', 404);
    }
    if ($script['author_id'] != $userId && Auth::getCurrentUserRole() !== 'admin') {
        H::error('无权发布此剧本', 403);
    }

    $db->update('scripts', ['status' => 'published'], 'id = :id', [':id' => $id]);
    H::success(null, '发布成功');
}, [Middleware::class, 'auth']);

// ============================================================
// NPC CRUD
// ============================================================

// GET /api/scripts/{id}/npcs
$router->get('/api/scripts/{id}/npcs', function ($params) {
    $db = Database::getInstance();
    $npcs = $db->select(
        'SELECT * FROM `script_npcs` WHERE script_id = :id ORDER BY sort_order ASC',
        [':id' => (int)$params['id']]
    );
    H::success($npcs);
});

// POST /api/scripts/{id}/npcs
$router->post('/api/scripts/{id}/npcs', function ($params) {
    Middleware::requireUserId();
    $body = Middleware::json();
    $db = Database::getInstance();

    $npcId = $db->insert('script_npcs', [
        'script_id' => (int)$params['id'],
        'name' => H::get($body, 'name', ''),
        'personality' => H::get($body, 'personality', ''),
        'avatar' => H::get($body, 'avatar'),
        'sort_order' => H::get($body, 'sortOrder', 0),
    ]);

    $npc = $db->selectOne('SELECT * FROM `script_npcs` WHERE id = :id', [':id' => $npcId]);
    H::success($npc, '创建成功', 201);
}, [Middleware::class, 'auth']);

// PUT /api/scripts/{id}/npcs/{npcId}
$router->put('/api/scripts/{id}/npcs/{npcId}', function ($params) {
    Middleware::requireUserId();
    $body = Middleware::json();
    $db = Database::getInstance();

    $updateData = [];
    if (isset($body['name'])) $updateData['name'] = $body['name'];
    if (isset($body['personality'])) $updateData['personality'] = $body['personality'];
    if (isset($body['avatar'])) $updateData['avatar'] = $body['avatar'];
    if (isset($body['sortOrder'])) $updateData['sort_order'] = $body['sortOrder'];

    if (!empty($updateData)) {
        $db->update('script_npcs', $updateData, 'id = :id', [':id' => (int)$params['npcId']]);
    }

    $npc = $db->selectOne('SELECT * FROM `script_npcs` WHERE id = :id', [':id' => (int)$params['npcId']]);
    H::success($npc, '更新成功');
}, [Middleware::class, 'auth']);

// DELETE /api/scripts/{id}/npcs/{npcId}
$router->delete('/api/scripts/{id}/npcs/{npcId}', function ($params) {
    Middleware::requireUserId();
    $db = Database::getInstance();

    $db->delete('script_npcs', 'id = :id', [':id' => (int)$params['npcId']]);
    H::success(null, '删除成功');
}, [Middleware::class, 'auth']);

// ============================================================
// 属性 CRUD
// ============================================================

// GET /api/scripts/{id}/attributes
$router->get('/api/scripts/{id}/attributes', function ($params) {
    $db = Database::getInstance();
    $attrs = $db->select(
        'SELECT * FROM `script_attributes` WHERE script_id = :id',
        [':id' => (int)$params['id']]
    );

    foreach ($attrs as &$attr) {
        $attr['threshold_rules'] = H::jsonDecode($attr['threshold_rules']);
    }

    H::success($attrs);
});

// PUT /api/scripts/{id}/attributes - 批量更新属性
$router->put('/api/scripts/{id}/attributes', function ($params) {
    Middleware::requireUserId();
    $body = Middleware::json();
    $db = Database::getInstance();
    $scriptId = (int)$params['id'];

    $attributes = $body['attributes'] ?? $body;

    // 先删除旧属性，再批量插入
    $db->delete('script_attributes', 'script_id = :id', [':id' => $scriptId]);

    foreach ($attributes as $attr) {
        $db->insert('script_attributes', [
            'script_id' => $scriptId,
            'name' => $attr['name'] ?? '',
            'type' => $attr['type'] ?? 'number',
            'min_val' => $attr['minVal'] ?? null,
            'max_val' => $attr['maxVal'] ?? null,
            'default_val' => $attr['defaultVal'] ?? null,
            'threshold_rules' => isset($attr['thresholdRules']) ? H::jsonEncode($attr['thresholdRules']) : null,
        ]);
    }

    $attrs = $db->select('SELECT * FROM `script_attributes` WHERE script_id = :id', [':id' => $scriptId]);
    foreach ($attrs as &$attr) {
        $attr['threshold_rules'] = H::jsonDecode($attr['threshold_rules']);
    }

    H::success($attrs, '批量更新成功');
}, [Middleware::class, 'auth']);

// ============================================================
// 节点 CRUD
// ============================================================

// GET /api/scripts/{id}/nodes
$router->get('/api/scripts/{id}/nodes', function ($params) {
    $db = Database::getInstance();
    $nodes = $db->select(
        'SELECT * FROM `script_nodes` WHERE script_id = :id ORDER BY id ASC',
        [':id' => (int)$params['id']]
    );

    foreach ($nodes as &$node) {
        $node['choices'] = H::jsonDecode($node['choices'], []);
        $node['condition'] = H::jsonDecode($node['condition']);
    }

    H::success($nodes);
});

// POST /api/scripts/{id}/nodes
$router->post('/api/scripts/{id}/nodes', function ($params) {
    Middleware::requireUserId();
    $body = Middleware::json();
    $db = Database::getInstance();

    $nodeId = $db->insert('script_nodes', [
        'script_id' => (int)$params['id'],
        'type' => H::get($body, 'type', 'scene'),
        'content' => H::get($body, 'content', ''),
        'choices' => isset($body['choices']) ? H::jsonEncode($body['choices']) : null,
        'condition' => isset($body['condition']) ? H::jsonEncode($body['condition']) : null,
        'pos_x' => H::get($body, 'posX'),
        'pos_y' => H::get($body, 'posY'),
        'parent_id' => H::get($body, 'parentId'),
    ]);

    $node = $db->selectOne('SELECT * FROM `script_nodes` WHERE id = :id', [':id' => $nodeId]);
    $node['choices'] = H::jsonDecode($node['choices'], []);
    $node['condition'] = H::jsonDecode($node['condition']);
    H::success($node, '创建成功', 201);
}, [Middleware::class, 'auth']);

// PUT /api/scripts/{id}/nodes/{nodeId}
$router->put('/api/scripts/{id}/nodes/{nodeId}', function ($params) {
    Middleware::requireUserId();
    $body = Middleware::json();
    $db = Database::getInstance();

    $updateData = [];
    if (isset($body['type'])) $updateData['type'] = $body['type'];
    if (isset($body['content'])) $updateData['content'] = $body['content'];
    if (isset($body['choices'])) $updateData['choices'] = H::jsonEncode($body['choices']);
    if (isset($body['condition'])) $updateData['condition'] = H::jsonEncode($body['condition']);
    if (isset($body['posX'])) $updateData['pos_x'] = $body['posX'];
    if (isset($body['posY'])) $updateData['pos_y'] = $body['posY'];
    if (isset($body['parentId'])) $updateData['parent_id'] = $body['parentId'];

    if (!empty($updateData)) {
        $db->update('script_nodes', $updateData, 'id = :id', [':id' => (int)$params['nodeId']]);
    }

    $node = $db->selectOne('SELECT * FROM `script_nodes` WHERE id = :id', [':id' => (int)$params['nodeId']]);
    $node['choices'] = H::jsonDecode($node['choices'], []);
    $node['condition'] = H::jsonDecode($node['condition']);
    H::success($node, '更新成功');
}, [Middleware::class, 'auth']);

// DELETE /api/scripts/{id}/nodes/{nodeId}
$router->delete('/api/scripts/{id}/nodes/{nodeId}', function ($params) {
    Middleware::requireUserId();
    $db = Database::getInstance();

    $db->delete('script_nodes', 'id = :id', [':id' => (int)$params['nodeId']]);
    H::success(null, '删除成功');
}, [Middleware::class, 'auth']);
