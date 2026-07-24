<?php
/**
 * Database.php - PDO 数据库封装类
 *
 * 单例模式，支持 MariaDB/MySQL
 * 使用预处理语句防止 SQL 注入
 */

class Database
{
    /** @var Database|null 单例实例 */
    private static ?Database $instance = null;

    /** @var PDO PDO 连接实例 */
    private PDO $pdo;

    /**
     * 私有构造函数，防止外部实例化
     */
    private function __construct()
    {
        $config = require __DIR__ . '/../config/database.php';

        $host = $config['host'];
        $port = $config['port'];
        $dbname = $config['dbname'];
        $user = $config['user'];
        $pass = $config['pass'];
        $charset = $config['charset'] ?? 'utf8mb4';

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset}",
        ];

        try {
            $this->pdo = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => '数据库连接失败: ' . $e->getMessage(),
            ]);
            exit;
        }
    }

    /**
     * 获取单例实例
     */
    public static function getInstance(): Database
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * 获取原生 PDO 连接
     */
    public function getPdo(): PDO
    {
        return $this->pdo;
    }

    /**
     * 查询多行记录
     *
     * @param string $sql SQL 语句
     * @param array $params 绑定参数
     * @return array 查询结果数组
     */
    public function select(string $sql, array $params = []): array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * 查询单行记录
     *
     * @param string $sql SQL 语句
     * @param array $params 绑定参数
     * @return array|null 查询结果，无数据返回 null
     */
    public function selectOne(string $sql, array $params = []): ?array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch();
        return $result !== false ? $result : null;
    }

    /**
     * 查询单个值
     *
     * @param string $sql SQL 语句
     * @param array $params 绑定参数
     * @return mixed 查询结果值
     */
    public function selectValue(string $sql, array $params = [])
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetchColumn();
        return $result !== false ? $result : null;
    }

    /**
     * 插入记录
     *
     * @param string $table 表名
     * @param array $data 关联数组 [字段 => 值]
     * @return int 新插入记录的 ID
     */
    public function insert(string $table, array $data): int
    {
        $columns = array_keys($data);
        $placeholders = array_map(fn($col) => ':' . $col, $columns);

        $sql = "INSERT INTO `{$table}` (`" . implode('`, `', $columns) . "`) 
                VALUES (" . implode(', ', $placeholders) . ")";

        $stmt = $this->pdo->prepare($sql);

        // 绑定参数，正确处理类型
        foreach ($data as $col => $value) {
            $stmt->bindValue(':' . $col, $value);
        }

        $stmt->execute();
        return (int) $this->pdo->lastInsertId();
    }

    /**
     * 更新记录
     *
     * @param string $table 表名
     * @param array $data 要更新的字段 [字段 => 值]
     * @param string $where WHERE 条件
     * @param array $whereParams WHERE 条件参数
     * @return int 受影响行数
     */
    public function update(string $table, array $data, string $where, array $whereParams = []): int
    {
        $setClauses = [];
        $params = [];

        foreach ($data as $col => $value) {
            $paramName = ':set_' . $col;
            $setClauses[] = "`{$col}` = {$paramName}";
            $params[$paramName] = $value;
        }

        $sql = "UPDATE `{$table}` SET " . implode(', ', $setClauses);
        if ($where) {
            $sql .= " WHERE {$where}";
        }

        $stmt = $this->pdo->prepare($sql);

        // 合并参数
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        foreach ($whereParams as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->execute();
        return $stmt->rowCount();
    }

    /**
     * 删除记录
     *
     * @param string $table 表名
     * @param string $where WHERE 条件
     * @param array $params 绑定参数
     * @return int 受影响行数
     */
    public function delete(string $table, string $where, array $params = []): int
    {
        $sql = "DELETE FROM `{$table}`";
        if ($where) {
            $sql .= " WHERE {$where}";
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount();
    }

    /**
     * 原生执行 SQL（用于特殊操作）
     *
     * @param string $sql SQL 语句
     * @param array $params 绑定参数
     * @return int 受影响行数
     */
    public function statement(string $sql, array $params = []): int
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount();
    }

    /**
     * 自增字段
     *
     * @param string $table 表名
     * @param string $column 字段名
     * @param int $increment 增量值
     * @param string $where WHERE 条件
     * @param array $whereParams WHERE 条件参数
     * @return int 受影响行数
     */
    public function increment(string $table, string $column, int $increment, string $where, array $whereParams = []): int
    {
        $sql = "UPDATE `{$table}` SET `{$column}` = `{$column}` + :inc_val";
        if ($where) {
            $sql .= " WHERE {$where}";
        }

        $params = array_merge([':inc_val' => $increment], $whereParams);
        return $this->statement($sql, $params);
    }

    /**
     * 开启事务
     */
    public function beginTransaction(): void
    {
        $this->pdo->beginTransaction();
    }

    /**
     * 提交事务
     */
    public function commit(): void
    {
        $this->pdo->commit();
    }

    /**
     * 回滚事务
     */
    public function rollback(): void
    {
        if ($this->pdo->inTransaction()) {
            $this->pdo->rollBack();
        }
    }

    /**
     * 获取记录总数
     *
     * @param string $table 表名
     * @param string $where WHERE 条件
     * @param array $params 绑定参数
     * @return int 记录总数
     */
    public function count(string $table, string $where = '', array $params = []): int
    {
        $sql = "SELECT COUNT(*) FROM `{$table}`";
        if ($where) {
            $sql .= " WHERE {$where}";
        }
        return (int) $this->selectValue($sql, $params);
    }
}
