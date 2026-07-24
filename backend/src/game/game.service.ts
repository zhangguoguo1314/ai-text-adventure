import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';
import { RealtimeService } from '../realtime/realtime.service';
import {
  GameState,
  InventoryItem,
  Skill,
  GameMessage,
  CombatState,
  DayTime,
  LegacyGameState,
  AiResponse,
} from './game.types';

@Injectable()
export class GameService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private realtimeService: RealtimeService,
  ) {}

  // ========================
  // 向后兼容：旧版 GameState 自动升级
  // ========================

  /**
   * 检测并升级旧版 GameState 到新格式
   * 旧格式中 inventory 是 string[]，history 是 {role, content}[]
   */
  upgradeGameState(raw: any): GameState {
    // 检查是否是旧版格式（通过 inventory 是否为 string[] 判断）
    const isLegacy = Array.isArray(raw.inventory) && raw.inventory.length > 0 && typeof raw.inventory[0] === 'string';

    if (isLegacy) {
      // 旧版 -> 新版转换
      return {
        currentNodeId: raw.currentNodeId ?? null,
        attributes: raw.attributes ?? {},
        npcRelations: raw.npcRelations ?? {},
        inventory: [],  // 旧物品为字符串名，无法转为结构化物品，清空
        history: (raw.history ?? []).map((msg: any) => ({
          role: msg.role || 'narrator',
          content: msg.content || '',
          type: 'narrative',
        })),
        skills: [],
        flags: {},
        chapter: 1,
        dayTime: 'morning',
        day: 1,
        location: '起始地点',
        karma: 0,
        endings: [],
        achievements: [],
        combat: null,
      };
    }

    // 新版格式，补齐缺失字段
    return {
      currentNodeId: raw.currentNodeId ?? null,
      attributes: raw.attributes ?? {},
      npcRelations: raw.npcRelations ?? {},
      inventory: raw.inventory ?? [],
      history: raw.history ?? [],
      skills: raw.skills ?? [],
      flags: raw.flags ?? {},
      chapter: raw.chapter ?? 1,
      dayTime: raw.dayTime ?? 'morning',
      day: raw.day ?? 1,
      location: raw.location ?? '起始地点',
      karma: raw.karma ?? 0,
      endings: raw.endings ?? [],
      achievements: raw.achievements ?? [],
      combat: raw.combat ?? null,
      characterConfig: raw.characterConfig ?? undefined,
      relationshipFlags: raw.relationshipFlags ?? {},
      eventLog: raw.eventLog ?? [],
      customData: raw.customData ?? {},
    };
  }

  // ========================
  // 游戏核心操作
  // ========================

  /**
   * 开始新游戏
   * @param characterConfig 可选的角色创建配置（对标UU的家世/性格/特质等开局选择）
   */
  async startGame(userId: number, scriptId: number, characterConfig?: any) {
    const script = await this.prisma.script.findUnique({
      where: { id: scriptId },
      include: { npcs: true, attributes: true },
    });

    if (!script) {
      throw new NotFoundException('剧本不存在');
    }

    if (script.status !== 'published') {
      throw new ForbiddenException('该剧本尚未发布');
    }

    // 从剧本属性初始化默认值
    const attributes: Record<string, any> = {};
    for (const attr of script.attributes) {
      if (attr.defaultVal !== null && attr.defaultVal !== undefined) {
        if (attr.type === 'number') {
          attributes[attr.name] = parseFloat(attr.defaultVal) || 0;
        } else if (attr.type === 'boolean') {
          attributes[attr.name] = attr.defaultVal === 'true';
        } else {
          attributes[attr.name] = attr.defaultVal;
        }
      }
    }

    // 确保基础战斗属性存在
    if (attributes['HP'] === undefined) attributes['HP'] = 100;
    if (attributes['MaxHP'] === undefined) attributes['MaxHP'] = 100;
    if (attributes['MP'] === undefined) attributes['MP'] = 50;
    if (attributes['MaxMP'] === undefined) attributes['MaxMP'] = 50;
    if (attributes['攻击力'] === undefined) attributes['攻击力'] = 10;
    if (attributes['防御力'] === undefined) attributes['防御力'] = 5;
    if (attributes['敏捷'] === undefined) attributes['敏捷'] = 10;

    // 初始化 NPC 好感度和关系标记
    const npcRelations: Record<string, number> = {};
    const relationshipFlags: Record<string, any> = {};
    for (const npc of script.npcs) {
      npcRelations[npc.name] = 0;
      relationshipFlags[npc.name] = {
        met: false,
        friend: false,
        close: false,
        lover: false,
        betrayed: false,
        customFlags: {},
      };
    }

    // 使用扩展后的 GameState 初始化
    const gameState: GameState = {
      currentNodeId: null,
      attributes,
      npcRelations,
      inventory: [],
      history: [],
      skills: [],
      flags: {},
      chapter: 1,
      dayTime: 'morning',
      day: 1,
      location: '起始地点',
      karma: 0,
      endings: [],
      achievements: [],
      combat: null,
      // UU平台对标扩展
      characterConfig: characterConfig || undefined,
      relationshipFlags,
      eventLog: [],
      customData: {},
    };

    // 创建 game_session
    const session = await this.prisma.gameSession.create({
      data: {
        userId,
        scriptId,
        gameState: JSON.stringify(gameState),
      },
    });

    // 自动创建初始存档
    await this.prisma.save.create({
      data: {
        userId,
        sessionId: session.id,
        gameState: JSON.stringify(gameState),
        description: '初始存档',
        isAuto: true,
      },
    });

    // 更新剧本游玩次数
    await this.prisma.script.update({
      where: { id: scriptId },
      data: { playCount: { increment: 1 } },
    });

    return {
      success: true,
      data: {
        sessionId: session.id,
        scriptId: session.scriptId,
        gameState,
      },
    };
  }

  /**
   * 获取当前游戏状态（含自动升级）
   */
  async getSession(sessionId: number, userId: number) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        script: {
          include: { npcs: true, attributes: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('游戏会话不存在');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('无权访问此游戏会话');
    }

    // 自动升级旧版 GameState
    const gameState = this.upgradeGameState(JSON.parse(session.gameState));

    return {
      success: true,
      data: {
        id: session.id,
        scriptId: session.scriptId,
        script: session.script,
        gameState,
        totalTokens: session.totalTokens,
        totalCost: session.totalCost,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    };
  }

  /**
   * 获取存档列表
   */
  async getSaves(sessionId: number, userId: number) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('游戏会话不存在');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('无权访问此游戏会话');
    }

    const saves = await this.prisma.save.findMany({
      where: { sessionId, userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: saves.map((s) => ({
        id: s.id,
        gameState: this.upgradeGameState(JSON.parse(s.gameState)),
        description: s.description,
        isAuto: s.isAuto,
        createdAt: s.createdAt,
      })),
    };
  }

  /**
   * 手动存档
   */
  async saveGame(
    sessionId: number,
    userId: number,
    description?: string,
  ) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('游戏会话不存在');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('无权访问此游戏会话');
    }

    const save = await this.prisma.save.create({
      data: {
        userId,
        sessionId,
        gameState: session.gameState,
        description: description || '手动存档',
        isAuto: false,
      },
    });

    return {
      success: true,
      data: {
        id: save.id,
        description: save.description,
        createdAt: save.createdAt,
      },
    };
  }

  // ========================
  // 增强版 Prompt 构建
  // ========================

  /** NPC 好感度等级映射 */
  private getRelationLevel(relation: number): string {
    if (relation <= -50) return '死敌';
    if (relation <= -20) return '敌对';
    if (relation < 0) return '冷淡';
    if (relation === 0) return '陌生人';
    if (relation < 20) return '熟人';
    if (relation < 50) return '朋友';
    if (relation < 80) return '亲密';
    return '挚友';
  }

  /** 时段中文描述 */
  private getDayTimeDescription(dayTime: DayTime): string {
    const map: Record<DayTime, string> = {
      dawn: '黎明',
      morning: '上午',
      noon: '正午',
      afternoon: '下午',
      evening: '傍晚',
      night: '夜晚',
    };
    return map[dayTime] || dayTime;
  }

  /** 善恶值描述 */
  private getKarmaDescription(karma: number): string {
    if (karma <= -80) return '极恶';
    if (karma <= -50) return '邪恶';
    if (karma <= -20) return '偏恶';
    if (karma <= 20) return '中立';
    if (karma <= 50) return '善良';
    if (karma <= 80) return '正义';
    return '至善';
  }

  /**
   * 构建增强版系统 Prompt
   */
  buildPrompt(
    worldSetting: string,
    gameState: GameState,
    npcList: { name: string; personality: string }[],
  ): string {
    let systemPrompt = '你是一个文字冒险游戏的叙述者。请根据玩家的行动，描述接下来发生的事情。\n\n';

    // 世界观规则
    if (worldSetting) {
      systemPrompt += `【世界观规则】\n${worldSetting}\n\n`;
    }

    // 角色创建配置（对标UU的家世/性格/特质等开局选择）
    if (gameState.characterConfig) {
      systemPrompt += `【角色创建配置】\n`;
      const cc = gameState.characterConfig;
      if (cc.origin) systemPrompt += `- 出身/家世: ${cc.origin}\n`;
      if (cc.personality) systemPrompt += `- 性格: ${cc.personality}\n`;
      if (cc.talent) systemPrompt += `- 天赋: ${cc.talent}\n`;
      if (cc.ambition) systemPrompt += `- 志向: ${cc.ambition}\n`;
      if (cc.path) systemPrompt += `- 发展路线: ${cc.path}\n`;
      if (cc.gender) systemPrompt += `- 性别: ${cc.gender}\n`;
      if (cc.appearance) systemPrompt += `- 外貌: ${cc.appearance}\n`;
      if (cc.background) systemPrompt += `- 背景故事: ${cc.background}\n`;
      if (cc.customFields) {
        for (const [key, val] of Object.entries(cc.customFields)) {
          systemPrompt += `- ${key}: ${val}\n`;
        }
      }
      systemPrompt += `\n注意：以上角色配置应在叙事中体现，影响NPC对玩家的态度和剧情走向。\n\n`;
    }

    // 当前位置 + 时间 + 章节进度
    systemPrompt += `【当前场景信息】\n`;
    systemPrompt += `- 位置: ${gameState.location}\n`;
    systemPrompt += `- 时间: 第${gameState.day}天 ${this.getDayTimeDescription(gameState.dayTime)}\n`;
    systemPrompt += `- 章节: 第${gameState.chapter}章\n\n`;

    // 玩家属性详细列表
    systemPrompt += `【玩家属性】\n`;
    for (const [key, val] of Object.entries(gameState.attributes)) {
      systemPrompt += `- ${key}: ${val}\n`;
    }
    // 善恶值
    systemPrompt += `- 善恶值: ${gameState.karma} (${this.getKarmaDescription(gameState.karma)})\n\n`;

    // 物品栏摘要
    if (gameState.inventory.length > 0) {
      systemPrompt += `【物品栏】\n`;
      for (const item of gameState.inventory) {
        const emoji = item.emoji ? `${item.emoji} ` : '';
        const statsStr = item.stats
          ? ` [${Object.entries(item.stats).map(([k, v]) => `${k}+${v}`).join(', ')}]`
          : '';
        systemPrompt += `- ${emoji}${item.name} x${item.quantity}${statsStr}\n`;
      }
      systemPrompt += '\n';
    } else {
      systemPrompt += `【物品栏】空\n\n`;
    }

    // 已学技能列表
    if (gameState.skills.length > 0) {
      systemPrompt += `【已学技能】\n`;
      for (const skill of gameState.skills) {
        const emoji = skill.emoji ? `${skill.emoji} ` : '';
        const cdStr = skill.currentCooldown > 0 ? ` (冷却中: ${skill.currentCooldown}回合)` : '';
        systemPrompt += `- ${emoji}${skill.name} Lv.${skill.level}${cdStr}\n`;
      }
      systemPrompt += '\n';
    }

    // NPC 列表（含好感度等级描述和关系标记）
    if (npcList.length > 0) {
      systemPrompt += `【NPC列表】\n`;
      for (const npc of npcList) {
        const relation = gameState.npcRelations[npc.name] ?? 0;
        const level = this.getRelationLevel(relation);
        // 关系标记
        const flags = gameState.relationshipFlags?.[npc.name];
        let flagStr = '';
        if (flags) {
          const activeFlags: string[] = [];
          if (flags.met) activeFlags.push('已相遇');
          if (flags.friend) activeFlags.push('朋友');
          if (flags.close) activeFlags.push('亲密');
          if (flags.lover) activeFlags.push('恋人');
          if (flags.betrayed) activeFlags.push('已背叛');
          if (activeFlags.length > 0) flagStr = ` [${activeFlags.join('/')}]`;
        }
        systemPrompt += `- ${npc.name}: ${npc.personality}（好感度: ${relation} - ${level}${flagStr}）\n`;
      }
      systemPrompt += '\n';
    }

    // 已触发的 flag 列表
    const triggeredFlags = Object.entries(gameState.flags)
      .filter(([, val]) => val === true)
      .map(([key]) => key);
    if (triggeredFlags.length > 0) {
      systemPrompt += `【已触发的剧情标记】\n`;
      for (const flag of triggeredFlags) {
        systemPrompt += `- ${flag}\n`;
      }
      systemPrompt += '\n';
    }

    // 已达成结局列表
    if (gameState.endings.length > 0) {
      systemPrompt += `【已达成结局】\n`;
      for (const ending of gameState.endings) {
        systemPrompt += `- ${ending}\n`;
      }
      systemPrompt += '\n';
    }

    // 战斗状态（如果正在战斗）
    if (gameState.combat) {
      const combat = gameState.combat;
      systemPrompt += `【当前战斗状态】\n`;
      systemPrompt += `- 敌方: ${combat.enemyName} (HP: ${combat.enemyHp}/${combat.enemyMaxHp}, 攻击: ${combat.enemyAttack}, 防御: ${combat.enemyDefense})\n`;
      systemPrompt += `- 玩家HP: ${combat.playerHp}/${combat.playerMaxHp}, 防御: ${combat.playerDefense}\n`;
      systemPrompt += `- 当前回合: ${combat.turn}\n\n`;
    }

    // 重要事件日志（蝴蝶效应追踪 - 显示最近5条）
    if (gameState.eventLog && gameState.eventLog.length > 0) {
      const recentEvents = gameState.eventLog.slice(-5);
      systemPrompt += `【近期重要事件（蝴蝶效应追踪）】\n`;
      for (const evt of recentEvents) {
        systemPrompt += `- 第${evt.chapter}章第${evt.day}天 [${evt.type}]: ${evt.description}`;
        if (evt.consequences) systemPrompt += ` → 后果: ${evt.consequences}`;
        systemPrompt += '\n';
      }
      systemPrompt += '\n注意：以上事件可能在未来产生连锁反应，请在叙事中适当呼应。\n\n';
    }

    // AI 返回格式说明
    systemPrompt += `请根据玩家的行动，描述接下来发生的事情，并在最后提供2-4个选项供玩家选择。\n`;
    systemPrompt += `必须严格使用以下JSON格式返回：\n`;
    systemPrompt += `{\n`;
    systemPrompt += `  "narrative": "场景描述...",\n`;
    systemPrompt += `  "choices": ["选项A", "选项B", "选项C"],\n`;
    systemPrompt += `  "attribute_changes": {"属性名": 变化值},\n`;
    systemPrompt += `  "item_changes": [{"action": "add|remove|equip", "item": {"id": "...", "name": "...", "description": "...", "type": "weapon|armor|consumable|quest|key|special", "quantity": 1, "stats": {...}, "emoji": "..."}}],\n`;
    systemPrompt += `  "skill_changes": [{"action": "learn|upgrade", "skill": {"id": "...", "name": "...", "description": "...", "level": 1, "maxLevel": 5, "cooldown": 3, "emoji": "..."}}],\n`;
    systemPrompt += `  "flag_changes": [{"flag": "flag_name", "value": true}],\n`;
    systemPrompt += `  "karma_change": 5,\n`;
    systemPrompt += `  "location_change": "新地点",\n`;
    systemPrompt += `  "time_change": "evening",\n`;
    systemPrompt += `  "npc_relation_changes": [{"npc": "名字", "change": 10}],\n`;
    systemPrompt += `  "dialogue": {"npc": "名字", "content": "对话内容"},\n`;
    systemPrompt += `  "combat": {"trigger": true, "enemy": {"name": "怪物名", "hp": 50, "maxHp": 50, "attack": 15, "defense": 5, "rewards": ["item_01"]}},\n`;
    systemPrompt += `  "ending": {"id": "ending_good", "title": "好结局", "description": "..."},\n`;
    systemPrompt += `  "achievement": {"id": "ach_01", "name": "成就名"}\n`;
    systemPrompt += `}\n\n`;
    systemPrompt += `注意：\n`;
    systemPrompt += `- narrative 是场景的详细描述，要生动有趣\n`;
    systemPrompt += `- choices 是2-4个供玩家选择的选项\n`;
    systemPrompt += `- attribute_changes 是属性变化，值为数字（正负均可），没有变化则为{}\n`;
    systemPrompt += `- item_changes 只在获得/失去/装备物品时包含\n`;
    systemPrompt += `- combat 只在触发战斗时包含\n`;
    systemPrompt += `- dialogue 只在有NPC对话时包含\n`;
    systemPrompt += `- flag_changes 在剧情标记发生变化时包含\n`;
    systemPrompt += `- karma_change 在善恶值发生变化时包含\n`;
    systemPrompt += `- ending 只在达成结局时包含\n`;
    systemPrompt += `- achievement 只在达成成就时包含\n`;
    systemPrompt += `- 没有变化的字段可以省略\n`;

    return systemPrompt;
  }

  // ========================
  // 物品系统
  // ========================

  /**
   * 使用/装备物品
   * @param sessionId 会话ID
   * @param userId 用户ID
   * @param itemId 物品ID
   * @param target 使用目标（可选，如NPC名字）
   */
  async useItem(sessionId: number, userId: number, itemId: string, target?: string) {
    const sessionData = await this.getSession(sessionId, userId);
    const gameState = sessionData.data.gameState;

    // 查找物品
    const itemIndex = gameState.inventory.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) {
      throw new BadRequestException('物品不存在于物品栏中');
    }

    const item = gameState.inventory[itemIndex];
    const messages: GameMessage[] = [];

    switch (item.type) {
      case 'consumable':
        // 消耗品：减少数量，触发效果
        item.quantity -= 1;
        // 应用物品属性加成（临时效果直接加到 attributes 上）
        if (item.stats) {
          for (const [attr, val] of Object.entries(item.stats)) {
            if (gameState.attributes[attr] !== undefined) {
              gameState.attributes[attr] += val;
            } else {
              gameState.attributes[attr] = val;
            }
          }
        }
        // 移除数量为0的物品
        if (item.quantity <= 0) {
          gameState.inventory.splice(itemIndex, 1);
        }
        messages.push({
          role: 'narrator',
          content: `你使用了 ${item.emoji ? item.emoji + ' ' : ''}${item.name}。${item.description}`,
          type: 'item',
          metadata: { action: 'use', itemId: item.id, target },
        });
        break;

      case 'weapon':
      case 'armor':
        // 装备品：先卸下同类装备，再装备新的
        // 先取消当前已装备的同类物品的加成
        for (const inv of gameState.inventory) {
          if (inv.type === item.type && inv.stats) {
            for (const [attr, val] of Object.entries(inv.stats)) {
              // 这里仅做标记，实际加成在 calculateEffectiveAttributes 中计算
            }
          }
        }
        messages.push({
          role: 'narrator',
          content: `你装备了 ${item.emoji ? item.emoji + ' ' : ''}${item.name}。${item.description}`,
          type: 'item',
          metadata: { action: 'equip', itemId: item.id },
        });
        break;

      case 'quest':
      case 'key':
      case 'special':
        // 任务物品/特殊物品通常不可直接使用
        messages.push({
          role: 'narrator',
          content: `${item.emoji ? item.emoji + ' ' : ''}${item.name} 无法在此处直接使用。`,
          type: 'item',
          metadata: { action: 'failed', itemId: item.id, reason: '此物品无法直接使用' },
        });
        break;

      default:
        throw new BadRequestException('未知的物品类型');
    }

    // 记录到历史
    gameState.history.push(...messages);

    // 更新状态
    await this.updateGameState(sessionId, gameState);

    return {
      success: true,
      data: {
        gameState,
        messages,
      },
    };
  }

  // ========================
  // 技能系统
  // ========================

  /**
   * 使用技能
   * @param sessionId 会话ID
   * @param userId 用户ID
   * @param skillId 技能ID
   */
  async useSkill(sessionId: number, userId: number, skillId: string) {
    const sessionData = await this.getSession(sessionId, userId);
    const gameState = sessionData.data.gameState;

    // 查找技能
    const skill = gameState.skills.find((s) => s.id === skillId);
    if (!skill) {
      throw new BadRequestException('你尚未学习此技能');
    }

    // 检查冷却
    if (skill.currentCooldown > 0) {
      throw new BadRequestException(`技能 ${skill.name} 正在冷却中，还需要 ${skill.currentCooldown} 回合`);
    }

    // 消耗 MP（如果有）
    const mpCost = skill.level * 5;
    const currentMp = gameState.attributes['MP'] ?? 0;
    if (currentMp < mpCost) {
      throw new BadRequestException(`MP不足！需要 ${mpCost} MP，当前 ${currentMp} MP`);
    }

    // 扣除 MP
    gameState.attributes['MP'] = currentMp - mpCost;

    // 设置冷却
    skill.currentCooldown = skill.cooldown;

    const messages: GameMessage[] = [];
    messages.push({
      role: 'combat',
      content: `你释放了 ${skill.emoji ? skill.emoji + ' ' : ''}${skill.name} (Lv.${skill.level})！消耗 ${mpCost} MP。`,
      type: 'skill',
      metadata: {
        skillId: skill.id,
        skillName: skill.name,
        level: skill.level,
        mpCost,
        cooldown: skill.cooldown,
      },
    });

    // 技能效果（简化处理：基于技能等级造成伤害/治疗）
    const skillPower = skill.level * 8;
    if (gameState.combat) {
      // 战斗中使用技能：对敌人造成额外伤害
      const enemyDef = gameState.combat.enemyDefense || 0;
      const damage = Math.max(1, skillPower - Math.floor(enemyDef / 2));
      gameState.combat.enemyHp = Math.max(0, gameState.combat.enemyHp - damage);
      messages.push({
        role: 'combat',
        content: `${skill.name} 对 ${gameState.combat.enemyName} 造成了 ${damage} 点伤害！`,
        type: 'combat',
        metadata: { damage, target: gameState.combat.enemyName },
      });
    } else {
      // 非战斗中：治疗效果
      const healAmount = skillPower;
      const currentHp = gameState.attributes['HP'] ?? 0;
      const maxHp = gameState.attributes['MaxHP'] ?? 100;
      gameState.attributes['HP'] = Math.min(maxHp, currentHp + healAmount);
      messages.push({
        role: 'narrator',
        content: `${skill.name} 发出了柔和的光芒，你恢复了 ${healAmount} 点 HP。`,
        type: 'skill',
        metadata: { healAmount },
      });
    }

    // 记录到历史
    gameState.history.push(...messages);

    // 更新状态
    await this.updateGameState(sessionId, gameState);

    return {
      success: true,
      data: {
        gameState,
        messages,
      },
    };
  }

  // ========================
  // 战斗系统
  // ========================

  /**
   * 处理战斗回合
   * @param sessionId 会话ID
   * @param userId 用户ID
   * @param action 行动类型：attack/defend/skill/item/flee
   * @param data 附加数据（skillId, itemId 等）
   */
  async processCombat(
    sessionId: number,
    userId: number,
    action: string,
    data?: { skillId?: string; itemId?: string },
  ) {
    const sessionData = await this.getSession(sessionId, userId);
    const gameState = sessionData.data.gameState;

    // 检查是否在战斗中
    if (!gameState.combat) {
      throw new BadRequestException('当前没有进行中的战斗');
    }

    const combat = gameState.combat;
    const messages: GameMessage[] = [];

    // 玩家回合开始，重置防御状态
    combat.isDefending = false;
    combat.turn += 1;

    // 计算有效属性
    const effectiveAttrs = this.calculateEffectiveAttributes(gameState);
    const playerAttack = effectiveAttrs['攻击力'] ?? 10;
    const playerDefense = effectiveAttrs['防御力'] ?? 5;
    combat.playerDefense = playerDefense;

    switch (action) {
      case 'attack': {
        // 普通攻击：玩家攻击力 - 敌方防御 = 伤害
        const enemyDef = combat.enemyDefense || 0;
        const damage = Math.max(1, playerAttack - enemyDef);
        combat.enemyHp = Math.max(0, combat.enemyHp - damage);
        messages.push({
          role: 'combat',
          content: `你向 ${combat.enemyName} 发起攻击，造成了 ${damage} 点伤害！`,
          type: 'combat',
          metadata: { action: 'attack', damage, remainingHp: combat.enemyHp },
        });
        break;
      }

      case 'defend': {
        // 防御：本回合受到伤害减半
        combat.isDefending = true;
        messages.push({
          role: 'combat',
          content: '你摆出防御姿态，本回合受到的伤害将减半。',
          type: 'combat',
          metadata: { action: 'defend' },
        });
        break;
      }

      case 'skill': {
        // 使用技能
        if (!data?.skillId) {
          throw new BadRequestException('使用技能需要指定 skillId');
        }
        const skill = gameState.skills.find((s) => s.id === data.skillId);
        if (!skill) {
          throw new BadRequestException('你尚未学习此技能');
        }
        if (skill.currentCooldown > 0) {
          throw new BadRequestException(`技能 ${skill.name} 正在冷却中`);
        }

        const mpCost = skill.level * 5;
        const currentMp = gameState.attributes['MP'] ?? 0;
        if (currentMp < mpCost) {
          throw new BadRequestException(`MP不足！需要 ${mpCost} MP`);
        }
        gameState.attributes['MP'] = currentMp - mpCost;
        skill.currentCooldown = skill.cooldown;

        const skillPower = skill.level * 8;
        const enemyDef = combat.enemyDefense || 0;
        const damage = Math.max(1, skillPower - Math.floor(enemyDef / 2));
        combat.enemyHp = Math.max(0, combat.enemyHp - damage);
        messages.push({
          role: 'combat',
          content: `你释放了 ${skill.emoji ? skill.emoji + ' ' : ''}${skill.name}，对 ${combat.enemyName} 造成了 ${damage} 点伤害！`,
          type: 'combat',
          metadata: { action: 'skill', skillId: skill.id, damage, remainingHp: combat.enemyHp },
        });
        break;
      }

      case 'item': {
        // 战斗中使用物品
        if (!data?.itemId) {
          throw new BadRequestException('使用物品需要指定 itemId');
        }
        const itemIndex = gameState.inventory.findIndex((i) => i.id === data.itemId);
        if (itemIndex === -1) {
          throw new BadRequestException('物品不存在');
        }
        const item = gameState.inventory[itemIndex];
        if (item.type !== 'consumable') {
          throw new BadRequestException('战斗中只能使用消耗品');
        }
        item.quantity -= 1;
        if (item.quantity <= 0) {
          gameState.inventory.splice(itemIndex, 1);
        }
        // 应用效果
        if (item.stats) {
          for (const [attr, val] of Object.entries(item.stats)) {
            if (attr === 'HP') {
              const maxHp = gameState.attributes['MaxHP'] ?? 100;
              gameState.attributes['HP'] = Math.min(maxHp, (gameState.attributes['HP'] ?? 0) + val);
            } else {
              gameState.attributes[attr] = (gameState.attributes[attr] ?? 0) + val;
            }
          }
        }
        messages.push({
          role: 'combat',
          content: `你在战斗中使用了 ${item.emoji ? item.emoji + ' ' : ''}${item.name}！`,
          type: 'item',
          metadata: { action: 'use_in_combat', itemId: item.id },
        });
        break;
      }

      case 'flee': {
        // 逃跑：基于敏捷属性判定
        const agility = effectiveAttrs['敏捷'] ?? 10;
        const fleeChance = Math.min(80, 30 + agility * 2); // 30%基础 + 敏捷加成，上限80%
        const roll = Math.random() * 100;
        if (roll < fleeChance) {
          // 逃跑成功
          messages.push({
            role: 'combat',
            content: `你成功逃离了战斗！(${Math.floor(fleeChance)}% 成功率)`,
            type: 'combat',
            metadata: { action: 'flee', success: true, chance: fleeChance },
          });
          gameState.combat = null;
          gameState.history.push(...messages);
          await this.updateGameState(sessionId, gameState);
          return {
            success: true,
            data: {
              gameState,
              messages,
              combatResult: 'fled',
            },
          };
        } else {
          // 逃跑失败
          messages.push({
            role: 'combat',
            content: `你试图逃跑，但被 ${combat.enemyName} 拦住了！(${Math.floor(fleeChance)}% 成功率)`,
            type: 'combat',
            metadata: { action: 'flee', success: false, chance: fleeChance },
          });
        }
        break;
      }

      default:
        throw new BadRequestException(`未知的战斗行动: ${action}`);
    }

    // 检查敌人是否死亡
    if (combat.enemyHp <= 0) {
      messages.push({
        role: 'combat',
        content: `${combat.enemyName} 被击败了！战斗胜利！`,
        type: 'combat',
        metadata: { event: 'victory' },
      });

      // 给予奖励物品
      if (combat.rewards && combat.rewards.length > 0) {
        for (const rewardId of combat.rewards) {
          // 查找是否已在物品栏中
          const existingItem = gameState.inventory.find((i) => i.id === rewardId);
          if (existingItem) {
            existingItem.quantity += 1;
          } else {
            gameState.inventory.push({
              id: rewardId,
              name: rewardId, // 实际名称应由剧本定义
              description: '战斗奖励',
              type: 'special',
              quantity: 1,
            });
          }
        }
        messages.push({
          role: 'narrator',
          content: `你获得了战斗奖励：${combat.rewards.join('、')}`,
          type: 'item',
          metadata: { action: 'rewards', items: combat.rewards },
        });
      }

      // 给予经验值（增加少量属性）
      gameState.attributes['攻击力'] = (gameState.attributes['攻击力'] ?? 10) + 1;

      // 结束战斗
      gameState.combat = null;
      gameState.history.push(...messages);
      await this.updateGameState(sessionId, gameState);

      return {
        success: true,
        data: {
          gameState,
          messages,
          combatResult: 'victory',
        },
      };
    }

    // 敌人回合：敌方反击
    const enemyDamage = Math.max(1, combat.enemyAttack - playerDefense);
    const actualDamage = combat.isDefending ? Math.floor(enemyDamage / 2) : enemyDamage;
    combat.playerHp = Math.max(0, combat.playerHp - actualDamage);
    gameState.attributes['HP'] = combat.playerHp;

    if (combat.isDefending && actualDamage < enemyDamage) {
      messages.push({
        role: 'combat',
        content: `${combat.enemyName} 发起攻击！你防御住了部分伤害，受到了 ${actualDamage} 点伤害（减免 ${enemyDamage - actualDamage}）。`,
        type: 'combat',
        metadata: { action: 'enemy_attack', damage: actualDamage, blocked: enemyDamage - actualDamage },
      });
    } else {
      messages.push({
        role: 'combat',
        content: `${combat.enemyName} 发起攻击！你受到了 ${actualDamage} 点伤害。`,
        type: 'combat',
        metadata: { action: 'enemy_attack', damage: actualDamage },
      });
    }

    // 检查玩家是否死亡
    if (combat.playerHp <= 0) {
      messages.push({
        role: 'combat',
        content: '你倒下了...战斗失败。',
        type: 'combat',
        metadata: { event: 'defeat' },
      });

      // 检查是否有复活物品
      const reviveItem = gameState.inventory.find((i) => i.id === 'revive_stone');
      if (reviveItem) {
        reviveItem.quantity -= 1;
        if (reviveItem.quantity <= 0) {
          gameState.inventory = gameState.inventory.filter((i) => i.id !== 'revive_stone');
        }
        const maxHp = gameState.attributes['MaxHP'] ?? 100;
        combat.playerHp = Math.floor(maxHp * 0.5);
        gameState.attributes['HP'] = combat.playerHp;
        messages.push({
          role: 'narrator',
          content: '一颗复活石发出耀眼的光芒，你勉强站了起来！（恢复50% HP）',
          type: 'item',
          metadata: { action: 'revive' },
        });
      } else {
        // 没有复活物品，结束战斗，回到上次存档
        gameState.combat = null;
        messages.push({
          role: 'system',
          content: '你被击败了。由于没有复活物品，游戏将回退到上次存档。',
          type: 'event',
          metadata: { event: 'game_over' },
        });
        gameState.history.push(...messages);
        await this.updateGameState(sessionId, gameState);

        return {
          success: true,
          data: {
            gameState,
            messages,
            combatResult: 'defeat',
            needReload: true, // 前端需要提示玩家读档
          },
        };
      }
    }

    // 减少技能冷却
    for (const skill of gameState.skills) {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown -= 1;
      }
    }

    gameState.history.push(...messages);
    await this.updateGameState(sessionId, gameState);

    return {
      success: true,
      data: {
        gameState,
        messages,
        combatResult: 'ongoing',
      },
    };
  }

  // ========================
  // NPC 对话系统
  // ========================

  /**
   * 获取NPC对话
   * @param sessionId 会话ID
   * @param userId 用户ID
   * @param npcName NPC名称
   */
  async getNpcDialogue(sessionId: number, userId: number, npcName: string) {
    const sessionData = await this.getSession(sessionId, userId);
    const gameState = sessionData.data.gameState;
    const script = sessionData.data.script;

    // 查找 NPC
    const npc = script.npcs?.find((n: any) => n.name === npcName);
    if (!npc) {
      throw new BadRequestException(`NPC "${npcName}" 不存在于此剧本中`);
    }

    const relation = gameState.npcRelations[npcName] ?? 0;
    const relationLevel = this.getRelationLevel(relation);

    // 根据好感度等级生成不同的对话选项
    let dialogueOptions: string[];
    if (relation >= 80) {
      dialogueOptions = [
        `[与${npcName}亲密交谈]`,
        `[请求${npcName}的帮助]`,
        `[询问${npcName}的秘密]`,
        `[赠送礼物给${npcName}]`,
      ];
    } else if (relation >= 50) {
      dialogueOptions = [
        `[和${npcName}聊天]`,
        `[请${npcName}帮忙]`,
        `[告别${npcName}]`,
      ];
    } else if (relation >= 0) {
      dialogueOptions = [
        `[向${npcName}打招呼]`,
        `[询问周围的情况]`,
        `[告别]`,
      ];
    } else {
      dialogueOptions = [
        `[警惕地与${npcName}交谈]`,
        `[保持距离]`,
        `[离开]`,
      ];
    }

    return {
      success: true,
      data: {
        npcName,
        personality: npc.personality,
        relation,
        relationLevel,
        dialogueOptions,
      },
    };
  }

  // ========================
  // 结局与成就系统
  // ========================

  /**
   * 检查结局条件
   * 根据当前 GameState 中的 flags、karma、attributes 等判断是否达成某个结局
   */
  async checkEndingConditions(sessionId: number, userId: number) {
    const sessionData = await this.getSession(sessionId, userId);
    const gameState = sessionData.data.gameState;
    const script = sessionData.data.script;

    const newlyUnlocked: string[] = [];

    // 基于善恶值的通用结局
    if (gameState.karma >= 90 && !gameState.endings.includes('ending_paragon')) {
      gameState.endings.push('ending_paragon');
      newlyUnlocked.push('ending_paragon');
    }
    if (gameState.karma <= -90 && !gameState.endings.includes('ending_villain')) {
      gameState.endings.push('ending_villain');
      newlyUnlocked.push('ending_villain');
    }

    // 基于章节和 flag 的结局（需要剧本定义特定 flag）
    if (
      gameState.chapter >= 5 &&
      gameState.flags['final_boss_defeated'] &&
      !gameState.endings.includes('ending_hero')
    ) {
      gameState.endings.push('ending_hero');
      newlyUnlocked.push('ending_hero');
    }

    if (
      gameState.chapter >= 5 &&
      gameState.flags['final_boss_defeated'] &&
      gameState.karma < -30 &&
      !gameState.endings.includes('ending_dark_hero')
    ) {
      gameState.endings.push('ending_dark_hero');
      newlyUnlocked.push('ending_dark_hero');
    }

    if (newlyUnlocked.length > 0) {
      await this.updateGameState(sessionId, gameState);
    }

    return {
      success: true,
      data: {
        allEndings: gameState.endings,
        newlyUnlocked,
      },
    };
  }

  /**
   * 检查游戏内成就
   */
  async checkGameAchievements(sessionId: number, userId: number) {
    const sessionData = await this.getSession(sessionId, userId);
    const gameState = sessionData.data.gameState;

    const newlyUnlocked: { id: string; name: string; description: string }[] = [];

    // 成就：首次战斗
    if (
      (gameState.attributes['攻击力'] ?? 0) > 10 &&
      !gameState.achievements.includes('ach_first_battle')
    ) {
      gameState.achievements.push('ach_first_battle');
      newlyUnlocked.push({ id: 'ach_first_battle', name: '初试锋芒', description: '首次参与战斗' });
    }

    // 成就：善人
    if (gameState.karma >= 50 && !gameState.achievements.includes('ach_good_person')) {
      gameState.achievements.push('ach_good_person');
      newlyUnlocked.push({ id: 'ach_good_person', name: '心地善良', description: '善恶值达到50以上' });
    }

    // 成就：恶人
    if (gameState.karma <= -50 && !gameState.achievements.includes('ach_bad_person')) {
      gameState.achievements.push('ach_bad_person');
      newlyUnlocked.push({ id: 'ach_bad_person', name: '心狠手辣', description: '善恶值降至-50以下' });
    }

    // 成就：收藏家
    if (gameState.inventory.length >= 10 && !gameState.achievements.includes('ach_collector')) {
      gameState.achievements.push('ach_collector');
      newlyUnlocked.push({ id: 'ach_collector', name: '收藏家', description: '物品栏中拥有10件以上物品' });
    }

    // 成就：博学多才
    if (gameState.skills.length >= 5 && !gameState.achievements.includes('ach_scholar')) {
      gameState.achievements.push('ach_scholar');
      newlyUnlocked.push({ id: 'ach_scholar', name: '博学多才', description: '学会5个以上技能' });
    }

    // 成就：富甲天下
    if ((gameState.attributes['金币'] ?? 0) >= 1000 && !gameState.achievements.includes('ach_rich')) {
      gameState.achievements.push('ach_rich');
      newlyUnlocked.push({ id: 'ach_rich', name: '富甲天下', description: '拥有1000金币以上' });
    }

    // 成就：旅者
    if (gameState.day >= 30 && !gameState.achievements.includes('ach_traveler')) {
      gameState.achievements.push('ach_traveler');
      newlyUnlocked.push({ id: 'ach_traveler', name: '旅者', description: '游戏内度过30天' });
    }

    // 成就：多结局
    if (gameState.endings.length >= 3 && !gameState.achievements.includes('ach_multi_ending')) {
      gameState.achievements.push('ach_multi_ending');
      newlyUnlocked.push({ id: 'ach_multi_ending', name: '命运多舛', description: '达成3个以上结局' });
    }

    if (newlyUnlocked.length > 0) {
      await this.updateGameState(sessionId, gameState);
    }

    return {
      success: true,
      data: {
        allAchievements: gameState.achievements,
        newlyUnlocked,
      },
    };
  }

  // ========================
  // 时间系统
  // ========================

  /** 时段顺序 */
  private static readonly DAY_TIME_ORDER: DayTime[] = [
    'dawn', 'morning', 'noon', 'afternoon', 'evening', 'night',
  ];

  /**
   * 推进游戏时间
   * @param sessionId 会话ID
   * @param userId 用户ID
   * @param hours 推进的小时数（默认3小时）
   */
  async advanceTime(sessionId: number, userId: number, hours: number = 3) {
    const sessionData = await this.getSession(sessionId, userId);
    const gameState = sessionData.data.gameState;

    const currentIndex = GameService.DAY_TIME_ORDER.indexOf(gameState.dayTime);
    // 每3小时推进一个时段
    const periodsToAdvance = Math.ceil(hours / 3);
    let newPeriodIndex = currentIndex + periodsToAdvance;

    // 如果跨越了夜晚，天数+1
    while (newPeriodIndex >= GameService.DAY_TIME_ORDER.length) {
      newPeriodIndex -= GameService.DAY_TIME_ORDER.length;
      gameState.day += 1;
    }

    gameState.dayTime = GameService.DAY_TIME_ORDER[newPeriodIndex];

    // 如果进入新的早晨，自动减少技能冷却
    if (gameState.dayTime === 'dawn' || gameState.dayTime === 'morning') {
      for (const skill of gameState.skills) {
        if (skill.currentCooldown > 0) {
          skill.currentCooldown = Math.max(0, skill.currentCooldown - 1);
        }
      }
    }

    const messages: GameMessage[] = [];
    messages.push({
      role: 'system',
      content: `时间流逝... 第${gameState.day}天 ${this.getDayTimeDescription(gameState.dayTime)}。`,
      type: 'event',
      metadata: { action: 'time_advance', day: gameState.day, dayTime: gameState.dayTime, hours },
    });

    gameState.history.push(...messages);
    await this.updateGameState(sessionId, gameState);

    return {
      success: true,
      data: {
        gameState,
        message: messages[0],
      },
    };
  }

  // ========================
  // 属性计算
  // ========================

  /**
   * 计算有效属性（基础 + 装备加成 + 技能加成）
   * 返回一个新的属性对象，不修改原始 gameState
   */
  calculateEffectiveAttributes(gameState: GameState): Record<string, number> {
    // 复制基础属性
    const effective: Record<string, number> = {};
    for (const [key, val] of Object.entries(gameState.attributes)) {
      effective[key] = typeof val === 'number' ? val : 0;
    }

    // 叠加装备加成
    for (const item of gameState.inventory) {
      if (item.stats && (item.type === 'weapon' || item.type === 'armor')) {
        for (const [attr, val] of Object.entries(item.stats)) {
          effective[attr] = (effective[attr] ?? 0) + val;
        }
      }
    }

    // 叠加技能被动加成（每级+2相关属性）
    for (const skill of gameState.skills) {
      // 简化：技能按名称匹配属性加成
      if (skill.name.includes('剑') || skill.name.includes('攻击')) {
        effective['攻击力'] = (effective['攻击力'] ?? 0) + skill.level * 2;
      }
      if (skill.name.includes('盾') || skill.name.includes('防御')) {
        effective['防御力'] = (effective['防御力'] ?? 0) + skill.level * 2;
      }
      if (skill.name.includes('疾') || skill.name.includes('迅')) {
        effective['敏捷'] = (effective['敏捷'] ?? 0) + skill.level * 2;
      }
    }

    return effective;
  }

  // ========================
  // 获取结局/成就列表
  // ========================

  /**
   * 获取所有已达成结局
   */
  async getEndings(sessionId: number, userId: number) {
    const sessionData = await this.getSession(sessionId, userId);
    const gameState = sessionData.data.gameState;

    return {
      success: true,
      data: {
        endings: gameState.endings,
      },
    };
  }

  /**
   * 获取游戏内成就
   */
  async getAchievements(sessionId: number, userId: number) {
    const sessionData = await this.getSession(sessionId, userId);
    const gameState = sessionData.data.gameState;

    return {
      success: true,
      data: {
        achievements: gameState.achievements,
      },
    };
  }

  // ========================
  // 商店交易
  // ========================

  /**
   * 商店交易
   * @param sessionId 会话ID
   * @param userId 用户ID
   * @param action 交易类型：buy/sell
   * @param itemId 物品ID
   * @param quantity 数量
   */
  async trade(
    sessionId: number,
    userId: number,
    action: string,
    itemId: string,
    quantity?: number,
  ) {
    const sessionData = await this.getSession(sessionId, userId);
    const gameState = sessionData.data.gameState;

    const qty = quantity || 1;
    const messages: GameMessage[] = [];

    if (action === 'buy') {
      // 购买物品：检查金币
      // 简化处理：物品ID作为价格查找键
      const prices: Record<string, number> = {
        'potion_hp': 10,
        'potion_mp': 15,
        'revive_stone': 100,
        'iron_sword': 50,
        'leather_armor': 40,
      };
      const price = prices[itemId] ?? 20; // 默认价格
      const totalCost = price * qty;
      const gold = gameState.attributes['金币'] ?? 0;

      if (gold < totalCost) {
        throw new BadRequestException(`金币不足！需要 ${totalCost} 金币，当前 ${gold} 金币`);
      }

      // 扣除金币
      gameState.attributes['金币'] = gold - totalCost;

      // 添加物品到物品栏
      const existingItem = gameState.inventory.find((i) => i.id === itemId);
      if (existingItem) {
        existingItem.quantity += qty;
      } else {
        const itemNames: Record<string, string> = {
          'potion_hp': '生命药水',
          'potion_mp': '魔力药水',
          'revive_stone': '复活石',
          'iron_sword': '铁剑',
          'leather_armor': '皮甲',
        };
        const itemDescriptions: Record<string, string> = {
          'potion_hp': '恢复30点HP',
          'potion_mp': '恢复20点MP',
          'revive_stone': '战斗中死亡时自动复活，恢复50%HP',
          'iron_sword': '一把普通的铁剑',
          'leather_armor': '轻便的皮甲',
        };
        const itemStats: Record<string, Record<string, number>> = {
          'potion_hp': { HP: 30 },
          'potion_mp': { MP: 20 },
          'iron_sword': { 攻击力: 5 },
          'leather_armor': { 防御力: 3 },
        };
        const itemTypes: Record<string, InventoryItem['type']> = {
          'potion_hp': 'consumable',
          'potion_mp': 'consumable',
          'revive_stone': 'special',
          'iron_sword': 'weapon',
          'leather_armor': 'armor',
        };
        gameState.inventory.push({
          id: itemId,
          name: itemNames[itemId] || itemId,
          description: itemDescriptions[itemId] || '未知物品',
          type: itemTypes[itemId] || 'special',
          quantity: qty,
          stats: itemStats[itemId],
        });
      }

      messages.push({
        role: 'narrator',
        content: `你花费 ${totalCost} 金币购买了 ${qty} 件物品。`,
        type: 'item',
        metadata: { action: 'buy', itemId, quantity: qty, cost: totalCost },
      });
    } else if (action === 'sell') {
      // 出售物品
      const itemIndex = gameState.inventory.findIndex((i) => i.id === itemId);
      if (itemIndex === -1) {
        throw new BadRequestException('物品不存在于物品栏中');
      }

      const item = gameState.inventory[itemIndex];
      const sellQty = Math.min(qty, item.quantity);
      const prices: Record<string, number> = {
        'potion_hp': 5,
        'potion_mp': 7,
        'revive_stone': 50,
        'iron_sword': 25,
        'leather_armor': 20,
      };
      const price = prices[itemId] ?? 10;
      const totalEarn = price * sellQty;

      // 增加金币
      gameState.attributes['金币'] = (gameState.attributes['金币'] ?? 0) + totalEarn;

      // 减少物品数量
      item.quantity -= sellQty;
      if (item.quantity <= 0) {
        gameState.inventory.splice(itemIndex, 1);
      }

      messages.push({
        role: 'narrator',
        content: `你出售了 ${sellQty} 件 ${item.name}，获得 ${totalEarn} 金币。`,
        type: 'item',
        metadata: { action: 'sell', itemId, quantity: sellQty, earned: totalEarn },
      });
    } else {
      throw new BadRequestException(`未知的交易类型: ${action}`);
    }

    gameState.history.push(...messages);
    await this.updateGameState(sessionId, gameState);

    return {
      success: true,
      data: {
        gameState,
        messages,
      },
    };
  }

  // ========================
  // 余额与计费
  // ========================

  /**
   * 检查用户余额是否足够
   * 简单估算：输入字符数 / 4 约等于 token 数
   */
  async checkBalance(userId: number, estimatedTokens: number): Promise<void> {
    const balance = await this.prisma.userBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message: '账户余额不存在，请充值',
          error: 'PaymentRequired',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const totalBalance = balance.permanentBalance + balance.tempBalance;
    const cost = Math.ceil(estimatedTokens * 0.1);

    if (totalBalance < cost) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message: `余额不足。需要 ${cost} UU币，当前余额 ${totalBalance} UU币`,
          error: 'PaymentRequired',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  /**
   * 扣费并记录交易 + 创作者分成（10%）
   */
  async deductTokens(
    userId: number,
    sessionId: number,
    inputTokens: number,
    outputTokens: number,
  ): Promise<void> {
    const totalTokens = inputTokens + outputTokens;
    const cost = Math.ceil(totalTokens * 0.1);

    // 更新用户余额（优先扣临时余额）
    const balance = await this.prisma.userBalance.findUnique({
      where: { userId },
    });

    if (!balance) return;

    let remaining = cost;
    let newTemp = balance.tempBalance;
    let newPermanent = balance.permanentBalance;

    if (newTemp >= remaining) {
      newTemp -= remaining;
      remaining = 0;
    } else {
      remaining -= newTemp;
      newTemp = 0;
      newPermanent -= remaining;
    }

    await this.prisma.userBalance.update({
      where: { userId },
      data: {
        tempBalance: Math.max(0, newTemp),
        permanentBalance: Math.max(0, newPermanent),
      },
    });

    // 记录交易日志
    await this.prisma.transactionLog.create({
      data: {
        userId,
        type: 'spend',
        amount: cost,
        currency: 'uu',
        description: `AI 调用消耗 ${totalTokens} tokens`,
        relatedType: 'ai_call',
        relatedId: sessionId,
      },
    });

    // 创作者分成：10%给剧本作者
    const creatorShare = Math.ceil(cost * 0.1);
    if (creatorShare > 0) {
      const session = await this.prisma.gameSession.findUnique({
        where: { id: sessionId },
        include: { script: { select: { authorId: true } } },
      });

      if (session && session.script.authorId !== userId) {
        const authorId = session.script.authorId;

        // 确保作者余额记录存在
        const authorBalance = await this.prisma.userBalance.findUnique({
          where: { userId: authorId },
        });

        if (!authorBalance) {
          await this.prisma.userBalance.create({
            data: {
              userId: authorId,
              permanentBalance: creatorShare,
              totalIncome: creatorShare,
            },
          });
        } else {
          await this.prisma.userBalance.update({
            where: { userId: authorId },
            data: {
              permanentBalance: { increment: creatorShare },
              totalIncome: { increment: creatorShare },
            },
          });
        }

        // 记录创作者收入
        await this.prisma.transactionLog.create({
          data: {
            userId: authorId,
            type: 'income',
            amount: creatorShare,
            currency: 'uu',
            description: `剧本被游玩，创作者分成（10%）`,
            relatedType: 'creator_income',
            relatedId: sessionId,
          },
        });
      }
    }

    // 更新会话统计
    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        totalTokens: { increment: totalTokens },
        totalCost: { increment: cost },
      },
    });

    // 通知用户余额变更
    const latestBalance = await this.prisma.userBalance.findUnique({
      where: { userId },
    });
    if (latestBalance) {
      this.realtimeService.sendBalanceUpdate(userId, {
        cost,
        totalTokens,
        permanentBalance: latestBalance.permanentBalance,
        tempBalance: latestBalance.tempBalance,
        total:
          latestBalance.permanentBalance + latestBalance.tempBalance,
        message: `本次消耗 ${cost} UU币`,
      });
    }
  }

  // ========================
  // 状态持久化
  // ========================

  /**
   * 更新游戏状态
   */
  async updateGameState(sessionId: number, gameState: GameState): Promise<void> {
    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        gameState: JSON.stringify(gameState),
      },
    });
  }
}
