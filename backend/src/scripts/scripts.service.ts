import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

@Injectable()
export class ScriptsService {
  constructor(private prisma: PrismaService) {}

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

  async generateInitialContent(scriptId: number) {
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

    // Get style template if associated
    const styleTemplate = script.styleId
      ? await this.prisma.styleTemplate.findUnique({
          where: { id: script.styleId },
        })
      : null;

    const systemPrompt = `你是一个专业的AI文字冒险游戏剧本创作助手。你需要根据用户提供的信息，生成一个完整的游戏剧本初始内容。

请以JSON格式返回以下内容：
{
  "worldSetting": "世界观的详细描述（包含核心规则、背景设定等）",
  "npcs": [
    { "name": "角色名", "personality": "角色性格描述", "avatar": "角色头像描述" }
  ],
  "attributes": [
    { "name": "属性名", "type": "number|enum|boolean", "minVal": 0, "maxVal": 100, "defaultVal": "50" }
  ],
  "openingScene": {
    "content": "开局场景描述文本",
    "choices": [
      { "text": "选项文本", "nextNodeId": null }
    ]
  }
}

注意：
- 世界观描述要详细、有吸引力
- NPC要有鲜明的个性
- 属性设计要合理，至少包含3-5个属性
- 开局场景要引人入胜
- 只返回JSON，不要其他文本`;

    const userPrompt = `请为我创作一个文字冒险游戏剧本：
标题：${script.title}
${script.desc ? `描述：${script.desc}` : ''}
${styleTemplate ? `文风要求：${styleTemplate.prompt}` : '请使用生动有趣的叙事风格。'}`;

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
          temperature: 0.8,
          max_tokens: 4000,
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

      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }

      const generated = JSON.parse(jsonMatch[0]);

      // Save generated content to database
      return this.saveGeneratedContent(scriptId, generated);
    } catch (error) {
      // Fall back to mock content if LLM fails
      console.error('LLM generation failed, using mock data:', error.message);
      return this.generateMockContent(script);
    }
  }

  private async saveGeneratedContent(
    scriptId: number,
    content: {
      worldSetting?: string;
      npcs?: Array<{ name: string; personality?: string; avatar?: string }>;
      attributes?: Array<{
        name: string;
        type?: string;
        minVal?: number;
        maxVal?: number;
        defaultVal?: string;
      }>;
      openingScene?: {
        content?: string;
        choices?: Array<{ text: string; nextNodeId?: number | null }>;
      };
    },
  ) {
    // Update world setting
    if (content.worldSetting) {
      await this.prisma.script.update({
        where: { id: scriptId },
        data: { worldSetting: content.worldSetting },
      });
    }

    // Create NPCs
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

    // Create attributes
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

    // Create opening scene node
    if (content.openingScene) {
      await this.prisma.scriptNode.deleteMany({ where: { scriptId } });
      const choicesStr = content.openingScene.choices
        ? JSON.stringify(content.openingScene.choices)
        : undefined;

      const openingNode = await this.prisma.scriptNode.create({
        data: {
          scriptId,
          type: 'scene',
          content: content.openingScene.content || '',
          choices: choicesStr,
          posX: 100,
          posY: 100,
        },
      });

      // Return the full generated content with the node ID
      const script = await this.findOne(scriptId);
      return {
        success: true,
        data: {
          ...script.data,
          openingNodeId: openingNode.id,
        },
      };
    }

    const script = await this.findOne(scriptId);
    return { success: true, data: script.data };
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
