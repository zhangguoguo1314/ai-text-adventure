<?php
/**
 * Router.php - 简单路由器
 *
 * 支持 GET/POST/PUT/DELETE 方法注册
 * 支持路径参数解析（如 /api/scripts/{id}）
 * 支持中间件
 */

class Router
{
    /** @var array 注册的路由列表 */
    private array $routes = [];

    /** @var array 全局中间件 */
    private array $globalMiddleware = [];

    /** @var string 当前请求方法 */
    private string $method;

    /** @var string 当前请求路径 */
    private string $path;

    public function __construct()
    {
        $this->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

        // 解析请求路径，去除查询参数
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
        // 去除可能的 index.php 前缀
        $this->path = preg_replace('/^\/index\.php/', '', $uri) ?: '/';
    }

    /**
     * 添加全局中间件
     */
    public function use(callable $middleware): void
    {
        $this->globalMiddleware[] = $middleware;
    }

    /**
     * 注册 GET 路由
     */
    public function get(string $pattern, callable $handler, array $middleware = []): void
    {
        $this->addRoute('GET', $pattern, $handler, $middleware);
    }

    /**
     * 注册 POST 路由
     */
    public function post(string $pattern, callable $handler, array $middleware = []): void
    {
        $this->addRoute('POST', $pattern, $handler, $middleware);
    }

    /**
     * 注册 PUT 路由
     */
    public function put(string $pattern, callable $handler, array $middleware = []): void
    {
        $this->addRoute('PUT', $pattern, $handler, $middleware);
    }

    /**
     * 注册 DELETE 路由
     */
    public function delete(string $pattern, callable $handler, array $middleware = []): void
    {
        $this->addRoute('DELETE', $pattern, $handler, $middleware);
    }

    /**
     * 添加路由到列表
     */
    private function addRoute(string $method, string $pattern, callable $handler, array $middleware): void
    {
        $this->routes[] = [
            'method' => $method,
            'pattern' => $pattern,
            'handler' => $handler,
            'middleware' => $middleware,
        ];
    }

    /**
     * 将路由模式转换为正则表达式
     * 例如 /api/scripts/{id} => /api/scripts/([^/]+)
     *
     * @param string $pattern 路由模式
     * @return array [正则表达式, 参数名列表]
     */
    private function compilePattern(string $pattern): array
    {
        $paramNames = [];

        // 匹配 {paramName} 格式的参数
        $regex = preg_replace_callback(
            '/\{(\w+)\}/',
            function ($matches) use (&$paramNames) {
                $paramNames[] = $matches[1];
                return '([^/]+)';
            },
            $pattern
        );

        // 转义正则特殊字符（除了我们自己加的）
        $regex = str_replace('/', '\/', $regex);

        return ['/^' . $regex . '$/', $paramNames];
    }

    /**
     * 分发请求到匹配的路由
     */
    public function dispatch(): void
    {
        // 执行全局中间件
        foreach ($this->globalMiddleware as $middleware) {
            $result = $middleware();
            if ($result !== null) {
                // 中间件返回非 null 表示中断请求（如已输出响应）
                return;
            }
        }

        // 查找匹配的路由
        foreach ($this->routes as $route) {
            if ($route['method'] !== $this->method) {
                continue;
            }

            [$regex, $paramNames] = $this->compilePattern($route['pattern']);

            if (preg_match($regex, $this->path, $matches)) {
                // 提取路径参数
                $params = [];
                for ($i = 0; $i < count($paramNames); $i++) {
                    $params[$paramNames[$i]] = $matches[$i + 1];
                }

                // 执行路由级中间件
                foreach ($route['middleware'] as $middleware) {
                    $result = $middleware();
                    if ($result !== null) {
                        return;
                    }
                }

                // 调用处理器
                try {
                    $route['handler']($params);
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'message' => '服务器内部错误: ' . $e->getMessage(),
                    ]);
                }
                return;
            }
        }

        // 无匹配路由
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => '接口不存在: ' . $this->method . ' ' . $this->path,
        ]);
    }

    /**
     * 获取当前请求方法
     */
    public function getMethod(): string
    {
        return $this->method;
    }

    /**
     * 获取当前请求路径
     */
    public function getPath(): string
    {
        return $this->path;
    }
}
