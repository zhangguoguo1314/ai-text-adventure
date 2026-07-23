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
  npcs: Array<{ id?: number; name: string; personality: string; avatar: string | null; sortOrder?: number }>;
  attributes: Array<{ id?: number; name: string; type: string; minVal: number | null; maxVal: number | null; defaultVal: string | null }>;
  openingScene: {
    content: string;
    choices: NodeChoice[];
  };
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
