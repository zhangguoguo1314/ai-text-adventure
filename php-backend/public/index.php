<?php
/**
 * index.php - 入口文件 / 路由分发
 *
 * 引入 autoload、设置 CORS、解析请求路径、分发到对应 API 文件
 */

// 错误报告（生产环境可关闭）
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// 设置默认时区
date_default_timezone_set('Asia/Shanghai');

// 自动加载核心类
spl_autoload_register(function ($className) {
    $srcFile = __DIR__ . '/../src/' . $className . '.php';
    if (file_exists($srcFile)) {
        require_once $srcFile;
    }
});

// 设置 CORS 中间件
Middleware::cors();

// 创建路由器
$router = new Router();

// 注册全局 JSON body 中间件（解析请求体到静态变量）
$router->use(function () {
    Middleware::json();
    return null;
});

// 引入 API 路由文件
require_once __DIR__ . '/api/auth.php';
require_once __DIR__ . '/api/scripts.php';
require_once __DIR__ . '/api/game.php';
require_once __DIR__ . '/api/user.php';
require_once __DIR__ . '/api/community.php';

// 分发请求
$router->dispatch();
