<?php
/**
 * app.php - 应用配置
 *
 * JWT 密钥、AI API 配置、注册赠送等业务配置
 */

return [
    // JWT 签名密钥（生产环境请修改为随机长字符串）
    'jwt_secret' => getenv('JWT_SECRET') ?: 'ai-adventure-wstoolbox-secret-key-change-in-production-2024',

    // AI API 配置 - OpenAI 兼容格式
    'openai_api_key' => getenv('OPENAI_API_KEY') ?: '',
    'openai_base_url' => getenv('OPENAI_BASE_URL') ?: 'https://api.openai.com/v1',
    'openai_model' => getenv('OPENAI_MODEL') ?: 'gpt-4o-mini',

    // 注册赠送 UU 币数量
    'register_bonus' => (int)(getenv('REGISTER_BONUS') ?: 100),

    // AI 调用计费比例（每 10 token 扣 1 UU 币）
    'token_cost_rate' => 0.1,

    // 创作者分成比例（10%）
    'creator_share_rate' => 0.1,

    // 充值汇率（1 RMB = ? UU 币）
    'recharge_rate' => 10,

    // 是否开启开发模式（跳过验证码等）
    'dev_mode' => getenv('DEV_MODE') !== false ? getenv('DEV_MODE') === 'true' : true,
];
