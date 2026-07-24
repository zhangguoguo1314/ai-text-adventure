/**
 * 游戏引擎增强类型定义
 * 包含所有扩展的 GameState 子类型和辅助接口
 */

/** 物品栏物品 */
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'consumable' | 'quest' | 'key' | 'special';
  quantity: number;
  stats?: Record<string, number>;       // 物品属性加成
  emoji?: string;                         // 物品图标
}

/** 已学技能 */
export interface Skill {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  cooldown: number;                       // 冷却回合数
  currentCooldown: number;
  emoji?: string;
}

/** 游戏消息（对话历史） */
export interface GameMessage {
  role: 'system' | 'narrator' | 'player' | 'npc' | 'combat';
  content: string;
  npcName?: string;                       // 哪个NPC说的
  type?: 'narrative' | 'dialogue' | 'combat' | 'item' | 'skill' | 'event' | 'ending';
  metadata?: Record<string, any>;         // 额外数据（物品变化、属性变化等）
}

/** 战斗状态 */
export interface CombatState {
  enemyName: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemyAttack: number;
  enemyDefense: number;
  playerHp: number;
  playerMaxHp: number;
  playerDefense: number;
  turn: number;
  isDefending: boolean;                   // 玩家本回合是否防御
  rewards?: string[];                     // 战斗奖励物品ID
}

/** 一天中的时段 */
export type DayTime = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

/** 完整的游戏状态（扩展版） */
export interface GameState {
  currentNodeId: number | null;
  attributes: Record<string, any>;
  npcRelations: Record<string, number>;
  inventory: InventoryItem[];
  history: GameMessage[];
  skills: Skill[];
  flags: Record<string, boolean>;          // 剧情/事件标记
  chapter: number;                         // 当前章节
  dayTime: DayTime;
  day: number;                             // 游戏内天数
  location: string;                        // 当前位置
  karma: number;                           // 善恶值(-100~100)
  endings: string[];                       // 已达成结局
  achievements: string[];                  // 游戏内已达成成就
  combat: CombatState | null;             // 战斗状态
  // UU平台对标扩展
  characterConfig?: CharacterConfig;       // 角色创建配置（开局选择的家世/性格/特质等）
  relationshipFlags?: Record<string, RelationshipFlag>; // NPC关系标记（是否告白/是否结缘/是否背叛等）
  eventLog?: GameEvent[];                  // 重要事件日志（蝴蝶效应追踪）
  customData?: Record<string, any>;        // 剧本自定义数据（供内置APP等使用）
}

/** 角色创建配置 - 对标UU的家世/性格/特质等开局选择 */
export interface CharacterConfig {
  origin?: string;           // 出身/家世
  personality?: string;      // 性格
  talent?: string;           // 天赋
  ambition?: string;         // 志向
  path?: string;             // 修炼/发展路线
  gender?: string;           // 性别（全性向支持）
  appearance?: string;       // 外貌描述
  background?: string;       // 背景故事
  customFields?: Record<string, string>; // 自定义字段
}

/** NPC关系标记 - 追踪关键关系节点 */
export interface RelationshipFlag {
  met: boolean;              // 是否已相遇
  friend: boolean;           // 是否成为朋友
  close: boolean;            // 是否亲密
  lover: boolean;            // 是否恋人
  betrayed: boolean;         // 是否背叛
  customFlags?: Record<string, boolean>;
}

/** 游戏事件日志 - 蝴蝶效应追踪 */
export interface GameEvent {
  id: string;
  type: 'choice' | 'combat' | 'social' | 'discovery' | 'romance' | 'death' | 'custom';
  description: string;
  chapter: number;
  day: number;
  consequences?: string;     // 后果描述
  timestamp: number;
}

/** AI 返回的扩展 JSON 格式 */
export interface AiResponse {
  narrative: string;
  choices: string[];
  attribute_changes: Record<string, number>;
  item_changes?: ItemChange[];
  skill_changes?: SkillChange[];
  flag_changes?: FlagChange[];
  karma_change?: number;
  location_change?: string;
  time_change?: DayTime;
  npc_relation_changes?: NpcRelationChange[];
  dialogue?: { npc: string; content: string };
  combat?: {
    trigger: boolean;
    enemy: {
      name: string;
      hp: number;
      maxHp: number;
      attack: number;
      defense: number;
      rewards?: string[];
    };
  };
  ending?: { id: string; title: string; description: string };
  achievement?: { id: string; name: string };
}

/** 物品变化事件 */
export interface ItemChange {
  action: 'add' | 'remove' | 'equip';
  item: Partial<InventoryItem> & { id: string; name: string };
}

/** 技能变化事件 */
export interface SkillChange {
  action: 'learn' | 'upgrade';
  skill: Partial<Skill> & { id: string; name: string };
}

/** Flag 变化事件 */
export interface FlagChange {
  flag: string;
  value: boolean;
}

/** NPC 好感度变化事件 */
export interface NpcRelationChange {
  npc: string;
  change: number;
}

/** SSE 流式消息类型 */
export interface StreamMessage {
  type:
    | 'text'
    | 'choices'
    | 'attribute_change'
    | 'item_change'
    | 'skill_change'
    | 'flag_change'
    | 'karma_change'
    | 'location_change'
    | 'time_change'
    | 'npc_relation_change'
    | 'dialogue'
    | 'combat_start'
    | 'combat_update'
    | 'combat_end'
    | 'ending'
    | 'achievement'
    | 'done'
    | 'error';
  content?: string;
  data?: any;
}

/** 旧版 GameState（向后兼容检测） */
export interface LegacyGameState {
  currentNodeId: number | null;
  attributes: Record<string, any>;
  npcRelations: Record<string, number>;
  inventory: string[];
  history: { role: string; content: string }[];
}
