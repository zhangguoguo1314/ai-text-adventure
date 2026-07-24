import { Injectable, Logger } from '@nestjs/common';
import {
  GenerateAvatarDto,
  GenerateSceneDto,
  GenerateCoverDto,
} from './dto/ai-image.dto';

/**
 * AI 图片生成服务
 *
 * 调用 OpenAI DALL-E API 生成图片；无 API Key 时回退到基于种子的
 * 确定性占位图（DiceBear API 或 SVG data URL）。
 */
@Injectable()
export class AiImageService {
  private readonly logger = new Logger(AiImageService.name);

  /** 图片尺寸配置 */
  private static readonly SIZES = {
    avatar: { width: 256, height: 256 },
    scene: { width: 512, height: 512 },
    cover: { width: 512, height: 256 },
  } as const;

  /** DALL-E 支持的尺寸（用于将期望尺寸映射到合法值） */
  private static readonly DALLE_VALID_SIZES: readonly string[] = [
    '256x256',
    '512x512',
    '1024x1024',
  ];

  /* ===================== 公共入口 ===================== */

  /** 生成角色头像 */
  async generateAvatar(dto: GenerateAvatarDto) {
    const prompt = this.buildAvatarPrompt(dto);
    const url = await this.generateImage(
      prompt,
      AiImageService.SIZES.avatar,
      () => this.placeholderAvatar(dto.name),
    );
    return { success: true, url };
  }

  /** 生成场景插图 */
  async generateScene(dto: GenerateSceneDto) {
    const prompt = this.buildScenePrompt(dto);
    const url = await this.generateImage(
      prompt,
      AiImageService.SIZES.scene,
      () => this.placeholderScene(dto.description, dto.mood),
    );
    return { success: true, url };
  }

  /** 生成剧本封面 */
  async generateCover(dto: GenerateCoverDto) {
    const prompt = this.buildCoverPrompt(dto);
    const url = await this.generateImage(
      prompt,
      AiImageService.SIZES.cover,
      () => this.placeholderCover(dto.title, dto.category),
    );
    return { success: true, url };
  }

  /* ===================== Prompt 模板 ===================== */

  /** 根据角色名和性格生成适合的卡通头像描述 */
  private buildAvatarPrompt(dto: GenerateAvatarDto): string {
    const stylePart = dto.style ? ` 整体风格：${dto.style}。` : '';
    return (
      `A cartoon-style avatar portrait of a character named "${dto.name}". ` +
      `Personality: ${dto.personality}.${stylePart} ` +
      `Cute, expressive face, clean lines, vibrant colors, square composition, ` +
      `suitable as a profile picture for a text adventure game. High quality digital art.`
    );
  }

  /** 根据剧情描述生成氛围图 */
  private buildScenePrompt(dto: GenerateSceneDto): string {
    const moodPart = dto.mood ? ` The overall mood is ${dto.mood}.` : '';
    return (
      `An atmospheric illustration for a text adventure game scene. ` +
      `Scene description: ${dto.description}.${moodPart} ` +
      `Cinematic lighting, rich details, immersive environment, ` +
      `no text, no watermark. Digital painting.`
    );
  }

  /** 根据标题和分类生成封面 */
  private buildCoverPrompt(dto: GenerateCoverDto): string {
    const categoryName = this.categoryLabel(dto.category);
    return (
      `A book cover illustration for a ${categoryName} text adventure game. ` +
      `Title theme: "${dto.title}". Synopsis: ${dto.desc}. ` +
      `Eye-catching, dramatic composition, suitable as a game cover banner, ` +
      `wide aspect ratio, no text, no watermark. High quality digital art.`
    );
  }

  /* ===================== DALL-E 调用 ===================== */

  /**
   * 统一生成入口：
   * - 有 OPENAI_API_KEY 时调用 DALL-E API
   * - 无 Key 或调用失败时回退到占位图
   */
  private async generateImage(
    prompt: string,
    size: { width: number; height: number },
    placeholder: () => string,
  ): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return placeholder();
    }

    try {
      const url = await this.callDallE(prompt, size);
      return url;
    } catch (err) {
      this.logger.error(
        `DALL-E 生成失败，回退到占位图: ${(err as Error).message}`,
      );
      return placeholder();
    }
  }

  /** 调用 OpenAI DALL-E 图片生成接口 */
  private async callDallE(
    prompt: string,
    size: { width: number; height: number },
  ): Promise<string> {
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const apiKey = process.env.OPENAI_API_KEY!;
    const model = process.env.DALLE_MODEL || 'dall-e-2';
    const dalleSize = this.toDalleSize(size);

    this.logger.log(`调用 DALL-E 生成图片 (size=${dalleSize})`);

    const response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: dalleSize,
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`DALL-E API returned ${response.status}: ${text}`);
    }

    const data = await response.json();
    const imageUrl = data?.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('DALL-E 响应中未找到图片 URL');
    }
    return imageUrl;
  }

  /** 将期望尺寸映射到 DALL-E 支持的合法尺寸 */
  private toDalleSize(size: { width: number; height: number }): string {
    const target = `${size.width}x${size.height}`;
    if (AiImageService.DALLE_VALID_SIZES.includes(target)) {
      return target;
    }
    // 取最接近的合法尺寸（按像素总数）
    const area = size.width * size.height;
    if (area <= 256 * 256) return '256x256';
    if (area <= 512 * 512) return '512x512';
    return '1024x1024';
  }

  /* ===================== 占位图生成 ===================== */

  /** 基于种子的确定性头像（DiceBear API URL） */
  private placeholderAvatar(name: string): string {
    const seed = encodeURIComponent(name || 'default');
    const bg = 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf';
    return (
      `https://api.dicebear.com/7.x/adventurer/svg` +
      `?seed=${seed}&backgroundColor=${bg}&radius=20`
    );
  }

  /** 基于描述的确定性场景图（SVG data URL） */
  private placeholderScene(description: string, mood?: string): string {
    const hash = this.hashString(description + (mood || ''));
    const [c1, c2] = this.gradientColors(hash, mood);
    const label = this.escapeXml(this.truncate(description, 16));
    const svg = this.buildSceneSvg(c1, c2, label, hash);
    return this.toDataUrl(svg);
  }

  /** 基于标题与分类的确定性封面（SVG data URL） */
  private placeholderCover(title: string, category: string): string {
    const hash = this.hashString(title + category);
    const [c1, c2] = this.gradientColors(hash);
    const label = this.escapeXml(this.truncate(title, 20));
    const cat = this.escapeXml(this.categoryLabel(category));
    const svg = this.buildCoverSvg(c1, c2, label, cat, hash);
    return this.toDataUrl(svg);
  }

  private buildSceneSvg(
    c1: string,
    c2: string,
    label: string,
    hash: number,
  ): string {
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>` +
      `</linearGradient></defs>` +
      `<rect width="512" height="512" fill="url(#g)"/>` +
      this.decorShapes(hash) +
      `<text x="256" y="280" font-family="Arial" font-size="22" fill="rgba(255,255,255,0.92)" ` +
      `text-anchor="middle" font-weight="600">${label}</text>` +
      `<text x="256" y="312" font-family="Arial" font-size="14" fill="rgba(255,255,255,0.7)" ` +
      `text-anchor="middle">场景插图</text>` +
      `</svg>`
    );
  }

  private buildCoverSvg(
    c1: string,
    c2: string,
    label: string,
    cat: string,
    hash: number,
  ): string {
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="256" viewBox="0 0 512 256">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">` +
      `<stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>` +
      `</linearGradient></defs>` +
      `<rect width="512" height="256" fill="url(#g)"/>` +
      this.decorShapes(hash, 256) +
      `<text x="256" y="128" font-family="Arial" font-size="26" fill="rgba(255,255,255,0.95)" ` +
      `text-anchor="middle" font-weight="700">${label}</text>` +
      `<text x="256" y="160" font-family="Arial" font-size="14" fill="rgba(255,255,255,0.75)" ` +
      `text-anchor="middle">${cat}</text>` +
      `</svg>`
    );
  }

  /** 根据哈希生成若干装饰圆形，保证确定性 */
  private decorShapes(hash: number, height = 512): string {
    let h = hash;
    let shapes = '';
    for (let i = 0; i < 4; i++) {
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      const cx = (h % 512).toString();
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      const cy = (h % height).toString();
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      const r = (20 + (h % 50)).toString();
      shapes +=
        `<circle cx="${cx}" cy="${cy}" r="${r}" ` +
        `fill="rgba(255,255,255,0.08)"/>`;
    }
    return shapes;
  }

  /* ===================== 工具方法 ===================== */

  /** 字符串 -> 正整数哈希（确定性） */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /** 根据哈希与可选心情挑选渐变配色 */
  private gradientColors(hash: number, mood?: string): [string, string] {
    const palette: Record<string, [string, string]> = {
      happy: ['#f59e0b', '#f97316'],
      sad: ['#3b82f6', '#6366f1'],
      tense: ['#dc2626', '#7c2d12'],
      mystery: ['#6d28d9', '#1e1b4b'],
      calm: ['#10b981', '#0d9488'],
      dark: ['#1e293b', '#0f172a'],
      warm: ['#f59e0b', '#ef4444'],
      cold: ['#06b6d4', '#3b82f6'],
    };
    if (mood && palette[mood.toLowerCase()]) {
      return palette[mood.toLowerCase()];
    }
    const keys = Object.keys(palette);
    const pick = keys[hash % keys.length];
    return palette[pick];
  }

  private categoryLabel(category: string): string {
    const map: Record<string, string> = {
      adventure: '冒险',
      romance: '恋爱',
      mystery: '悬疑',
      scifi: '科幻',
      horror: '恐怖',
      fantasy: '奇幻',
      comedy: '喜剧',
      other: '其他',
    };
    return map[category] || category || '剧本';
  }

  private truncate(str: string, max: number): string {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '…' : str;
  }

  private escapeXml(str: string): string {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private toDataUrl(svg: string): string {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}
