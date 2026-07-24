<?php
/**
 * Middleware.php - 中间件类
 *
 * 提供 auth（JWT 验证）、cors（跨域头）、json（解析 JSON body）中间件
 */

class Middleware
{
    /**
     * CORS 跨域中间件
     * 设置跨域响应头
     *
     * @return void
     */
    public static function cors(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';

        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');

        // 处理预检请求
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }

    /**
     * JSON body 解析中间件
     * 解析请求体中的 JSON 数据，存入 $_JSON
     *
     * @return array 解析后的 JSON 数据
     */
    public static function json(): array
    {
        static $jsonData = null;

        if ($jsonData === null) {
            $raw = file_get_contents('php://input');
            $jsonData = json_decode($raw, true);
            if (!is_array($jsonData)) {
                $jsonData = [];
            }
        }

        return $jsonData;
    }

    /**
     * 认证中间件
     * 验证 JWT token，设置当前用户
     *
     * @return bool|null 验证成功返回 null，失败输出错误并返回 true（中断）
     */
    public static function auth(): ?bool
    {
        $token = Auth::getTokenFromHeader();

        if (!$token) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => '未提供认证令牌',
            ]);
            return true;
        }

        $payload = Auth::verifyToken($token);

        if (!$payload) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => '认证令牌无效或已过期',
            ]);
            return true;
        }

        // 设置当前用户信息
        Auth::setCurrentUser($payload['sub'], $payload['role']);

        return null;
    }

    /**
     * 管理员认证中间件
     * 验证用户是否为管理员
     *
     * @return bool|null 验证成功返回 null，失败输出错误并返回 true
     */
    public static function admin(): ?bool
    {
        // 先执行普通认证
        if (self::auth() !== null) {
            return true;
        }

        // 检查角色
        if (Auth::getCurrentUserRole() !== 'admin') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => '权限不足，需要管理员权限',
            ]);
            return true;
        }

        return null;
    }

    /**
     * 可选认证中间件
     * 有 token 则验证，无 token 也不报错
     *
     * @return void
     */
    public static function optionalAuth(): void
    {
        $token = Auth::getTokenFromHeader();

        if ($token) {
            $payload = Auth::verifyToken($token);
            if ($payload) {
                Auth::setCurrentUser($payload['sub'], $payload['role']);
            }
        }
    }

    /**
     * 获取当前用户 ID（要求已认证）
     *
     * @return int 用户 ID
     */
    public static function requireUserId(): int
    {
        $userId = Auth::getCurrentUserId();
        if ($userId === null) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => '请先登录',
            ]);
            exit;
        }
        return $userId;
    }
}
