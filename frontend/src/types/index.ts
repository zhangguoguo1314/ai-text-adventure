/* ===== 用户相关 ===== */
export interface User {
  id: number;
  nickname: string;
  avatar: string | null;
  level: number;
  role: string;
  phone?: string;
  email?: string;
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
  description: string;
  prompt: string;
  coverImage: string | null;
  category: string;
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
