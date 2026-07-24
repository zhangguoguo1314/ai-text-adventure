<?php
/**
 * Auth.php - JWT 认证类
 *
 * 原生 PHP 实现 JWT（HS256），不依赖外部包
 * 密码使用 password_hash / password_verify
 */

class Auth
{
    /** @var string|null 当前请求中的用户 ID */
    private static ?int $currentUserId = null;

    /** @var string|null 当前请求中的用户角色 */
    private static ?string $currentUserRole = null;

    /** @var array JWT token 黑名单（基于文件存储，适配 PHP 无状态特性） */
    private static array $blacklist = [];

    /**
     * Base64URL 编码
     */
    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64URL 解码
     */
    private static function base64UrlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * 生成 JWT token
     *
     * @param int $userId 用户 ID
     * @param string $role 用户角色
     * @param int $expireSeconds 过期时间（秒），默认 7 天
     * @return string JWT token
     */
    public static function generateToken(int $userId, string $role, int $expireSeconds = 604800): string
    {
        $config = require __DIR__ . '/../config/app.php';
        $secret = $config['jwt_secret'];

        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT',
        ];

        $now = time();
        $payload = [
            'sub' => $userId,
            'role' => $role,
            'iat' => $now,
            'exp' => $now + $expireSeconds,
        ];

        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', "{$headerEncoded}.{$payloadEncoded}", $secret, true);
        $signatureEncoded = self::base64UrlEncode($signature);

        return "{$headerEncoded}.{$payloadEncoded}.{$signatureEncoded}";
    }

    /**
     * 验证 JWT token
     *
     * @param string $token JWT token
     * @return array|false 解码后的 payload，验证失败返回 false
     */
    public static function verifyToken(string $token)
    {
        $config = require __DIR__ . '/../config/app.php';
        $secret = $config['jwt_secret'];

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;

        // 验证签名
        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', "{$headerEncoded}.{$payloadEncoded}", $secret, true)
        );

        if (!hash_equals($expectedSignature, $signatureEncoded)) {
            return false;
        }

        // 解码 payload
        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);
        if (!$payload) {
            return false;
        }

        // 检查过期时间
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }

        return $payload;
    }

    /**
     * 从请求头获取 token
     *
     * @return string|null
     */
    public static function getTokenFromHeader(): ?string
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

        if ($authHeader && preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }

    /**
     * 设置当前用户（由中间件调用）
     */
    public static function setCurrentUser(int $userId, string $role): void
    {
        self::$currentUserId = $userId;
        self::$currentUserRole = $role;
    }

    /**
     * 获取当前用户 ID
     */
    public static function getCurrentUserId(): ?int
    {
        return self::$currentUserId;
    }

    /**
     * 获取当前用户角色
     */
    public static function getCurrentUserRole(): ?string
    {
        return self::$currentUserRole;
    }

    /**
     * 密码加密（使用 bcrypt）
     *
     * @param string $password 明文密码
     * @return string 加密后的密码哈希
     */
    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_BCRYPT);
    }

    /**
     * 验证密码
     *
     * @param string $password 明文密码
     * @param string $hash 密码哈希
     * @return bool 是否匹配
     */
    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /**
     * 生成邀请码（8 位随机字母数字）
     */
    public static function generateInviteCode(): string
    {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $code = '';
        for ($i = 0; $i < 8; $i++) {
            $code .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return $code;
    }

    /**
     * 清理用户数据（移除敏感字段）
     *
     * @param array $user 用户数据
     * @return array 清理后的用户数据
     */
    public static function sanitizeUser(array $user): array
    {
        unset($user['password_hash']);
        return $user;
    }

    /**
     * 简单加密 API Key（使用 AES-256-CBC）
     *
     * @param string $apiKey 明文 API Key
     * @return array [encrypted, iv]
     */
    public static function encryptApiKey(string $apiKey): array
    {
        $config = require __DIR__ . '/../config/app.php';
        $secret = $config['jwt_secret'];
        $key = substr(hash('sha256', $secret), 0, 32);
        $iv = openssl_random_pseudo_bytes(16);
        $encrypted = openssl_encrypt($apiKey, 'AES-256-CBC', $key, 0, $iv);
        return [
            'encrypted' => base64_encode($encrypted),
            'iv' => base64_encode($iv),
        ];
    }

    /**
     * 解密 API Key
     *
     * @param string $encrypted 加密的 API Key
     * @param string $iv IV 向量
     * @return string 明文 API Key
     */
    public static function decryptApiKey(string $encrypted, string $iv): string
    {
        $config = require __DIR__ . '/../config/app.php';
        $secret = $config['jwt_secret'];
        $key = substr(hash('sha256', $secret), 0, 32);
        return openssl_decrypt(base64_decode($encrypted), 'AES-256-CBC', $key, 0, base64_decode($iv));
    }

    /**
     * 掩码 API Key
     *
     * @param string $apiKey 明文 API Key
     * @return string 掩码后的字符串
     */
    public static function maskApiKey(string $apiKey): string
    {
        $len = strlen($apiKey);
        if ($len <= 8) {
            return str_repeat('*', $len);
        }
        return substr($apiKey, 0, 3) . str_repeat('*', $len - 6) . substr($apiKey, -3);
    }
}
