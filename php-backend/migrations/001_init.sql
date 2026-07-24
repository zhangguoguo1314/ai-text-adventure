-- ============================================================
-- AI 文字冒险 - MySQL 数据库初始化脚本
-- 从 Prisma schema (SQLite) 转换为 MySQL/MariaDB DDL
-- 适用环境：WSToolbox (Nginx + PHP + MariaDB)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ============================================================
-- 用户相关表
-- ============================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `phone` VARCHAR(20) UNIQUE DEFAULT NULL,
  `email` VARCHAR(255) UNIQUE DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `nickname` VARCHAR(100) NOT NULL DEFAULT '',
  `avatar` VARCHAR(500) DEFAULT '/default-avatar.png',
  `bio` TEXT DEFAULT NULL,
  `level` INT NOT NULL DEFAULT 1,
  `role` VARCHAR(20) NOT NULL DEFAULT 'user' COMMENT 'user, creator, admin',
  `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'active, banned, deactivated',
  `invite_code` VARCHAR(20) NOT NULL UNIQUE,
  `invited_by` INT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_phone` (`phone`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_invite_code` (`invite_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_balances` (
  `user_id` INT PRIMARY KEY,
  `permanent_balance` INT NOT NULL DEFAULT 0,
  `temp_balance` INT NOT NULL DEFAULT 0,
  `temp_expire_at` DATETIME DEFAULT NULL,
  `total_income` INT NOT NULL DEFAULT 0,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_balance_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_preferences` (
  `user_id` INT PRIMARY KEY,
  `theme` VARCHAR(20) NOT NULL DEFAULT 'light',
  `model_preference` VARCHAR(100) DEFAULT NULL,
  `use_custom_api` TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT `fk_pref_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 剧本相关表
-- ============================================================

CREATE TABLE IF NOT EXISTS `scripts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `author_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `cover` VARCHAR(500) DEFAULT NULL,
  `desc` TEXT DEFAULT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'adventure',
  `world_setting` TEXT DEFAULT NULL,
  `style_id` INT DEFAULT NULL,
  `play_count` INT NOT NULL DEFAULT 0,
  `fav_count` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'draft' COMMENT 'draft, reviewing, published, rejected, archived',
  `rejection_reason` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_scripts_author` (`author_id`),
  INDEX `idx_scripts_status` (`status`),
  INDEX `idx_scripts_category` (`category`),
  CONSTRAINT `fk_script_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `style_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(10) NOT NULL DEFAULT '✨',
  `preview` VARCHAR(200) NOT NULL DEFAULT '',
  `prompt` TEXT NOT NULL,
  `use_count` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `script_npcs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `script_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `personality` TEXT NOT NULL DEFAULT '',
  `avatar` VARCHAR(500) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  INDEX `idx_npcs_script` (`script_id`),
  CONSTRAINT `fk_npc_script` FOREIGN KEY (`script_id`) REFERENCES `scripts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `script_attributes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `script_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `type` VARCHAR(20) NOT NULL DEFAULT 'number' COMMENT 'number, enum, boolean',
  `min_val` FLOAT DEFAULT NULL,
  `max_val` FLOAT DEFAULT NULL,
  `default_val` VARCHAR(255) DEFAULT NULL,
  `threshold_rules` TEXT DEFAULT NULL COMMENT 'JSON string',
  INDEX `idx_attrs_script` (`script_id`),
  CONSTRAINT `fk_attr_script` FOREIGN KEY (`script_id`) REFERENCES `scripts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `script_nodes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `script_id` INT NOT NULL,
  `type` VARCHAR(20) NOT NULL DEFAULT 'scene' COMMENT 'scene, choice, condition, preset',
  `content` TEXT NOT NULL DEFAULT '',
  `choices` TEXT DEFAULT NULL COMMENT 'JSON string',
  `condition` TEXT DEFAULT NULL COMMENT 'JSON string',
  `pos_x` FLOAT DEFAULT NULL,
  `pos_y` FLOAT DEFAULT NULL,
  `parent_id` INT DEFAULT NULL,
  INDEX `idx_nodes_script` (`script_id`),
  CONSTRAINT `fk_node_script` FOREIGN KEY (`script_id`) REFERENCES `scripts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 游戏相关表
-- ============================================================

CREATE TABLE IF NOT EXISTS `game_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `script_id` INT NOT NULL,
  `game_state` LONGTEXT NOT NULL DEFAULT '{}' COMMENT 'JSON string',
  `total_tokens` INT NOT NULL DEFAULT 0,
  `total_cost` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_sessions_user` (`user_id`),
  INDEX `idx_sessions_script` (`script_id`),
  CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_session_script` FOREIGN KEY (`script_id`) REFERENCES `scripts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `saves` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `session_id` INT NOT NULL,
  `game_state` LONGTEXT NOT NULL DEFAULT '{}' COMMENT 'JSON string',
  `description` VARCHAR(255) NOT NULL DEFAULT '',
  `is_auto` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_saves_user` (`user_id`),
  INDEX `idx_saves_session` (`session_id`),
  CONSTRAINT `fk_save_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_save_session` FOREIGN KEY (`session_id`) REFERENCES `game_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 交易与支付表
-- ============================================================

CREATE TABLE IF NOT EXISTS `transaction_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` VARCHAR(20) NOT NULL COMMENT 'spend, income, recharge, withdraw, redeem',
  `amount` INT NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'uu' COMMENT 'uu, rmb',
  `description` VARCHAR(500) NOT NULL DEFAULT '',
  `related_type` VARCHAR(50) DEFAULT NULL COMMENT 'ai_call, payment, creator_income',
  `related_id` INT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_transactions_user` (`user_id`),
  INDEX `idx_transactions_type` (`type`),
  CONSTRAINT `fk_txn_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_no` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT NOT NULL,
  `amount` FLOAT NOT NULL,
  `uu_amount` INT NOT NULL,
  `payment_method` VARCHAR(20) NOT NULL COMMENT 'alipay, wechat',
  `trade_no` VARCHAR(100) DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending, success, failed, expired',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_orders_user` (`user_id`),
  INDEX `idx_orders_status` (`status`),
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- AI 配置与兑换码表
-- ============================================================

CREATE TABLE IF NOT EXISTS `user_api_configs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `provider` VARCHAR(50) NOT NULL,
  `base_url` VARCHAR(500) NOT NULL,
  `encrypted_key` TEXT NOT NULL,
  `iv` VARCHAR(100) DEFAULT NULL,
  `model` VARCHAR(100) NOT NULL DEFAULT '',
  `status` VARCHAR(20) NOT NULL DEFAULT 'unverified' COMMENT 'unverified, verified',
  `priority` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_api_user` (`user_id`),
  CONSTRAINT `fk_api_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `redemption_codes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `uu_amount` INT NOT NULL,
  `max_uses` INT NOT NULL DEFAULT 1,
  `current_uses` INT NOT NULL DEFAULT 0,
  `expires_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_models` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `display_name` VARCHAR(100) NOT NULL,
  `rate` FLOAT NOT NULL DEFAULT 1.0,
  `backend_model` VARCHAR(200) NOT NULL,
  `multimodal` TINYINT(1) NOT NULL DEFAULT 0,
  `max_tokens` INT NOT NULL DEFAULT 4096,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 社区相关表
-- ============================================================

CREATE TABLE IF NOT EXISTS `posts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `content` TEXT NOT NULL DEFAULT '',
  `images` LONGTEXT NOT NULL DEFAULT '[]' COMMENT 'JSON string',
  `like_count` INT NOT NULL DEFAULT 0,
  `comment_count` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_posts_user` (`user_id`),
  INDEX `idx_posts_created` (`created_at`),
  CONSTRAINT `fk_post_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `target_type` VARCHAR(20) NOT NULL COMMENT 'script, post, app',
  `target_id` INT NOT NULL,
  `content` TEXT NOT NULL DEFAULT '',
  `rating` INT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_comments_target` (`target_type`, `target_id`),
  INDEX `idx_comments_user` (`user_id`),
  CONSTRAINT `fk_comment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `follows` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `follower_id` INT NOT NULL,
  `following_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_follow` (`follower_id`, `following_id`),
  INDEX `idx_follows_follower` (`follower_id`),
  INDEX `idx_follows_following` (`following_id`),
  CONSTRAINT `fk_follow_follower` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_follow_following` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `favorites` (
  `user_id` INT NOT NULL,
  `target_type` VARCHAR(20) NOT NULL COMMENT 'script, post, app, character',
  `target_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `target_type`, `target_id`),
  INDEX `idx_fav_target` (`target_type`, `target_id`),
  CONSTRAINT `fk_fav_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 通知与公告表
-- ============================================================

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT '',
  `title` VARCHAR(200) NOT NULL DEFAULT '',
  `content` TEXT NOT NULL DEFAULT '',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notif_user` (`user_id`),
  INDEX `idx_notif_read` (`is_read`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `content` TEXT NOT NULL DEFAULT '',
  `type` VARCHAR(20) NOT NULL DEFAULT 'normal' COMMENT 'normal, urgent',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 邀请相关表
-- ============================================================

CREATE TABLE IF NOT EXISTS `invitations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `inviter_id` INT NOT NULL,
  `invitee_id` INT NOT NULL UNIQUE,
  `code` VARCHAR(20) NOT NULL,
  `inviter_reward_granted` TINYINT(1) NOT NULL DEFAULT 0,
  `invitee_reward_granted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_invitations_inviter` (`inviter_id`),
  CONSTRAINT `fk_inv_inviter` FOREIGN KEY (`inviter_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_inv_invitee` FOREIGN KEY (`invitee_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 成就相关表
-- ============================================================

CREATE TABLE IF NOT EXISTS `achievements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL DEFAULT '',
  `icon` VARCHAR(10) NOT NULL DEFAULT '🏆',
  `category` VARCHAR(20) NOT NULL DEFAULT 'general' COMMENT 'general, creator, player, social',
  `condition` TEXT NOT NULL DEFAULT '' COMMENT 'JSON: { type, threshold }',
  `reward` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_achievements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `achievement_id` INT NOT NULL,
  `unlocked_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_achievement` (`user_id`, `achievement_id`),
  INDEX `idx_ua_user` (`user_id`),
  CONSTRAINT `fk_ua_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ua_achievement` FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 剧本模板表
-- ============================================================

CREATE TABLE IF NOT EXISTS `script_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'adventure' COMMENT 'adventure, romance, mystery, horror, scifi, fantasy, school, wuxia',
  `description` TEXT NOT NULL DEFAULT '',
  `cover_emoji` VARCHAR(10) NOT NULL DEFAULT '📖',
  `world_setting` TEXT NOT NULL DEFAULT '',
  `style_prompt` TEXT NOT NULL DEFAULT '',
  `npc_template` LONGTEXT NOT NULL DEFAULT '[]' COMMENT 'JSON: [{name, personality}]',
  `attr_template` LONGTEXT NOT NULL DEFAULT '[]' COMMENT 'JSON: [{name, type, defaultVal, minVal, maxVal}]',
  `node_template` LONGTEXT NOT NULL DEFAULT '[]' COMMENT 'JSON: [{type, content, choices}]',
  `use_count` INT NOT NULL DEFAULT 0,
  `rating` FLOAT NOT NULL DEFAULT 0,
  `rating_count` INT NOT NULL DEFAULT 0,
  `author_id` INT DEFAULT NULL COMMENT 'null = 官方模板',
  `is_official` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_templates_category` (`category`),
  INDEX `idx_templates_official` (`is_official`),
  CONSTRAINT `fk_template_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 种子数据
-- ============================================================

-- 管理员账号 admin/admin123
-- 密码哈希使用 PHP password_hash 生成（bcrypt）
INSERT INTO `users` (`id`, `phone`, `email`, `password_hash`, `nickname`, `role`, `status`, `invite_code`) VALUES
(1, NULL, 'admin@example.com', '$2y$10$TLQc9nvK4oZJhLug7y1bWuRYV3WBqVsD78QAJYSbsE5vM2NBR6mG2', '管理员', 'admin', 'active', 'ADMIN001')
ON DUPLICATE KEY UPDATE `nickname` = '管理员';

-- 管理员余额
INSERT INTO `user_balances` (`user_id`, `permanent_balance`, `total_income`) VALUES
(1, 99999, 0)
ON DUPLICATE KEY UPDATE `permanent_balance` = 99999;

-- 管理员偏好
INSERT INTO `user_preferences` (`user_id`) VALUES (1)
ON DUPLICATE KEY UPDATE `user_id` = 1;

-- 风格模板
INSERT INTO `style_templates` (`name`, `icon`, `preview`, `prompt`) VALUES
('武侠仙侠', '⚔️', '古风武侠，剑气纵横', '你是一个古风武侠世界的叙述者。请用古典中文风格描述场景，注重氛围渲染，融入江湖恩怨、武功招式和侠义精神。'),
('现代都市', '🏙️', '现代都市，职场情场', '你是一个现代都市故事的叙述者。请用现代白话文描述场景，融入都市生活元素、职场细节和现代人物关系。'),
('科幻星际', '🚀', '未来科幻，星际探索', '你是一个科幻故事的叙述者。请用科技感的语言描述场景，注重宇宙的宏大感和未来科技细节，融入太空探索和人工智能元素。'),
('恐怖悬疑', '👻', '暗夜惊悚，层层迷雾', '你是一个恐怖悬疑故事的叙述者。请用阴暗压抑的语言描述场景，营造恐怖氛围，注重心理暗示和细节描写，逐步揭示真相。'),
('浪漫言情', '💕', '甜蜜恋爱，心路历程', '你是一个浪漫言情故事的叙述者。请用温暖细腻的语言描述场景，注重人物心理描写和情感变化，融入甜蜜和感动的元素。')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- AI 模型
INSERT INTO `ai_models` (`name`, `display_name`, `rate`, `backend_model`, `multimodal`, `max_tokens`, `is_active`) VALUES
('gpt-4o-mini', 'GPT-4o Mini', 1.0, 'gpt-4o-mini', 1, 4096, 1),
('gpt-4o', 'GPT-4o', 2.5, 'gpt-4o', 1, 8192, 1),
('gpt-3.5-turbo', 'GPT-3.5 Turbo', 0.5, 'gpt-3.5-turbo', 0, 4096, 1),
('claude-3-haiku', 'Claude 3 Haiku', 0.8, 'claude-3-haiku-20240307', 1, 4096, 1),
('claude-3-sonnet', 'Claude 3 Sonnet', 2.0, 'claude-3-sonnet-20240229', 1, 8192, 1),
('deepseek-chat', 'DeepSeek Chat', 0.3, 'deepseek-chat', 0, 4096, 1),
('qwen-turbo', '通义千问 Turbo', 0.2, 'qwen-turbo', 0, 4096, 1)
ON DUPLICATE KEY UPDATE `display_name` = VALUES(`display_name`);

-- 兑换码
INSERT INTO `redemption_codes` (`code`, `uu_amount`, `max_uses`, `current_uses`, `expires_at`) VALUES
('WELCOME100', 100, 1000, 0, '2027-12-31 23:59:59'),
('VIP500', 500, 100, 0, '2027-06-30 23:59:59'),
('TEST999', 999, 10, 0, '2027-12-31 23:59:59')
ON DUPLICATE KEY UPDATE `uu_amount` = VALUES(`uu_amount`);

-- 公告
INSERT INTO `announcements` (`title`, `content`, `type`) VALUES
('欢迎使用 AI Text Adventure', '欢迎来到 AI Text Adventure 平台！注册即送 100 UU币，快来创建你的第一个剧本吧。', 'normal'),
('平台更新通知', '新增社区广场功能，支持发布动态、点赞评论、关注创作者。快来体验吧！', 'normal')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 成就
INSERT INTO `achievements` (`code`, `name`, `description`, `icon`, `category`, `condition`, `reward`) VALUES
('first_login', '新手上路', '完成首次登录，开启你的冒险之旅', '🌱', 'general', '{"type":"first_login","threshold":1}', 50),
('first_script', '初出茅庐', '创作你的第一个剧本', '✍️', 'creator', '{"type":"script_count","threshold":1}', 100),
('famous_creator', '小有名气', '创作 5 个剧本，开始被更多人认识', '📈', 'creator', '{"type":"script_count","threshold":5}', 300),
('master_creator', '创作大师', '创作 10 个剧本，成为真正的创作大师', '🎨', 'creator', '{"type":"script_count","threshold":10}', 800),
('first_explorer', '初探险者', '完成 10 次游戏游玩', '🧭', 'player', '{"type":"play_count","threshold":10}', 100),
('adventurer', '冒险家', '完成 50 次游戏游玩，经验丰富', '⚔️', 'player', '{"type":"play_count","threshold":50}', 500),
('legend_player', '传奇玩家', '完成 100 次游戏游玩，成为传奇', '👑', 'player', '{"type":"play_count","threshold":100}', 1000),
('small_star', '小网红', '获得 10 个粉丝关注', '⭐', 'social', '{"type":"follower_count","threshold":10}', 200),
('popular_star', '人气王', '获得 50 个粉丝关注，人气爆棚', '🌟', 'social', '{"type":"follower_count","threshold":50}', 600),
('collector', '收藏家', '收藏 5 个剧本', '📚', 'player', '{"type":"favorite_count","threshold":5}', 100),
('commenter', '评论家', '发表 10 条评论', '💬', 'social', '{"type":"comment_count","threshold":10}', 150),
('promoter', '推广大使', '成功邀请 5 位好友加入', '🎁', 'social', '{"type":"invite_count","threshold":5}', 500),
('big_spender', '金主爸爸', '累计消费 1000 UU币', '💰', 'general', '{"type":"total_spent","threshold":1000}', 200)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 官方剧本模板
INSERT INTO `script_templates` (`name`, `category`, `description`, `cover_emoji`, `world_setting`, `style_prompt`, `npc_template`, `attr_template`, `node_template`, `use_count`, `rating`, `rating_count`, `is_official`) VALUES
('奇幻冒险', 'fantasy', '剑与魔法的奇幻世界，踏上英雄之旅，探索古老的遗迹与龙族的秘密。', '⚔️', '在艾尔迪亚大陆，魔法与剑刃交织。千年前的龙族战争留下了无数遗迹与宝藏，冒险者公会招募勇者探索未知。你是一名初出茅庐的冒险者，怀揣着成为传奇的英雄梦想，踏上了这片充满奇遇的土地。', '你是一个奇幻冒险故事的叙述者。请用史诗般的语言描述场景，融入魔法元素、种族文化和英雄主义，注重战斗描写和探索发现的惊喜感。', '[{"name":"艾琳娜","personality":"精灵族法师，智慧冷静，对古老魔法有深厚研究，说话带有学者的严谨"},{"name":"索尔","personality":"矮人战士，豪爽直率，力大无穷，喜欢喝酒和讲故事，对朋友极其忠诚"},{"name":"梅林","personality":"神秘的老法师，冒险者公会会长，知晓许多秘密，说话隐晦但总在关键时刻指点迷津"}]', '[{"name":"生命值","type":"number","defaultVal":"100","minVal":0,"maxVal":999},{"name":"魔法值","type":"number","defaultVal":"50","minVal":0,"maxVal":999},{"name":"力量","type":"number","defaultVal":"10","minVal":1,"maxVal":99},{"name":"敏捷","type":"number","defaultVal":"10","minVal":1,"maxVal":99}]', '[{"type":"scene","content":"你站在冒险者公会的大门前，阳光透过彩色玻璃洒在石板路上。门楣上刻着古老的符文，散发着微弱的蓝光。","choices":[]},{"type":"choice","content":"你会怎么做？","choices":[{"text":"推门进入公会"},{"text":"先观察周围环境"},{"text":"检查门上的符文"}]},{"type":"scene","content":"公会大厅内人声鼎沸，各色冒险者在此交流任务信息。柜台后的接待员微笑着看向你。","choices":[]}]', 1280, 4.7, 100, 1),
('校园恋爱', 'romance', '樱花飘落的校园里，一段青涩而甜蜜的恋爱故事正在展开。', '💕', '星海学园，一所综合性高中。樱花大道、天台、图书馆、社团教室——每个角落都可能藏着心动的故事。新学期开始了，转学生来到这里，命运的齿轮悄然转动。', '你是一个校园恋爱故事的叙述者。请用温暖细腻的语言描述场景，注重人物心理描写和情感变化，融入青春校园的日常细节和心动瞬间。', '[{"name":"林晓晓","personality":"班长，温柔体贴，成绩优异，外表文静但内心热情，喜欢在图书馆阅读"},{"name":"苏雨","personality":"美术社社长，活泼开朗，总是带着画板，说话直率但善良，有着艺术家般的感性"},{"name":"陈默","personality":"同班同学，沉默寡言的学霸，看似冷漠实则心思细腻，篮球打得很好"}]', '[{"name":"好感度","type":"number","defaultVal":"50","minVal":0,"maxVal":100},{"name":"勇气","type":"number","defaultVal":"30","minVal":0,"maxVal":100},{"name":"魅力","type":"number","defaultVal":"40","minVal":0,"maxVal":100}]', '[{"type":"scene","content":"开学第一天，你背着书包走进星海学园的校门。樱花瓣随风飘落，空气中弥漫着新学期的气息。","choices":[]},{"type":"choice","content":"你会去哪里？","choices":[{"text":"先去教室报到"},{"text":"去图书馆看看"},{"text":"在校园里逛逛"}]},{"type":"scene","content":"走廊尽头，一个扎着马尾的女生抱着一摞书匆匆跑来，眼看就要撞上你了。","choices":[]}]', 2150, 4.8, 200, 1),
('悬疑推理', 'mystery', '暴风雨之夜，古老的庄园里发生了一起离奇命案。真相只有一个。', '🔍', '1947年，英国乡间的黑鸦庄园。暴风雨切断了所有对外联络，庄园主人亨利·布莱克在书房中离奇死亡。五位嫌疑人被困在庄园内，每个人都有动机，每个人都有不在场证明的破绽。你是受邀前来的侦探，必须在黎明前找出真凶。', '你是一个悬疑推理故事的叙述者。请用冷静克制的语言描述场景，注重细节描写和逻辑推理，营造紧张悬疑的氛围，逐步释放线索引导玩家思考。', '[{"name":"管家雷金纳德","personality":"在庄园服务三十年的老管家，举止得体但眼神闪烁，似乎隐瞒着什么秘密"},{"name":"维多利亚夫人","personality":"死者的妻子，优雅高傲，表面悲痛但嘴角偶尔闪过一丝不易察觉的笑意"},{"name":"詹姆斯医生","personality":"家庭医生，沉稳专业，与死者有金钱纠纷，对毒理学颇有研究"}]', '[{"name":"推理值","type":"number","defaultVal":"60","minVal":0,"maxVal":100},{"name":"线索数","type":"number","defaultVal":"0","minVal":0,"maxVal":99},{"name":"怀疑度","type":"number","defaultVal":"30","minVal":0,"maxVal":100}]', '[{"type":"scene","content":"暴雨倾盆，你站在黑鸦庄园的门廊下。闪电划过夜空，映照出这座维多利亚式建筑的阴森轮廓。管家为你打开了沉重的大门。","choices":[]},{"type":"choice","content":"你会先调查哪里？","choices":[{"text":"前往案发的书房"},{"text":"询问管家案发经过"},{"text":"查看庄园的平面图"}]},{"type":"scene","content":"书房内弥漫着雪茄和威士忌的气味。死者倒在书桌旁，桌上的茶杯还有余温。窗户从内反锁，但窗台上有细微的刮痕。","choices":[]}]', 960, 4.6, 80, 1),
('末日求生', 'horror', '丧尸病毒爆发后的第30天，你和幸存者们在一座废弃超市中艰难求生。', '🧟', '一场不明病毒席卷全球，感染者变成嗜血的丧尸。城市沦陷，通讯中断，政府瓦解。你和几个陌生人在一座废弃的大型超市中建立了临时据点。食物在减少，弹药所剩无几，而丧尸群正在向这里逼近。每一个决定都关乎生死。', '你是一个末日求生故事的叙述者。请用紧张压抑的语言描述场景，注重生存细节和资源管理，营造绝望与希望交织的氛围，每个选择都充满风险。', '[{"name":"老张","personality":"退伍军人，冷静果断，有着丰富的野外生存经验，话不多但每句都切中要害"},{"name":"小雨","personality":"大学生，惊恐但坚强，学过急救知识，是团队中唯一的医疗人员"}]', '[{"name":"生命值","type":"number","defaultVal":"80","minVal":0,"maxVal":100},{"name":"饥饿度","type":"number","defaultVal":"40","minVal":0,"maxVal":100},{"name":"体力","type":"number","defaultVal":"60","minVal":0,"maxVal":100},{"name":"精神值","type":"number","defaultVal":"50","minVal":0,"maxVal":100},{"name":"弹药","type":"number","defaultVal":"12","minVal":0,"maxVal":99}]', '[{"type":"scene","content":"清晨，你被远处传来的嘶吼声惊醒。透过超市破碎的玻璃门，可以看到数十个丧尸正在街道上徘徊。对讲机里传来老张的声音：水源被污染了，我们最多还能撑两天。","choices":[]},{"type":"choice","content":"你决定：","choices":[{"text":"组织小队外出搜寻物资"},{"text":"加固超市防御工事"},{"text":"尝试修复通讯设备求救"}]},{"type":"scene","content":"超市的仓库里，你发现了一扇通往地下停车场的铁门。门缝下有微弱的光线透出，但门上布满了抓痕——有什么东西曾在里面挣扎过。","choices":[]}]', 1540, 4.5, 120, 1),
('武侠江湖', 'wuxia', '刀光剑影的江湖恩怨，一壶浊酒，一把长剑，仗剑天涯。', '🗡️', '大梁朝末年，朝廷腐败，江湖纷争不断。各大门派为争夺失传已久的《天机剑谱》明争暗斗。你本是山野村夫，偶得一位隐世高人传授剑法，如今师父仙逝，你奉遗命下山，踏入这风起云涌的江湖。武林大会在即，一场腥风血雨即将到来。', '你是一个武侠江湖故事的叙述者。请用古典雅致的语言描述场景，融入武功招式、江湖规矩和侠义精神，注重意境营造和人物风骨描写。', '[{"name":"柳如烟","personality":"青云阁阁主之女，武功高强且聪慧过人，外表冷若冰霜实则重情重义，擅长使用暗器"},{"name":"醉道人","personality":"看似疯癫的乞丐老头，实为隐世高手，嗜酒如命，总在关键时刻以看似荒唐的方式指点迷津"},{"name":"萧无痕","personality":"江湖第一快剑，孤傲冷峻，为报师仇行走江湖，与你有不打不相识的缘分"}]', '[{"name":"内力","type":"number","defaultVal":"100","minVal":0,"maxVal":999},{"name":"剑法","type":"number","defaultVal":"20","minVal":1,"maxVal":99},{"name":"轻功","type":"number","defaultVal":"15","minVal":1,"maxVal":99},{"name":"江湖声望","type":"number","defaultVal":"0","minVal":0,"maxVal":999}]', '[{"type":"scene","content":"你背着师父留下的长剑，行走在通往洛阳城的官道上。夕阳西下，远处传来兵刃相交之声。路边茶棚里，几个江湖人士正低声议论着武林大会的消息。","choices":[]},{"type":"choice","content":"你打算：","choices":[{"text":"去茶棚打探消息"},{"text":"循声前往查看"},{"text":"继续赶路不理会"}]},{"type":"scene","content":"茶棚中，一位白衣女子独坐角落，手边放着一把未出鞘的软剑。她注意到你的目光，微微抬起头来，眼中闪过一丝精光。你的剑法……是苍云山的路子？","choices":[]}]', 1120, 4.7, 90, 1),
('科幻探索', 'scifi', '星际移民船"曙光号"在未知星域遭遇异常信号，一段深空冒险就此开始。', '🚀', '公元2387年，人类已开始星际殖民。探索舰"曙光号"执行深空探测任务时，在仙女座边缘捕获了一段未知信号。信号似乎来自一颗不存在于星图上的行星。舰长决定前往调查，而你——舰上的首席科学官——将面对人类历史上最大的发现，或是最大的威胁。', '你是一个科幻探索故事的叙述者。请用充满科技感的语言描述场景，注重宇宙的宏大与神秘，融入硬科幻元素和哲学思考，营造敬畏与未知的氛围。', '[{"name":"舰长赵薇","personality":"曙光号舰长，沉着冷静的军人出身，决策果断但重视船员安全，有着不为人知的过往"},{"name":"AI·星辰","personality":"舰载人工智能系统，理性高效，拥有自主学习能力，偶尔展现出超乎程序的情感波动"}]', '[{"name":"氧气","type":"number","defaultVal":"100","minVal":0,"maxVal":100},{"name":"能源","type":"number","defaultVal":"80","minVal":0,"maxVal":100},{"name":"理智值","type":"number","defaultVal":"90","minVal":0,"maxVal":100},{"name":"科技点","type":"number","defaultVal":"50","minVal":0,"maxVal":999}]', '[{"type":"scene","content":"星图上，那颗未知的行星正逐渐放大。它通体漆黑，不反射任何光线，却持续发出那段神秘的信号。AI·星辰的声音响起：检测到异常重力场，建议保持安全距离。但信号源位于行星表面……","choices":[]},{"type":"choice","content":"你的建议是：","choices":[{"text":"派遣无人机先行侦察"},{"text":"亲自带队登陆调查"},{"text":"尝试解码信号内容"}]},{"type":"scene","content":"登陆舱穿越了浓密的黑雾，降落在一片晶体丛林中。这些晶体发出幽蓝的光芒，排列方式似乎遵循某种规律。你的探测器开始疯狂报警——这些晶体正在呼吸。","choices":[]}]', 870, 4.6, 70, 1),
('恐怖故事', 'horror', '深夜的废弃精神病院，一次 dare 变成的噩梦。你能活着走出去吗？', '👻', '城郊的"安宁疗养院"废弃已有二十年。传闻这里曾发生过骇人听闻的医疗实验，夜深时常有哭声传出。你和三个朋友打赌要在这里过夜。当大门在身后关闭的那一刻，手机信号消失了，而你听到了走廊深处传来的脚步声……', '你是一个恐怖故事的叙述者。请用阴森压抑的语言描述场景，善用环境音效和心理恐惧，节奏由慢及快，制造层层递进的惊悚感，在适当时刻给予 jump scare。', '[{"name":"阿杰","personality":"你的发小，胆大嘴硬，提议来探险的人，但此刻已经有点后悔了"},{"name":"小薇","personality":"灵异爱好者，随身带着 EVP 录音仪和电磁探测器，兴奋中带着不安"}]', '[{"name":"理智值","type":"number","defaultVal":"100","minVal":0,"maxVal":100},{"name":"体力","type":"number","defaultVal":"80","minVal":0,"maxVal":100},{"name":"手电电量","type":"number","defaultVal":"70","minVal":0,"maxVal":100}]', '[{"type":"scene","content":"晚上11点，你们站在疗养院锈迹斑斑的铁门前。月光被乌云遮蔽，只剩下手电筒苍白的光柱。阿杰推了推门，发出刺耳的嘎吱声。空气中有股说不清的腐朽味道。","choices":[]},{"type":"choice","content":"你们决定：","choices":[{"text":"一起从正门进入"},{"text":"分头搜索更快结束"},{"text":"先绕建筑外围看看"}]},{"type":"scene","content":"大厅里散落着破碎的轮椅和发黄的病历。墙上有人用指甲刮出的字迹，歪歪扭扭地写着他们还在这。突然，二楼传来一声重物落地的闷响。","choices":[]}]', 1350, 4.4, 110, 1),
('职场风云', 'school', '从实习生到CEO的逆袭之路，商海沉浮，步步为营。', '💼', '锐星科技，一家快速崛起的互联网独角兽。你刚从名校毕业，以管培生身份进入公司。这里有勾心斗角的办公室政治，也有并肩作战的战友；有惊心动魄的商业博弈，也有温暖人心的职场故事。三个月后就是年度述职，你能否在这场没有硝烟的战争中脱颖而出？', '你是一个职场故事的叙述者。请用现代都市的写实语言描述场景，注重职场细节和人际博弈，融入商业逻辑和职场生存法则，节奏紧凑且贴近现实。', '[{"name":"王总监","personality":"直属上司，严厉但公正的职场老手，嘴上不饶人但会暗中提携有潜力的新人"},{"name":"李娜","personality":"同期管培生，能力出众且野心勃勃，既是合作伙伴也是竞争对手，性格圆滑"},{"name":"老周","personality":"公司元老级工程师，技术大牛但不善交际，对公司有着深厚感情，看不惯办公室政治"}]', '[{"name":"人脉值","type":"number","defaultVal":"30","minVal":0,"maxVal":100},{"name":"业绩分","type":"number","defaultVal":"40","minVal":0,"maxVal":100},{"name":"精力值","type":"number","defaultVal":"80","minVal":0,"maxVal":100}]', '[{"type":"scene","content":"周一早上8:50，你踏入锐星科技的大楼。前台打卡机前排着长队，电梯间人潮涌动。手机弹出消息：王总监让你9:30到会议室，有一个紧急项目要交代。","choices":[]},{"type":"choice","content":"在开会前，你打算：","choices":[{"text":"先去茶水间和同事打听消息"},{"text":"直接去工位准备材料"},{"text":"找李娜了解情况"}]},{"type":"scene","content":"会议室里，王总监面色凝重：竞品提前发布了相似功能，我们的项目必须提前两周上线。这个任务，我交给你负责协调。整个房间安静了几秒。李娜看了你一眼，眼神复杂。","choices":[]}]', 780, 4.3, 60, 1),
('星际海盗', 'scifi', '在星际边境，成为一名法外之徒，劫掠商船，追寻传说中的宇宙宝藏。', '🏴‍☠️', '银河联邦的边境星域——"无主地带"，法律触及不到的三不管区域。这里充斥着星际海盗、走私犯和赏金猎人。你是"夜枭号"的船长，带着一群亡命之徒在这片星域中谋生。传说在星云深处，藏着一艘远古文明的遗舰，里面的财富足以买下整个星系。', '你是一个太空冒险故事的叙述者。请用洒脱不羁的语言描述场景，融入太空战斗和星际走私的刺激感，角色对话要有江湖气息和黑色幽默。', '[{"name":"凯特","personality":"副船长兼领航员，冷酷高效的前联邦军官，因某次事件叛逃，是你最信任的搭档"},{"name":"齿轮","personality":"机械师兼炮手，矮壮的半机械人，爱开玩笑但技术一流，总能把破船修好"},{"name":"先知","personality":"神秘的异星族裔，能感知星域波动，说话如同谜语，没人知道其真实来历"}]', '[{"name":"船体值","type":"number","defaultVal":"100","minVal":0,"maxVal":100},{"name":"燃料","type":"number","defaultVal":"70","minVal":0,"maxVal":100},{"name":"赏金","type":"number","defaultVal":"50000","minVal":0,"maxVal":999999},{"name":"声望","type":"number","defaultVal":"30","minVal":0,"maxVal":100}]', '[{"type":"scene","content":"夜枭号漂浮在小行星带的阴影中。雷达上，一艘联邦补给舰正缓缓驶过。凯特凑过来：船长，这批货至少值三十万信用点，但护航舰有两艘。齿轮在后面嘿嘿一笑：就看你的了，老大。","choices":[]},{"type":"choice","content":"你的决定：","choices":[{"text":"正面强攻，速战速决"},{"text":"用电磁脉冲偷袭"},{"text":"放长线，跟踪到目的地再说"}]},{"type":"scene","content":"战斗结束后，你们在补给舰货舱里发现了一个上锁的合金箱子。箱子上刻着远古文明的纹路，和传说中遗舰上的符号一模一样。先知抚摸着箱子，瞳孔微微震动：它……在呼唤。","choices":[]}]', 690, 4.5, 50, 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ============================================================
-- 完成
-- ============================================================
SELECT '数据库初始化完成！' AS message;
