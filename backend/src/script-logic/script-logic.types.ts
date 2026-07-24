/**
 * 剧本逻辑引擎类型定义
 * 
 * 这是"剧本自产系统"的核心类型系统，允许创作者通过可视化配置
 * 定义事件链、结局触发器、故事章节等逻辑，而非仅依赖AI一次性生成。
 * 
 * 设计理念（对标UU站点）：
 * 1. 自然语言"叙事规则"为核心 - AI理解并执行
 * 2. 结构化逻辑配置为骨架 - 事件链/条件/触发器
 * 3. AI生成 + 手动编辑双轨制 - 灵活创作
 */

// ========================
// 核心逻辑配置
// ========================

/**
 * 剧本完整逻辑配置
 * 存储在 Script.logicConfig 字段中（JSON字符串）
 */
export interface ScriptLogicConfig {
  /** 事件链 - 按条件触发的剧情事件 */
  eventChains: EventChain[];
  /** 结局触发器 - 满足条件时达成的结局 */
  endingTriggers: EndingTrigger[];
  /** 故事章节 - 章节走向与关键事件 */
  storyArcs: StoryArc[];
  /** NPC触发配置 - NPC相遇条件与好感度阈值 */
  npcTriggerConfig: NpcTriggerConfig[];
  /** 自定义规则 - 自然语言补充规则（注入AI prompt） */
  customRules: string;
  /** 角色创建配置 - 开局选择项 */
  characterCreation: CharacterCreationConfig;
  /** 属性阈值规则 - 属性达到特定值时触发效果 */
  attributeThresholds: AttributeThreshold[];
}

// ========================
// 事件链系统
// ========================

/**
 * 事件链 - 一系列按条件触发的剧情事件
 * 创作者可配置：何时触发、需要什么前置条件、触发后产生什么效果
 */
export interface EventChain {
  id: string;
  name: string;
  description: string;
  /** 触发条件 - 何时检查这个事件 */
  trigger: EventTrigger;
  /** 前置条件 - 全部满足才会触发 */
  conditions: EventCondition[];
  /** 触发后效果 */
  effects: EventEffect[];
  /** 是否只触发一次 */
  onceOnly: boolean;
  /** 优先级（多个事件同时满足时，高优先级先触发） */
  priority: number;
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 事件触发器 - 定义何时检查事件
 */
export interface EventTrigger {
  type: EventTriggerType;
  target: string;
  operator: ConditionOperator;
  value: any;
}

export type EventTriggerType =
  | 'location'        // 进入特定地点
  | 'time'            // 特定时段
  | 'chapter'         // 进入特定章节
  | 'attribute'       // 属性变化
  | 'flag'            // 标记变化
  | 'npc_relation'    // NPC好感度变化
  | 'choice'          // 玩家做出特定选择
  | 'turn_count'      // 回合数
  | 'karma'           // 善恶值
  | 'day'             // 游戏天数
  | 'custom';         // 自定义（通过自然语言描述）

/**
 * 事件条件 - 前置条件检查
 */
export interface EventCondition {
  type: ConditionType;
  target: string;
  operator: ConditionOperator;
  value: any;
  /** 条件描述（供AI理解） */
  description?: string;
}

export type ConditionType =
  | 'attribute'       // 属性值检查
  | 'flag'            // 剧情标记检查
  | 'npc_relation'    // NPC好感度检查
  | 'karma'           // 善恶值检查
  | 'chapter'         // 章节检查
  | 'day'             // 游戏天数检查
  | 'inventory'       // 物品栏检查
  | 'skill'           // 技能检查
  | 'ending'          // 已达成结局检查
  | 'custom';         // 自定义条件

export type ConditionOperator =
  | 'eq'              // 等于
  | 'ne'              // 不等于
  | 'gt'              // 大于
  | 'lt'              // 小于
  | 'gte'             // 大于等于
  | 'lte'             // 小于等于
  | 'contains'        // 包含
  | 'not_contains'    // 不包含
  | 'between'         // 在...之间（value为[min,max]）
  | 'exists';         // 存在/已触发

/**
 * 事件效果 - 触发后产生的变化
 */
export interface EventEffect {
  type: EffectType;
  target: string;
  value: any;
  /** 效果描述（供AI叙事使用） */
  description?: string;
}

export type EffectType =
  | 'attribute_change'    // 属性变化
  | 'flag_set'            // 设置标记
  | 'npc_relation_change' // NPC好感度变化
  | 'karma_change'        // 善恶值变化
  | 'item_give'           // 给予物品
  | 'item_remove'         // 移除物品
  | 'skill_learn'         // 学习技能
  | 'location_change'     // 改变位置
  | 'time_change'         // 改变时间
  | 'chapter_change'      // 改变章节
  | 'narrative'           // 纯叙事效果（AI生成描述）
  | 'combat_start'        // 触发战斗
  | 'ending_trigger'      // 触发结局
  | 'unlock_choice'       // 解锁新选项
  | 'lock_choice'         // 锁定选项
  | 'custom';             // 自定义效果

// ========================
// 结局触发器
// ========================

/**
 * 结局触发器 - 满足所有条件时达成结局
 */
export interface EndingTrigger {
  id: string;
  title: string;
  description: string;
  type: EndingType;
  /** 触发条件 - 全部满足时触发 */
  conditions: EventCondition[];
  /** 优先级（多个结局同时满足时，高优先级优先） */
  priority: number;
  /** 结局叙事文本 */
  narrative: string;
  /** 是否为隐藏结局 */
  isHidden: boolean;
}

export type EndingType =
  | 'good'         // 好结局
  | 'bad'          // 坏结局
  | 'neutral'      // 中性结局
  | 'hidden'       // 隐藏结局
  | 'true_ending'  // 真结局
  | 'death';       // 死亡结局

// ========================
// 故事章节
// ========================

/**
 * 故事章节 - 定义章节走向和关键事件
 * 帮助AI理解整体剧情结构
 */
export interface StoryArc {
  chapter: number;
  title: string;
  summary: string;
  keyEvents: string[];
  /** 进入本章的条件 */
  triggerConditions?: EventCondition[];
  /** 本章重要NPC */
  keyNpcs?: string[];
  /** 本章可用地点 */
  locations?: string[];
}

// ========================
// NPC触发配置
// ========================

/**
 * NPC触发配置 - 定义NPC何时出现及好感度发展
 */
export interface NpcTriggerConfig {
  npcName: string;
  /** 首次相遇条件 */
  meetCondition: EventTrigger;
  /** 相遇场景描述 */
  meetScene: string;
  /** 好感度阈值及解锁内容 */
  relationThresholds: RelationThreshold[];
}

/**
 * 好感度阈值 - 达到特定好感度时解锁内容
 */
export interface RelationThreshold {
  threshold: number;
  level: string;              // 关系等级名称（如"初识"/"好友"/"挚友"/"恋人"）
  description: string;        // 解锁的内容描述
  effects?: EventEffect[];    // 达到阈值时的效果
}

// ========================
// 角色创建配置
// ========================

/**
 * 角色创建配置 - 开局选择项
 * 对标UU的家世/性格/天赋/灵根等选择
 */
export interface CharacterCreationConfig {
  /** 配置字段 - 每个字段是一组选项 */
  fields: CharCreationField[];
  /** 是否允许自定义文本输入 */
  allowCustomText: boolean;
  /** 自定义文本字段配置 */
  customTextFields?: CustomTextField[];
}

/**
 * 角色创建字段
 */
export interface CharCreationField {
  key: string;              // 字段键名（如 origins, personalities）
  label: string;            // 显示名称（如 "家世出身"）
  icon: string;             // 图标emoji
  options: string[];        // 选项列表
  required: boolean;        // 是否必选
  allowRandom: boolean;     // 是否允许随机
  description?: string;     // 字段说明
}

/**
 * 自定义文本字段
 */
export interface CustomTextField {
  key: string;
  label: string;
  icon: string;
  maxLength: number;
  required: boolean;
  placeholder: string;
}

// ========================
// 属性阈值规则
// ========================

/**
 * 属性阈值规则 - 属性达到特定值时触发效果
 * 如：修为达到1000触发渡劫、好感度达到100解锁告白选项
 */
export interface AttributeThreshold {
  attributeName: string;
  threshold: number;
  operator: ConditionOperator;
  effect: EventEffect;
  description: string;
  onceOnly: boolean;
}

// ========================
// 运行时评估结果
// ========================

/**
 * 逻辑评估结果 - 运行时检查所有条件后返回
 */
export interface LogicEvaluationResult {
  /** 已触发的事件 */
  triggeredEvents: TriggeredEvent[];
  /** 已达成的结局 */
  triggeredEndings: TriggeredEnding[];
  /** 当前可用的事件提示（供AI叙事参考） */
  availableEventHints: string[];
  /** 当前章节信息 */
  currentArc: StoryArc | null;
  /** 下一步建议（供AI参考） */
  suggestions: string[];
}

export interface TriggeredEvent {
  eventChainId: string;
  name: string;
  effects: EventEffect[];
  narrative: string;
}

export interface TriggeredEnding {
  endingId: string;
  title: string;
  type: EndingType;
  narrative: string;
}

// ========================
// AI生成请求类型
// ========================

/**
 * 增量生成请求 - 重新生成特定部分
 */
export interface IncrementalGenerateRequest {
  /** 要重新生成的项目 */
  items: GenerateItemType[];
  /** 额外指令（补充说明） */
  extraInstruction?: string;
  /** 是否保留现有内容（false=覆盖，true=合并） */
  mergeMode?: boolean;
}

export type GenerateItemType =
  | 'worldSetting'
  | 'narrativeRules'
  | 'description'
  | 'tags'
  | 'themeColor'
  | 'npcs'
  | 'attributes'
  | 'charConfig'
  | 'openingText'
  | 'storyArcs'
  | 'endings'
  | 'eventChains'
  | 'logicConfig';

/**
 * AI辅助生成请求 - 根据现有内容生成逻辑配置
 */
export interface AiLogicGenerateRequest {
  /** 生成类型 */
  type: 'event_chains' | 'endings' | 'story_arcs' | 'npc_triggers' | 'full_logic';
  /** 现有剧本信息 */
  scriptId: number;
  /** 额外指令 */
  instruction?: string;
}

// ========================
// 默认配置工厂
// ========================

export function createDefaultLogicConfig(): ScriptLogicConfig {
  return {
    eventChains: [],
    endingTriggers: [],
    storyArcs: [],
    npcTriggerConfig: [],
    customRules: '',
    characterCreation: {
      fields: [],
      allowCustomText: true,
      customTextFields: [
        {
          key: 'background',
          label: '背景故事',
          icon: '📜',
          maxLength: 300,
          required: false,
          placeholder: '描述你的角色背景故事...',
        },
        {
          key: 'appearance',
          label: '外貌特征',
          icon: '✨',
          maxLength: 200,
          required: false,
          placeholder: '描述你的角色外貌特征...',
        },
      ],
    },
    attributeThresholds: [],
  };
}

/**
 * 从旧的 charConfig 格式（Record<string, string[]>）转换为新的 CharacterCreationConfig
 */
export function migrateCharConfig(oldConfig: Record<string, string[]>): CharacterCreationConfig {
  const FIELD_META: Record<string, { label: string; icon: string }> = {
    origins: { label: '家世出身', icon: '🏯' },
    spiritualRoots: { label: '灵根属性', icon: '🌿' },
    personalities: { label: '性格特质', icon: '🧠' },
    talents: { label: '天赋特长', icon: '✨' },
    ambitions: { label: '人生志向', icon: '🎯' },
    paths: { label: '发展路线', icon: '🛣️' },
    houses: { label: '霍格沃茨学院', icon: '🏰' },
    bloodStatus: { label: '血统', icon: '🧬' },
    wands: { label: '魔杖', icon: '🪄' },
    genders: { label: '性别', icon: '⚤' },
    positions: { label: '定位', icon: '🎤' },
    backgrounds: { label: '背景', icon: '📜' },
  };

  const fields: CharCreationField[] = Object.entries(oldConfig)
    .filter(([key]) => !key.startsWith('_') && Array.isArray(oldConfig[key]))
    .map(([key, options]) => ({
      key,
      label: FIELD_META[key]?.label || key,
      icon: FIELD_META[key]?.icon || '⚙️',
      options: options as string[],
      required: true,
      allowRandom: true,
    }));

  return {
    fields,
    allowCustomText: true,
    customTextFields: [
      {
        key: 'background',
        label: '背景故事',
        icon: '📜',
        maxLength: 300,
        required: false,
        placeholder: '描述你的角色背景故事...',
      },
      {
        key: 'appearance',
        label: '外貌特征',
        icon: '✨',
        maxLength: 200,
        required: false,
        placeholder: '描述你的角色外貌特征...',
      },
    ],
  };
}
