import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiImageService } from '../ai-image/ai-image.service';
import {
  CreateScriptDto,
  UpdateScriptDto,
  QueryScriptDto,
  CreateNpcDto,
  UpdateNpcDto,
  CreateAttributeDto,
  UpdateAttributeDto,
  BatchUpdateAttributesDto,
  CreateNodeDto,
  UpdateNodeDto,
} from './dto/scripts.dto';
import { GenerateCoverDto } from '../ai-image/dto/ai-image.dto';

@Injectable()
export class ScriptsService {
  constructor(
    private prisma: PrismaService,
    private aiImageService: AiImageService,
  ) {}

  async list(dto: QueryScriptDto) {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {
      status: 'published',
    };

    if (dto.keyword) {
      where.title = { contains: dto.keyword };
    }

    if (dto.category) {
      where.category = dto.category;
    }

    const orderBy: any = {};
    const sortField = dto.sort || 'createdAt';
    const order = dto.order || 'desc';
    orderBy[sortField] = order;

    const [items, total] = await Promise.all([
      this.prisma.script.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          author: {
            select: { id: true, nickname: true, avatar: true },
          },
        },
      }),
      this.prisma.script.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const script = await this.prisma.script.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, nickname: true, avatar: true },
        },
        npcs: { orderBy: { sortOrder: 'asc' } },
        attributes: true,
        nodes: true,
        _count: {
          select: { sessions: true, favorites: true, comments: true },
        },
      },
    });

    if (!script) {
      return { success: false, message: '剧本不存在' };
    }

    return { success: true, data: script };
  }

  async create(userId: number, dto: CreateScriptDto) {
    const script = await this.prisma.script.create({
      data: {
        authorId: userId,
        title: dto.title,
        cover: dto.cover,
        desc: dto.desc || '',
        category: dto.category || 'adventure',
        worldSetting: dto.worldSetting || '',
        styleId: dto.styleId,
        status: 'draft',
      },
    });

    return { success: true, data: script };
  }

  async update(id: number, userId: number, dto: UpdateScriptDto) {
    const script = await this.prisma.script.findUnique({ where: { id } });

    if (!script) {
      return { success: false, message: '剧本不存在' };
    }

    if (script.authorId !== userId) {
      return { success: false, message: '无权编辑此剧本' };
    }

    const updated = await this.prisma.script.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.cover !== undefined && { cover: dto.cover }),
        ...(dto.desc !== undefined && { desc: dto.desc }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.worldSetting !== undefined && { worldSetting: dto.worldSetting }),
        ...(dto.styleId !== undefined && { styleId: dto.styleId }),
      },
    });

    return { success: true, data: updated };
  }

  async publish(id: number, userId: number) {
    const script = await this.prisma.script.findUnique({ where: { id } });

    if (!script) {
      return { success: false, message: '剧本不存在' };
    }

    if (script.authorId !== userId) {
      return { success: false, message: '无权发布此剧本' };
    }

    const updated = await this.prisma.script.update({
      where: { id },
      data: { status: 'reviewing' },
    });

    return { success: true, data: updated };
  }

  /* ===== NPC CRUD ===== */

  async listNpcs(scriptId: number) {
    const npcs = await this.prisma.scriptNpc.findMany({
      where: { scriptId },
      orderBy: { sortOrder: 'asc' },
    });
    return { success: true, data: npcs };
  }

  async createNpc(scriptId: number, dto: CreateNpcDto) {
    const npc = await this.prisma.scriptNpc.create({
      data: {
        scriptId,
        name: dto.name,
        personality: dto.personality || '',
        avatar: dto.avatar,
        sortOrder: dto.sortOrder || 0,
      },
    });
    return { success: true, data: npc };
  }

  async updateNpc(scriptId: number, npcId: number, dto: UpdateNpcDto) {
    const npc = await this.prisma.scriptNpc.findFirst({
      where: { id: npcId, scriptId },
    });
    if (!npc) {
      throw new NotFoundException('NPC不存在');
    }

    const updated = await this.prisma.scriptNpc.update({
      where: { id: npcId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.personality !== undefined && { personality: dto.personality }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
    return { success: true, data: updated };
  }

  async deleteNpc(scriptId: number, npcId: number) {
    const npc = await this.prisma.scriptNpc.findFirst({
      where: { id: npcId, scriptId },
    });
    if (!npc) {
      throw new NotFoundException('NPC不存在');
    }

    await this.prisma.scriptNpc.delete({ where: { id: npcId } });
    return { success: true, message: 'NPC已删除' };
  }

  /* ===== Attribute CRUD ===== */

  async listAttributes(scriptId: number) {
    const attributes = await this.prisma.scriptAttribute.findMany({
      where: { scriptId },
    });
    return { success: true, data: attributes };
  }

  async batchUpdateAttributes(scriptId: number, dto: BatchUpdateAttributesDto) {
    // Delete existing attributes and recreate
    await this.prisma.scriptAttribute.deleteMany({ where: { scriptId } });

    const attributes = await Promise.all(
      dto.attributes.map((attr) =>
        this.prisma.scriptAttribute.create({
          data: {
            scriptId,
            name: attr.name || '',
            type: attr.type || 'number',
            minVal: attr.minVal,
            maxVal: attr.maxVal,
            defaultVal: attr.defaultVal ?? null,
            thresholdRules: attr.thresholdRules ?? null,
          },
        }),
      ),
    );

    return { success: true, data: attributes };
  }

  /* ===== Node CRUD ===== */

  async listNodes(scriptId: number) {
    const nodes = await this.prisma.scriptNode.findMany({
      where: { scriptId },
      orderBy: { id: 'asc' },
    });
    return { success: true, data: nodes };
  }

  async createNode(scriptId: number, dto: CreateNodeDto) {
    const node = await this.prisma.scriptNode.create({
      data: {
        scriptId,
        type: dto.type || 'scene',
        content: dto.content || '',
        choices: dto.choices,
        condition: dto.condition,
        posX: dto.posX,
        posY: dto.posY,
        parentId: dto.parentId,
      },
    });
    return { success: true, data: node };
  }

  async updateNode(scriptId: number, nodeId: number, dto: UpdateNodeDto) {
    const node = await this.prisma.scriptNode.findFirst({
      where: { id: nodeId, scriptId },
    });
    if (!node) {
      throw new NotFoundException('节点不存在');
    }

    const updated = await this.prisma.scriptNode.update({
      where: { id: nodeId },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.choices !== undefined && { choices: dto.choices }),
        ...(dto.condition !== undefined && { condition: dto.condition }),
        ...(dto.posX !== undefined && { posX: dto.posX }),
        ...(dto.posY !== undefined && { posY: dto.posY }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      },
    });
    return { success: true, data: updated };
  }

  async deleteNode(scriptId: number, nodeId: number) {
    const node = await this.prisma.scriptNode.findFirst({
      where: { id: nodeId, scriptId },
    });
    if (!node) {
      throw new NotFoundException('节点不存在');
    }

    await this.prisma.scriptNode.delete({ where: { id: nodeId } });
    return { success: true, message: '节点已删除' };
  }

  /* ===== AI Generation ===== */

  /**
   * 增强版AI剧本生成引擎
   * 对标UU站点：文风选择 + 游戏指令 + AI润色 + 多项生成
   */
  async generateInitialContent(scriptId: number, options?: {
    aiPolish?: boolean;
    generateItems?: string[]; // 要生成的项: description, narrativeRules, themeColor, attributes, npcs, opening, charConfig, tags
    engineType?: string; // 生成引擎
  }) {
    const script = await this.prisma.script.findUnique({
      where: { id: scriptId },
      include: { npcs: true, attributes: true },
    });
    if (!script) {
      throw new NotFoundException('剧本不存在');
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return this.generateMockContent(script);
    }

    // 获取文风模板
    const styleTemplate = script.styleId
      ? await this.prisma.styleTemplate.findUnique({
          where: { id: script.styleId },
        })
      : null;

    // 默认生成项
    const genItems = options?.generateItems || [
      'description', 'narrativeRules', 'attributes', 'npcs', 'opening', 'charConfig', 'tags'
    ];
    const aiPolish = options?.aiPolish ?? true;

    // 构建增强版系统提示
    const systemPrompt = this.buildGenerationSystemPrompt(genItems, styleTemplate);
    const userPrompt = this.buildGenerationUserPrompt(script, styleTemplate, aiPolish);

    try {
      const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.85,
          max_tokens: 6000,
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM API returned ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in LLM response');
      }

      // 提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }

      const generated = JSON.parse(jsonMatch[0]);

      // 标记为AI生成
      await this.prisma.script.update({
        where: { id: scriptId },
        data: {
          isAiGenerated: true,
          engineType: options?.engineType || 'standard',
        },
      });

      // 保存生成内容
      return this.saveGeneratedContent(scriptId, generated, aiPolish);
    } catch (error) {
      console.error('LLM generation failed, using mock data:', error.message);
      return this.generateMockContent(script);
    }
  }

  /**
   * 构建生成系统提示 - 对标UU的生成项选择
   */
  private buildGenerationSystemPrompt(genItems: string[], styleTemplate: any): string {
    const styleDesc = styleTemplate
      ? `当前文风：${styleTemplate.name}（${styleTemplate.preview}）。\n文风要求：${styleTemplate.prompt}`
      : '请使用生动有趣的叙事风格。';

    let prompt = `你是一个专业的AI文字冒险游戏剧本创作引擎。你需要根据用户的游戏指令，生成一个完整、可游玩的文字冒险剧本。

${styleDesc}

请以JSON格式返回以下内容（根据生成项决定包含哪些字段）：
{
  "worldSetting": "世界观详细描述（核心规则、背景设定、社会结构等，500-1000字）",
  "narrativeRules": "叙事规则（AI游玩时需遵循的叙事规范、文风约束、特殊机制说明，200-500字。若用户指令足够详细，提炼核心规则；若指令较短，补充创作）",
  "description": "游戏详情页简介（100-200字，有吸引力的描述）+ 2-5个分类标签",
  "tags": ["标签1", "标签2", "标签3"],
  "category": "adventure|romance|mystery|scifi|horror|fantasy|wuxia|cultivation|idol|school|other",
  "themeColor": "violet|rose|amber|cyan|emerald|slate（主题配色方案）",
  "npcs": [
    { "name": "角色名", "personality": "详细性格描述（100-200字，含外貌、性格、背景、与玩家关系倾向）", "avatar": "emoji表情" }
  ],
  "attributes": [
    { "name": "属性名", "type": "number", "minVal": 0, "maxVal": 100, "defaultVal": "50" }
  ],
  "charConfig": {
    "字段名(如origins)": ["选项1", "选项2", "选项3"],
    "字段名(如personalities)": ["选项1", "选项2", "选项3"]
  },
  "openingText": "开场白文本（200-400字，带入第一幕，直接呈现给玩家的第一个场景）",
  "openingScene": {
    "content": "开局场景描述",
    "choices": [
      { "text": "选项文本", "nextNodeId": null, "effects": {"attribute": "+10"} }
    ]
  },
  "storyArcs": [
    { "chapter": 1, "title": "章节标题", "summary": "本章核心冲突概述", "keyEvents": ["关键事件1", "关键事件2"] }
  ],
  "endings": [
    { "type": "good", "title": "结局名", "condition": "触发条件描述" }
  ]
}

注意：
- NPC要从用户指令中已写明的角色建档，不凭空编造
- 角色创建配置(charConfig)要根据世界观设计合理的开局选择项（家世/性格/天赋/路线等）
- 属性设计要符合世界观（修仙类要有灵力/修为，校园类要有好感度/勇气等）
- 开场白要引人入胜，直接进入第一幕
- storyArcs描述3-5个章节的核心剧情走向
- endings设计2-4个不同结局的触发条件
- 只返回JSON，不要其他文本`;

    return prompt;
  }

  /**
   * 构建生成用户提示
   */
  private buildGenerationUserPrompt(script: any, styleTemplate: any, aiPolish: boolean): string {
    let prompt = `请为我创作一个文字冒险游戏剧本：

标题：${script.title}
${script.desc ? `游戏指令：${script.desc}` : '（无具体指令，请自由创作一个有趣的冒险剧本）'}`;

    if (!aiPolish) {
      prompt += `\n\n注意：用户未开启AI润色，请将用户指令原样作为叙事规则的核心，不要大幅改写用户描述。`;
    } else {
      prompt += `\n\n注意：用户已开启AI润色，请在用户指令基础上整理、扩展和完善叙事规则。`;
    }

    return prompt;
  }

  /**
   * AI 生成剧本封面并保存到 Script.cover 字段
   */
  async generateCover(
    scriptId: number,
    userId: number,
    dto: GenerateCoverDto,
  ) {
    const script = await this.prisma.script.findUnique({
      where: { id: scriptId },
    });
    if (!script) {
      throw new NotFoundException('剧本不存在');
    }
    if (script.authorId !== userId) {
      return { success: false, message: '无权编辑此剧本' };
    }

    const result = await this.aiImageService.generateCover(dto);
    if (!result?.url) {
      return { success: false, message: '封面生成失败' };
    }

    const updated = await this.prisma.script.update({
      where: { id: scriptId },
      data: { cover: result.url },
    });

    return { success: true, url: result.url, data: updated };
  }

  /**
   * 更新剧本角色创建配置
   */
  async updateCharConfig(scriptId: number, userId: number, charConfig: Record<string, string[]>) {
    const script = await this.prisma.script.findUnique({ where: { id: scriptId } });
    if (!script) throw new NotFoundException('剧本不存在');
    if (script.authorId !== userId) return { success: false, message: '无权编辑此剧本' };

    await this.prisma.script.update({
      where: { id: scriptId },
      data: { charConfig: JSON.stringify(charConfig) },
    });
    return { success: true, charConfig };
  }

  /**
   * 更新剧本叙事规则
   */
  async updateNarrativeRules(scriptId: number, userId: number, narrativeRules: string) {
    const script = await this.prisma.script.findUnique({ where: { id: scriptId } });
    if (!script) throw new NotFoundException('剧本不存在');
    if (script.authorId !== userId) return { success: false, message: '无权编辑此剧本' };

    await this.prisma.script.update({
      where: { id: scriptId },
      data: { narrativeRules },
    });
    return { success: true, narrativeRules };
  }

  /**
   * 更新剧本故事线结构（章节走向 + 结局条件）
   * 存储在 charConfig JSON 中作为 _storyArcs 和 _endings
   */
  async updateStoryStructure(scriptId: number, userId: number, storyArcs?: any[], endings?: any[]) {
    const script = await this.prisma.script.findUnique({ where: { id: scriptId } });
    if (!script) throw new NotFoundException('剧本不存在');
    if (script.authorId !== userId) return { success: false, message: '无权编辑此剧本' };

    // 将故事线和结局存储在 charConfig JSON 的特殊字段中
    let existingConfig: any = {};
    try { existingConfig = JSON.parse(script.charConfig || '{}'); } catch { existingConfig = {}; }

    if (storyArcs) existingConfig._storyArcs = storyArcs;
    if (endings) existingConfig._endings = endings;

    await this.prisma.script.update({
      where: { id: scriptId },
      data: { charConfig: JSON.stringify(existingConfig) },
    });
    return { success: true, storyArcs, endings };
  }

  private async saveGeneratedContent(
    scriptId: number,
    content: {
      worldSetting?: string;
      narrativeRules?: string;
      description?: string;
      tags?: string[];
      category?: string;
      themeColor?: string;
      npcs?: Array<{ name: string; personality?: string; avatar?: string }>;
      attributes?: Array<{
        name: string;
        type?: string;
        minVal?: number;
        maxVal?: number;
        defaultVal?: string;
      }>;
      charConfig?: Record<string, string[]>;
      openingText?: string;
      openingScene?: {
        content?: string;
        choices?: Array<{ text: string; nextNodeId?: number | null; effects?: Record<string, string> }>;
      };
      storyArcs?: Array<{ chapter: number; title: string; summary: string; keyEvents: string[] }>;
      endings?: Array<{ type: string; title: string; condition: string }>;
    },
    aiPolish?: boolean,
  ) {
    // 更新剧本核心字段（世界观、叙事规则、描述、标签、分类、配色、开场白、角色配置）
    const updateData: any = {};
    if (content.worldSetting) updateData.worldSetting = content.worldSetting;
    if (content.narrativeRules) updateData.narrativeRules = content.narrativeRules;
    if (content.description) updateData.desc = content.description;
    if (content.tags && Array.isArray(content.tags)) updateData.tags = JSON.stringify(content.tags);
    if (content.category) updateData.category = content.category;
    if (content.themeColor) updateData.themeColor = content.themeColor;
    if (content.openingText) updateData.openingText = content.openingText;
    if (content.charConfig) updateData.charConfig = JSON.stringify(content.charConfig);

    if (Object.keys(updateData).length > 0) {
      await this.prisma.script.update({
        where: { id: scriptId },
        data: updateData,
      });
    }

    // 创建NPC
    if (content.npcs && content.npcs.length > 0) {
      await this.prisma.scriptNpc.deleteMany({ where: { scriptId } });
      await Promise.all(
        content.npcs.map((npc, index) =>
          this.prisma.scriptNpc.create({
            data: {
              scriptId,
              name: npc.name,
              personality: npc.personality || '',
              avatar: npc.avatar,
              sortOrder: index,
            },
          }),
        ),
      );
    }

    // 创建属性
    if (content.attributes && content.attributes.length > 0) {
      await this.prisma.scriptAttribute.deleteMany({ where: { scriptId } });
      await Promise.all(
        content.attributes.map((attr) =>
          this.prisma.scriptAttribute.create({
            data: {
              scriptId,
              name: attr.name,
              type: attr.type || 'number',
              minVal: attr.minVal,
              maxVal: attr.maxVal,
              defaultVal: attr.defaultVal,
            },
          }),
        ),
      );
    }

    // 创建开局场景节点
    if (content.openingScene) {
      await this.prisma.scriptNode.deleteMany({ where: { scriptId } });
      const choicesStr = content.openingScene.choices
        ? JSON.stringify(content.openingScene.choices)
        : undefined;

      const openingNode = await this.prisma.scriptNode.create({
        data: {
          scriptId,
          type: 'scene',
          content: content.openingScene.content || content.openingText || '',
          choices: choicesStr,
          posX: 100,
          posY: 100,
        },
      });

      // 返回完整生成内容
      const script = await this.findOne(scriptId);
      return {
        success: true,
        data: {
          ...script.data,
          openingNodeId: openingNode.id,
          storyArcs: content.storyArcs || [],
          endings: content.endings || [],
        },
      };
    }

    const script = await this.findOne(scriptId);
    return {
      success: true,
      data: {
        ...script.data,
        storyArcs: content.storyArcs || [],
        endings: content.endings || [],
      },
    };
  }

  private generateMockContent(script: any) {
    return {
      success: true,
      data: {
        worldSetting: `# ${script.title} - 世界观\n\n这是一个充满未知与冒险的世界。在这里，每一个选择都可能改变命运的走向。\n\n## 核心规则\n- 玩家的每个决定都会影响故事走向\n- 某些关键选择将开启新的故事线索\n- NPC的好感度会影响可用的选项\n\n## 背景设定\n在一个被迷雾笼罩的古老大陆上，文明与神秘力量并存。古老的预言指引着勇者踏上一段未知的旅程。`,
        npcs: [
          { id: 1, name: '神秘旅人', personality: '沉稳内敛，似乎知道很多不为人知的秘密', avatar: null, sortOrder: 0 },
          { id: 2, name: '村长女儿', personality: '活泼开朗，对村外世界充满好奇', avatar: null, sortOrder: 1 },
          { id: 3, name: '暗影商人', personality: '精明狡猾，交易时总带着意味深长的微笑', avatar: null, sortOrder: 2 },
        ],
        attributes: [
          { id: 1, name: '勇气', type: 'number', minVal: 0, maxVal: 100, defaultVal: '50' },
          { id: 2, name: '智慧', type: 'number', minVal: 0, maxVal: 100, defaultVal: '50' },
          { id: 3, name: '魅力', type: 'number', minVal: 0, maxVal: 100, defaultVal: '50' },
          { id: 4, name: '生命值', type: 'number', minVal: 0, maxVal: 100, defaultVal: '100' },
          { id: 5, name: '阵营', type: 'enum', minVal: null, maxVal: null, defaultVal: '中立' },
        ],
        openingScene: {
          content: '你站在村口，清晨的薄雾笼罩着远方的群山。一条蜿蜒的小路向东方延伸，消失在迷雾之中。身后是你生活了二十年的小村庄，一切都那么熟悉。然而今天，一切都不同了——村长交给你一封神秘的信件，上面只写着一个地址和一句话："命运已至，莫再犹豫。"',
          choices: [
            { text: '拆开信件，仔细阅读', nextNodeId: null },
            { text: '不拆信件，直接出发前往信上标注的地点', nextNodeId: null },
            { text: '先去找村长女儿商量一下', nextNodeId: null },
            { text: '把信收好，先去村口酒馆打听消息', nextNodeId: null },
          ],
        },
      },
    };
  }
}
