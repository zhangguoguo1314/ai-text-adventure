/* ===== 用户相关 ===== */
export interface User {
  id: number;
  nickname: string;
  avatar: string | null;
  bio?: string | null;
  level: number;
  role: string;
  phone?: string;
  email?: string;
  inviteCode?: string;
  createdAt?: string;
}

export interface Balance {
  permanent: number;
  temp: number;
}

/* ===== 剧本相关 ===== */
export interface Script {
  id: number;
  title: string;
  description: string;
  coverImage: string | null;
  genre: string;
  tags: string[];
  authorId: number;
  authorName: string;
  playCount: number;
  likeCount: number;
  chapterCount: number;
  status: 'draft' | 'published' | 'archived';
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

/* ===== NPC ===== */
export interface ScriptNpc {
  id: number;
  scriptId: number;
  name: string;
  personality: string;
  avatar: string | null;
  sortOrder: number;
}

/* ===== 属性 ===== */
export interface ScriptAttribute {
  id: number;
  scriptId: number;
  name: string;
  type: 'number' | 'enum' | 'boolean';
  minVal: number | null;
  maxVal: number | null;
  defaultVal: string | null;
  thresholdRules: string | null;
}

/* ===== 剧情节点 ===== */
export interface ScriptNode {
  id: number;
  scriptId: number;
  type: 'scene' | 'choice' | 'condition' | 'preset';
  content: string;
  choices: string | null; // JSON
  condition: string | null; // JSON
  posX: number | null;
  posY: number | null;
  parentId: number | null;
}

export interface NodeChoice {
  text: string;
  nextNodeId: number | null;
}

/* ===== AI 生成结果 ===== */
export interface GeneratedContent {
  worldSetting: string;
  narrativeRules?: string;
  description?: string;
  tags?: string[];
  category?: string;
  themeColor?: string;
  npcs: Array<{ id?: number; name: string; personality: string; avatar: string | null; sortOrder?: number }>;
  attributes: Array<{ id?: number; name: string; type: string; minVal: number | null; maxVal: number | null; defaultVal: string | null }>;
  charConfig?: Record<string, string[]>;
  openingText?: string;
  openingScene: {
    content: string;
    choices: NodeChoice[];
  };
  storyArcs?: Array<{ chapter: number; title: string; summary: string; keyEvents: string[] }>;
  endings?: Array<{ type: string; title: string; condition: string }>;
  openingNodeId?: number;
}

/* ===== 游戏会话 ===== */
export interface GameSession {
  id: number;
  scriptId: number;
  userId: number;
  currentChapterId: number;
  choices: Record<string, string>;
  status: 'playing' | 'completed' | 'abandoned';
  startedAt: string;
  updatedAt: string;
}

/* ===== AI 模型 ===== */
export interface AiModel {
  id: number;
  name: string;
  provider: string;
  description: string;
  costPerToken: number;
  maxTokens: number;
  enabled: boolean;
}

/* ===== 风格模板 ===== */
export interface StyleTemplate {
  id: number;
  name: string;
  icon: string;
  preview: string;
  prompt: string;
  useCount: number;
}

/* ===== 剧本模板 ===== */
export interface TemplateNpc {
  name: string;
  personality?: string;
}

export interface TemplateAttr {
  name: string;
  type?: string;
  defaultVal?: string | number | null;
  minVal?: number | null;
  maxVal?: number | null;
}

export interface TemplateNodeChoice {
  text: string;
  nextNodeId?: number | null;
}

export interface TemplateNode {
  type?: string;
  content?: string;
  choices?: TemplateNodeChoice[];
}

export interface ScriptTemplate {
  id: number;
  name: string;
  category: string;
  description: string;
  coverEmoji: string;
  worldSetting: string;
  stylePrompt: string;
  npcTemplate: TemplateNpc[];
  attrTemplate: TemplateAttr[];
  nodeTemplate: TemplateNode[];
  charConfig?: Record<string, string[]>;
  tags?: string[];
  useCount: number;
  rating: number;
  ratingCount: number;
  authorId: number | null;
  isOfficial: boolean;
  createdAt: string;
}

/* ===== 自定义 API 配置 ===== */
export interface CustomApiConfig {
  id: number;
  userId: number;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
}

/* ===== 排行榜 ===== */
export interface RankItem {
  rank: number;
  script: Script;
  score: number;
}

/* ===== 通用分页 ===== */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ===========================================================================
 * 剧本逻辑引擎类型（对标"剧本自产系统"）
 * 对应后端 script-logic.types.ts
 * ========================================================================= */

/** 事件触发器类型 */
export type EventTriggerType =
  | 'location'
  | 'time'
  | 'chapter'
  | 'attribute'
  | 'flag'
  | 'npc_relation'
  | 'choice'
  | 'turn_count'
  | 'custom';

/** 条件类型 */
export type ConditionType =
  | 'attribute'
  | 'flag'
  | 'npc_relation'
  | 'karma'
  | 'chapter'
  | 'day'
  | 'inventory'
  | 'skill'
  | 'ending'
  | 'custom';

/** 条件运算符 */
export type ConditionOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'contains'
  | 'not_contains'
  | 'between'
  | 'exists';

/** 事件效果类型 */
export type EffectType =
  | 'attribute_change'
  | 'flag_set'
  | 'npc_relation_change'
  | 'karma_change'
  | 'item_give'
  | 'item_remove'
  | 'skill_learn'
  | 'location_change'
  | 'time_change'
  | 'chapter_change'
  | 'narrative'
  | 'combat_start'
  | 'ending_trigger'
  | 'unlock_choice'
  | 'lock_choice'
  | 'custom';

/** 结局类型 */
export type EndingType =
  | 'good'
  | 'bad'
  | 'neutral'
  | 'hidden'
  | 'true_ending'
  | 'death';

/** AI 增量生成项类型 */
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

/** 事件触发器 */
export interface EventTrigger {
  type: EventTriggerType;
  target: string;
  operator: ConditionOperator;
  value: any;
}

/** 事件条件 */
export interface EventCondition {
  type: ConditionType;
  target: string;
  operator: ConditionOperator;
  value: any;
  description?: string;
}

/** 事件效果 */
export interface EventEffect {
  type: EffectType;
  target: string;
  value: any;
  description?: string;
}

/** 事件链 */
export interface EventChain {
  id: string;
  name: string;
  description: string;
  trigger: EventTrigger;
  conditions: EventCondition[];
  effects: EventEffect[];
  onceOnly: boolean;
  priority: number;
  enabled: boolean;
}

/** 结局触发器 */
export interface EndingTrigger {
  id: string;
  title: string;
  description: string;
  type: EndingType;
  conditions: EventCondition[];
  priority: number;
  narrative: string;
  isHidden: boolean;
}

/** 故事章节 */
export interface StoryArc {
  chapter: number;
  title: string;
  summary: string;
  keyEvents: string[];
  triggerConditions?: EventCondition[];
  keyNpcs?: string[];
  locations?: string[];
}

/** 角色创建字段 */
export interface CharCreationField {
  key: string;
  label: string;
  icon: string;
  options: string[];
  required: boolean;
  allowRandom: boolean;
  description?: string;
}

/** 自定义文本字段 */
export interface CustomTextField {
  key: string;
  label: string;
  icon: string;
  maxLength: number;
  required: boolean;
  placeholder: string;
}

/** 角色创建配置 */
export interface CharacterCreationConfig {
  fields: CharCreationField[];
  allowCustomText: boolean;
  customTextFields?: CustomTextField[];
}

/** 剧本完整逻辑配置 */
export interface ScriptLogicConfig {
  eventChains: EventChain[];
  endingTriggers: EndingTrigger[];
  storyArcs: StoryArc[];
  npcTriggerConfig: any[];
  customRules: string;
  characterCreation: CharacterCreationConfig;
  attributeThresholds: any[];
}
