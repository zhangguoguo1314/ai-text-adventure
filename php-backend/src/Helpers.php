<?php
/**
 * Helpers.php - 工具函数
 *
 * 提供响应输出、分页、JSON 编解码等通用工具
 */

class Helpers
{
    /**
     * 输出 JSON 成功响应
     *
     * @param mixed $data 响应数据
     * @param string $message 消息
     * @param int $code HTTP 状态码
     */
    public static function success($data = null, string $message = '', int $code = 200): void
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => true,
            'data' => $data,
            'message' => $message,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * 输出 JSON 错误响应
     *
     * @param string $message 错误消息
     * @param int $code HTTP 状态码
     * @param mixed $data 额外数据
     */
    public static function error(string $message, int $code = 400, $data = null): void
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        $response = [
            'success' => false,
            'message' => $message,
        ];
        if ($data !== null) {
            $response['data'] = $data;
        }
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * 获取分页参数
     *
     * @return array [page, pageSize, offset]
     */
    public static function getPagination(): array
    {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $pageSize = min(100, max(1, (int)($_GET['pageSize'] ?? 20)));
        $offset = ($page - 1) * $pageSize;
        return [$page, $pageSize, $offset];
    }

    /**
     * 构建分页响应数据
     *
     * @param array $items 数据列表
     * @param int $total 总数
     * @param int $page 当前页
     * @param int $pageSize 每页数量
     * @return array 分页响应结构
     */
    public static function pagination(array $items, int $total, int $page, int $pageSize): array
    {
        return [
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalPages' => ceil($total / $pageSize),
        ];
    }

    /**
     * 安全获取数组值
     *
     * @param array $arr 数组
     * @param string $key 键名
     * @param mixed $default 默认值
     * @return mixed
     */
    public static function get(array $arr, string $key, $default = null)
    {
        return $arr[$key] ?? $default;
    }

    /**
     * 解析 JSON 字符串，失败返回默认值
     *
     * @param string|null $json JSON 字符串
     * @param mixed $default 默认值
     * @return mixed
     */
    public static function jsonDecode(?string $json, $default = null)
    {
        if ($json === null || $json === '') {
            return $default;
        }
        $result = json_decode($json, true);
        return $result === null ? $default : $result;
    }

    /**
     * JSON 编码（不转义 Unicode）
     *
     * @param mixed $data 数据
     * @return string
     */
    public static function jsonEncode($data): string
    {
        return json_encode($data, JSON_UNESCAPED_UNICODE);
    }

    /**
     * 获取当前时间（MySQL DATETIME 格式）
     *
     * @return string
     */
    public static function now(): string
    {
        return date('Y-m-d H:i:s');
    }

    /**
     * 生成订单号
     *
     * @return string
     */
    public static function generateOrderNo(): string
    {
        return 'ORD' . date('YmdHis') . str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);
    }

    /**
     * 使用 cURL 调用 AI API（OpenAI 兼容格式）
     * 返回完整结果（非流式，适配 PHP 轮询模式）
     *
     * @param array $messages 消息列表 [{role, content}]
     * @param array $options 选项 [model, maxTokens, apiKey, baseUrl]
     * @return array [success, content, error]
     */
    public static function callAiApi(array $messages, array $options = []): array
    {
        $config = require __DIR__ . '/../config/app.php';

        $apiKey = $options['apiKey'] ?? ($config['openai_api_key'] ?? '');
        $baseUrl = $options['baseUrl'] ?? ($config['openai_base_url'] ?? 'https://api.openai.com/v1');
        $model = $options['model'] ?? 'gpt-4o-mini';
        $maxTokens = $options['maxTokens'] ?? 2048;

        // 无 API Key 时返回模拟数据
        if (empty($apiKey)) {
            return self::mockAiResponse();
        }

        $url = rtrim($baseUrl, '/') . '/chat/completions';

        $postData = json_encode([
            'model' => $model,
            'messages' => $messages,
            'max_tokens' => $maxTokens,
            'stream' => false,
        ]);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postData,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $apiKey,
                'Content-Type: application/json',
            ],
            CURLOPT_TIMEOUT => 60,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            return [
                'success' => false,
                'content' => '',
                'error' => 'AI API 请求失败: ' . $error,
            ];
        }

        if ($httpCode !== 200) {
            return [
                'success' => false,
                'content' => '',
                'error' => "AI API 返回错误 (HTTP {$httpCode}): {$response}",
            ];
        }

        $data = json_decode($response, true);
        $content = $data['choices'][0]['message']['content'] ?? '';

        return [
            'success' => true,
            'content' => $content,
            'error' => null,
        ];
    }

    /**
     * 模拟 AI 响应（无 API Key 时的开发模式）
     *
     * @return array
     */
    private static function mockAiResponse(): array
    {
        $mockResponse = json_encode([
            'narrative' => '你站在一片广袤的草原上，远处隐约可以看到一座古老的城堡。风中传来若有若无的音乐声，仿佛在召唤着你。天空呈现出奇异的紫色，星辰在白昼中闪烁。',
            'choices' => ['向城堡走去', '寻找音乐声的来源', '在原地驻足观察', '回头查看来时的路'],
            'attribute_changes' => ['勇气' => 5, '智慧' => 3, '人气' => 2],
        ], JSON_UNESCAPED_UNICODE);

        return [
            'success' => true,
            'content' => $mockResponse,
            'error' => null,
        ];
    }

    /**
     * 构建游戏系统 Prompt
     *
     * @param string $worldSetting 世界观设定
     * @param array $gameState 游戏状态
     * @param array $npcList NPC 列表 [{name, personality}]
     * @return string 系统 Prompt
     */
    public static function buildGamePrompt(string $worldSetting, array $gameState, array $npcList): string
    {
        $prompt = "你是一个文字冒险游戏的叙述者。请根据玩家的行动，描述接下来发生的事情。\n\n";

        if ($worldSetting) {
            $prompt .= "【世界观规则】\n{$worldSetting}\n\n";
        }

        $prompt .= "【当前场景属性】\n";
        foreach ($gameState['attributes'] ?? [] as $key => $val) {
            $prompt .= "- {$key}: {$val}\n";
        }
        $prompt .= "\n";

        if (!empty($npcList)) {
            $prompt .= "【NPC列表】\n";
            foreach ($npcList as $npc) {
                $relation = $gameState['npcRelations'][$npc['name']] ?? 0;
                $prompt .= "- {$npc['name']}: {$npc['personality']}（好感度: {$relation}）\n";
            }
            $prompt .= "\n";
        }

        $prompt .= "请根据玩家的行动，描述接下来发生的事情，并在最后提供2-4个选项供玩家选择。\n";
        $prompt .= "必须严格使用以下JSON格式返回：\n";
        $prompt .= '{"narrative": "场景描述...", "choices": ["选项A", "选项B", "选项C"], "attribute_changes": {"属性名": 变化值}}' . "\n";
        $prompt .= "注意：\n";
        $prompt .= "- narrative 是场景的详细描述，要生动有趣\n";
        $prompt .= "- choices 是2-4个供玩家选择的选项\n";
        $prompt .= "- attribute_changes 是属性变化，值为数字（正负均可），没有变化则为{}\n";

        return $prompt;
    }

    /**
     * 解析 AI 返回的 JSON 内容
     * 尝试从文本中提取 JSON 对象
     *
     * @param string $text AI 返回的文本
     * @return array|null 解析结果，失败返回 null
     */
    public static function parseAiResponse(string $text): ?array
    {
        // 尝试直接解析
        $result = json_decode($text, true);
        if ($result !== null) {
            return $result;
        }

        // 尝试从文本中提取 JSON
        if (preg_match('/\{[\s\S]*\}/', $text, $matches)) {
            $result = json_decode($matches[0], true);
            if ($result !== null) {
                return $result;
            }
        }

        return null;
    }
}
