import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ScriptLogicConfig,
  EventChain,
  EndingTrigger,
  StoryArc,
  EventCondition,
  EventTrigger,
  EventEffect,
  LogicEvaluationResult,
  TriggeredEvent,
  TriggeredEnding,
  createDefaultLogicConfig,
  migrateCharConfig,
  CharacterCreationConfig,
} from './script-logic.types';
import { GameState } from '../game/game.types';

/**
 * 剧本逻辑引擎服务
 * 
 * 核心能力：
 * 1. 管理剧本逻辑配置（CRUD）
 * 2. 运行时条件评估（检查事件触发、结局达成）
 * 3. 生成逻辑提示注入AI prompt
 * 4. 应用事件效果到GameState
 */
@Injectable()
export class ScriptLogicService {
  constructor(private prisma: PrismaService) {}

  // ========================
  // 逻辑配置管理
  // ========================

  /**
   * 获取剧本逻辑配置
   */
  async getLogicConfig(scriptId: number): Promise<ScriptLogicConfig> {
    const script = await this.prisma.script.findUnique({
      where: { id: scriptId },
      select: { logicConfig: true, charConfig: true },
    });

    if (!script) {
      throw new NotFoundException('剧本不存在');
    }

    // 尝试解析 logicConfig
    let config: ScriptLogicConfig;
    try {
      config = JSON.parse(script.logicConfig || '{}');
      // 补齐缺失字段
      const defaults = createDefaultLogicConfig();
      config = {
        ...defaults,
        ...config,
        characterCreation: config.characterCreation || defaults.characterCreation,
      };
    } catch {
      config = createDefaultLogicConfig();
    }

    // 如果 characterCreation.fields 为空，尝试从 charConfig 迁移
    if (config.characterCreation.fields.length === 0 && script.charConfig) {
      try {
        const oldConfig = JSON.parse(script.charConfig);
        if (typeof oldConfig === 'object' && !oldConfig.fields) {
          config.characterCreation = migrateCharConfig(oldConfig);
        }
      } catch {
        // 忽略解析错误
      }
    }

    return config;
  }

  /**
   * 保存剧本逻辑配置
   */
  async saveLogicConfig(scriptId: number, userId: number, config: ScriptLogicConfig) {
    const script = await this.prisma.script.findUnique({ where: { id: scriptId } });
    if (!script) throw new NotFoundException('剧本不存在');
    if (script.authorId !== userId) throw new ForbiddenException('无权编辑此剧本');

    await this.prisma.script.update({
      where: { id: scriptId },
      data: { logicConfig: JSON.stringify(config) },
    });

    return { success: true, config };
  }

  /**
   * 更新角色创建配置
   */
  async updateCharacterCreation(scriptId: number, userId: number, charCreation: CharacterCreationConfig) {
    const config = await this.getLogicConfig(scriptId);
    config.characterCreation = charCreation;
    return this.saveLogicConfig(scriptId, userId, config);
  }

  /**
   * 添加事件链
   */
  async addEventChain(scriptId: number, userId: number, eventChain: EventChain) {
    const config = await this.getLogicConfig(scriptId);
    config.eventChains.push(eventChain);
    return this.saveLogicConfig(scriptId, userId, config);
  }

  /**
   * 更新事件链
   */
  async updateEventChain(scriptId: number, userId: number, eventChainId: string, updates: Partial<EventChain>) {
    const config = await this.getLogicConfig(scriptId);
    const idx = config.eventChains.findIndex(e => e.id === eventChainId);
    if (idx === -1) throw new NotFoundException('事件链不存在');
    config.eventChains[idx] = { ...config.eventChains[idx], ...updates };
    return this.saveLogicConfig(scriptId, userId, config);
  }

  /**
   * 删除事件链
   */
  async deleteEventChain(scriptId: number, userId: number, eventChainId: string) {
    const config = await this.getLogicConfig(scriptId);
    config.eventChains = config.eventChains.filter(e => e.id !== eventChainId);
    return this.saveLogicConfig(scriptId, userId, config);
  }

  /**
   * 添加结局触发器
   */
  async addEndingTrigger(scriptId: number, userId: number, ending: EndingTrigger) {
    const config = await this.getLogicConfig(scriptId);
    config.endingTriggers.push(ending);
    return this.saveLogicConfig(scriptId, userId, config);
  }

  /**
   * 更新结局触发器
   */
  async updateEndingTrigger(scriptId: number, userId: number, endingId: string, updates: Partial<EndingTrigger>) {
    const config = await this.getLogicConfig(scriptId);
    const idx = config.endingTriggers.findIndex(e => e.id === endingId);
    if (idx === -1) throw new NotFoundException('结局触发器不存在');
    config.endingTriggers[idx] = { ...config.endingTriggers[idx], ...updates };
    return this.saveLogicConfig(scriptId, userId, config);
  }

  /**
   * 删除结局触发器
   */
  async deleteEndingTrigger(scriptId: number, userId: number, endingId: string) {
    const config = await this.getLogicConfig(scriptId);
    config.endingTriggers = config.endingTriggers.filter(e => e.id !== endingId);
    return this.saveLogicConfig(scriptId, userId, config);
  }

  /**
   * 更新故事章节
   */
  async updateStoryArcs(scriptId: number, userId: number, storyArcs: StoryArc[]) {
    const config = await this.getLogicConfig(scriptId);
    config.storyArcs = storyArcs;
    return this.saveLogicConfig(scriptId, userId, config);
  }

  // ========================
  // 运行时逻辑评估引擎
  // ========================

  /**
   * 评估当前游戏状态下的所有逻辑
   * 检查事件触发、结局达成、章节进度
   */
  evaluateLogic(gameState: GameState, logicConfig: ScriptLogicConfig): LogicEvaluationResult {
    const triggeredEvents: TriggeredEvent[] = [];
    const triggeredEndings: TriggeredEnding[] = [];
    const availableEventHints: string[] = [];
    const suggestions: string[] = [];

    // 1. 检查事件链触发
    for (const chain of logicConfig.eventChains) {
      if (!chain.enabled) continue;

      // 检查是否已触发过（onceOnly 事件）
      if (chain.onceOnly && gameState.flags[`event_${chain.id}`]) continue;

      // 检查触发条件
      if (!this.checkTrigger(chain.trigger, gameState)) continue;

      // 检查前置条件
      const allConditionsMet = chain.conditions.every(cond => this.checkCondition(cond, gameState));
      if (!allConditionsMet) continue;

      triggeredEvents.push({
        eventChainId: chain.id,
        name: chain.name,
        effects: chain.effects,
        narrative: chain.description,
      });
    }

    // 2. 检查结局触发
    for (const ending of logicConfig.endingTriggers) {
      // 检查是否已达成
      if (gameState.endings.includes(ending.id)) continue;

      const allConditionsMet = ending.conditions.every(cond => this.checkCondition(cond, gameState));
      if (allConditionsMet) {
        triggeredEndings.push({
          endingId: ending.id,
          title: ending.title,
          type: ending.type,
          narrative: ending.narrative,
        });
      }
    }

    // 3. 确定当前章节
    const currentArc = this.getCurrentStoryArc(gameState, logicConfig);

    // 4. 检查属性阈值
    for (const threshold of logicConfig.attributeThresholds) {
      if (threshold.onceOnly && gameState.flags[`threshold_${threshold.attributeName}_${threshold.threshold}`]) continue;

      const attrValue = gameState.attributes[threshold.attributeName];
      if (attrValue === undefined) continue;

      if (this.evaluateOperator(attrValue, threshold.operator, threshold.threshold)) {
        availableEventHints.push(threshold.description);
      }
    }

    // 5. 生成AI叙事建议
    if (currentArc) {
      suggestions.push(`当前处于第${currentArc.chapter}章「${currentArc.title}」，核心冲突：${currentArc.summary}`);
      if (currentArc.keyEvents.length > 0) {
        suggestions.push(`本章关键事件：${currentArc.keyEvents.join('、')}`);
      }
    }

    if (triggeredEvents.length > 0) {
      suggestions.push(`有${triggeredEvents.length}个事件即将触发，请在叙事中自然融入`);
    }

    if (triggeredEndings.length > 0) {
      suggestions.push(`检测到达成结局条件：${triggeredEndings.map(e => e.title).join('、')}`);
    }

    // 6. 检查NPC触发配置
    for (const npcConfig of logicConfig.npcTriggerConfig) {
      const relation = gameState.npcRelations[npcConfig.npcName] ?? 0;
      for (const threshold of npcConfig.relationThresholds) {
        if (relation >= threshold.threshold) {
          const flagKey = `npc_${npcConfig.npcName}_${threshold.threshold}`;
          if (!gameState.flags[flagKey]) {
            availableEventHints.push(`${npcConfig.npcName}好感度达到${threshold.threshold}（${threshold.level}）：${threshold.description}`);
          }
        }
      }
    }

    return {
      triggeredEvents,
      triggeredEndings,
      availableEventHints,
      currentArc,
      suggestions,
    };
  }

  /**
   * 生成逻辑提示文本（注入AI system prompt）
   */
  buildLogicPrompt(gameState: GameState, logicConfig: ScriptLogicConfig): string {
    let prompt = '';

    // 故事章节信息
    if (logicConfig.storyArcs.length > 0) {
      const currentArc = this.getCurrentStoryArc(gameState, logicConfig);
      if (currentArc) {
        prompt += `【当前故事章节】\n`;
        prompt += `第${currentArc.chapter}章：${currentArc.title}\n`;
        prompt += `本章概述：${currentArc.summary}\n`;
        if (currentArc.keyEvents.length > 0) {
          prompt += `关键事件：${currentArc.keyEvents.join('、')}\n`;
        }
        if (currentArc.keyNpcs && currentArc.keyNpcs.length > 0) {
          prompt += `本章重要角色：${currentArc.keyNpcs.join('、')}\n`;
        }
        prompt += '\n';
      }

      // 显示所有章节大纲（供AI参考整体结构）
      if (logicConfig.storyArcs.length > 1) {
        prompt += `【故事大纲】\n`;
        for (const arc of logicConfig.storyArcs) {
          prompt += `第${arc.chapter}章「${arc.title}」: ${arc.summary}\n`;
        }
        prompt += '\n';
      }
    }

    // 结局条件提示（不直接透露，但给AI方向）
    if (logicConfig.endingTriggers.length > 0) {
      prompt += `【可能的结局方向】\n`;
      for (const ending of logicConfig.endingTriggers) {
        if (ending.isHidden) continue; // 隐藏结局不提示
        prompt += `- ${ending.title}（${ending.type}）: ${ending.description}\n`;
      }
      prompt += '\n注意：结局应根据玩家选择自然达成，不要强行触发。隐藏结局不要透露。\n\n';
    }

    // 事件链提示
    if (logicConfig.eventChains.length > 0) {
      const activeChains = logicConfig.eventChains.filter(c => c.enabled);
      if (activeChains.length > 0) {
        prompt += `【剧本事件配置】\n`;
        prompt += `以下是创作者配置的事件，请在合适时机自然融入叙事：\n`;
        for (const chain of activeChains) {
          prompt += `- 事件「${chain.name}」: ${chain.description}\n`;
          if (chain.conditions.length > 0) {
            prompt += `  触发条件：${chain.conditions.map(c => c.description || `${c.target} ${c.operator} ${c.value}`).join(' 且 ')}\n`;
          }
        }
        prompt += '\n';
      }
    }

    // NPC触发配置提示
    if (logicConfig.npcTriggerConfig.length > 0) {
      prompt += `【NPC关系发展配置】\n`;
      for (const npcConfig of logicConfig.npcTriggerConfig) {
        prompt += `- ${npcConfig.npcName}: ${npcConfig.meetScene}\n`;
        for (const threshold of npcConfig.relationThresholds) {
          prompt += `  好感度≥${threshold.threshold}（${threshold.level}）: ${threshold.description}\n`;
        }
      }
      prompt += '\n';
    }

    // 属性阈值提示
    if (logicConfig.attributeThresholds.length > 0) {
      prompt += `【属性阈值规则】\n`;
      for (const threshold of logicConfig.attributeThresholds) {
        prompt += `- ${threshold.attributeName} ${threshold.operator} ${threshold.threshold}: ${threshold.description}\n`;
      }
      prompt += '\n';
    }

    // 自定义规则
    if (logicConfig.customRules) {
      prompt += `【创作者自定义规则】\n${logicConfig.customRules}\n\n`;
    }

    return prompt;
  }

  /**
   * 将事件效果应用到游戏状态
   */
  applyEventEffects(gameState: GameState, effects: EventEffect[]): GameState {
    const newState = { ...gameState, attributes: { ...gameState.attributes } };

    for (const effect of effects) {
      switch (effect.type) {
        case 'attribute_change':
          if (newState.attributes[effect.target] !== undefined) {
            newState.attributes[effect.target] += Number(effect.value);
          } else {
            newState.attributes[effect.target] = Number(effect.value);
          }
          break;

        case 'flag_set':
          newState.flags[effect.target] = Boolean(effect.value);
          break;

        case 'npc_relation_change':
          newState.npcRelations[effect.target] = (newState.npcRelations[effect.target] || 0) + Number(effect.value);
          break;

        case 'karma_change':
          newState.karma += Number(effect.value);
          break;

        case 'location_change':
          newState.location = effect.target;
          break;

        case 'chapter_change':
          newState.chapter = Number(effect.target);
          break;

        case 'item_give':
          if (effect.value && typeof effect.value === 'object') {
            newState.inventory.push(effect.value);
          }
          break;

        case 'skill_learn':
          if (effect.value && typeof effect.value === 'object') {
            newState.skills.push(effect.value);
          }
          break;

        // 其他效果类型由AI在叙事中处理
        default:
          break;
      }
    }

    return newState;
  }

  // ========================
  // 条件评估工具方法
  // ========================

  /**
   * 检查触发条件
   */
  private checkTrigger(trigger: EventTrigger, gameState: GameState): boolean {
    switch (trigger.type) {
      case 'location':
        return this.evaluateOperator(gameState.location, trigger.operator, trigger.value);

      case 'chapter':
        return this.evaluateOperator(gameState.chapter, trigger.operator, Number(trigger.value));

      case 'time':
        return this.evaluateOperator(gameState.dayTime, trigger.operator, trigger.value);

      case 'attribute':
        const attrVal = gameState.attributes[trigger.target];
        if (attrVal === undefined) return false;
        return this.evaluateOperator(attrVal, trigger.operator, Number(trigger.value));

      case 'flag':
        const flagVal = gameState.flags[trigger.target];
        return this.evaluateOperator(flagVal || false, trigger.operator, trigger.value);

      case 'npc_relation':
        const relation = gameState.npcRelations[trigger.target] ?? 0;
        return this.evaluateOperator(relation, trigger.operator, Number(trigger.value));

      case 'karma':
        return this.evaluateOperator(gameState.karma, trigger.operator, Number(trigger.value));

      case 'day':
        return this.evaluateOperator(gameState.day, trigger.operator, Number(trigger.value));

      case 'turn_count':
        return this.evaluateOperator(gameState.history.length, trigger.operator, Number(trigger.value));

      default:
        return true; // custom 类型由AI判断
    }
  }

  /**
   * 检查前置条件
   */
  private checkCondition(condition: EventCondition, gameState: GameState): boolean {
    switch (condition.type) {
      case 'attribute':
        const attrVal = gameState.attributes[condition.target];
        if (attrVal === undefined) return false;
        return this.evaluateOperator(attrVal, condition.operator, Number(condition.value));

      case 'flag':
        return this.evaluateOperator(gameState.flags[condition.target] || false, condition.operator, condition.value);

      case 'npc_relation':
        const relation = gameState.npcRelations[condition.target] ?? 0;
        return this.evaluateOperator(relation, condition.operator, Number(condition.value));

      case 'karma':
        return this.evaluateOperator(gameState.karma, condition.operator, Number(condition.value));

      case 'chapter':
        return this.evaluateOperator(gameState.chapter, condition.operator, Number(condition.value));

      case 'day':
        return this.evaluateOperator(gameState.day, condition.operator, Number(condition.value));

      case 'inventory':
        const hasItem = gameState.inventory.some(item => 
          item.name === condition.target || item.id === condition.target
        );
        return condition.operator === 'exists' ? hasItem : !hasItem;

      case 'skill':
        const hasSkill = gameState.skills.some(skill => 
          skill.name === condition.target || skill.id === condition.target
        );
        return condition.operator === 'exists' ? hasSkill : !hasSkill;

      case 'ending':
        const hasEnding = gameState.endings.includes(condition.target);
        return condition.operator === 'exists' ? hasEnding : !hasEnding;

      default:
        return true; // custom 类型默认通过（由AI判断）
    }
  }

  /**
   * 通用运算符评估
   */
  private evaluateOperator(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'eq':
        return actual === expected;
      case 'ne':
        return actual !== expected;
      case 'gt':
        return Number(actual) > Number(expected);
      case 'lt':
        return Number(actual) < Number(expected);
      case 'gte':
        return Number(actual) >= Number(expected);
      case 'lte':
        return Number(actual) <= Number(expected);
      case 'contains':
        if (Array.isArray(actual)) return actual.includes(expected);
        if (typeof actual === 'string') return actual.includes(String(expected));
        return false;
      case 'not_contains':
        if (Array.isArray(actual)) return !actual.includes(expected);
        if (typeof actual === 'string') return !actual.includes(String(expected));
        return true;
      case 'between':
        if (Array.isArray(expected) && expected.length === 2) {
          return Number(actual) >= Number(expected[0]) && Number(actual) <= Number(expected[1]);
        }
        return false;
      case 'exists':
        return Boolean(actual);
      default:
        return false;
    }
  }

  /**
   * 获取当前故事章节
   */
  private getCurrentStoryArc(gameState: GameState, logicConfig: ScriptLogicConfig): StoryArc | null {
    if (logicConfig.storyArcs.length === 0) return null;

    // 按章节号排序
    const sortedArcs = [...logicConfig.storyArcs].sort((a, b) => a.chapter - b.chapter);

    // 找到当前章节对应的arc
    for (const arc of sortedArcs) {
      if (arc.chapter === gameState.chapter) return arc;
    }

    // 如果没有精确匹配，找到不超过当前章节的最大的章节
    let result: StoryArc | null = null;
    for (const arc of sortedArcs) {
      if (arc.chapter <= gameState.chapter) {
        result = arc;
      } else {
        break;
      }
    }

    return result || sortedArcs[0];
  }

  // ========================
  // 生成唯一ID
  // ========================
  generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
