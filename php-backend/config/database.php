<?php
/**
 * database.php - 数据库配置
 *
 * 从环境变量读取（WSToolbox 的 MariaDB 默认配置）
 * 默认值适配 WSToolbox 环境
 */

return [
    // 数据库主机（WSToolbox 中 MariaDB 默认 localhost）
    'host' => getenv('DB_HOST') ?: 'localhost',

    // 数据库端口（MariaDB 默认 3306）
    'port' => (int)(getenv('DB_PORT') ?: 3306),

    // 数据库名称
    'dbname' => getenv('DB_NAME') ?: 'ai_adventure',

    // 数据库用户名（WSToolbox 默认 root）
    'user' => getenv('DB_USER') ?: 'root',

    // 数据库密码（WSToolbox 默认为空）
    'pass' => getenv('DB_PASS') ?: '',

    // 字符集
    'charset' => 'utf8mb4',
];
