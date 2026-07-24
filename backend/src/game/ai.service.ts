import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { StreamMessage } from './game.types';

@Injectable()
export class AiService {
  /**
   * 流式生成 AI 回复
   * 返回 Node.js Readable stream，每个 chunk 是一个 StreamMessage
   */
  async streamGenerate(
    messages: { role: string; content: string }[],
    options?: { model?: string; maxTokens?: number },
  ): Promise<Readable> {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

    if (!apiKey) {
      return this.mockStream();
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options?.model || 'gpt-4o-mini',
        messages,
        max_tokens: options?.maxTokens || 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return this.createErrorStream(
        `AI API error: ${response.status} - ${errorText}`,
      );
    }

    const body = response.body;
    if (!body) {
      return this.createErrorStream('No response body from AI API');
    }

    return this.parseSseStream(body as unknown as NodeJS.ReadableStream);
  }

  /**
   * 解析 OpenAI SSE 流，提取文本内容
   */
  private parseSseStream(body: NodeJS.ReadableStream): Readable {
    const readable = new Readable({ objectMode: true });
    readable._read = () => {};

    const chunks: string[] = [];

    body.on('data', (chunk: any) => {
      chunks.push(chunk.toString());
      this.processSseLines(chunks.join(''), readable);
    });

    body.on('end', () => {
      const fullBuffer = chunks.join('');
      this.processSseLines(fullBuffer, readable);
      readable.push(null);
    });

    body.on('error', (err: Error) => {
      readable.destroy(err);
    });

    return readable;
  }

  private processSseLines(buffer: string, readable: Readable): void {
    const lines = buffer.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            readable.push({ type: 'text', content } as StreamMessage);
          }
        } catch {
          // 跳过无法解析的行
        }
      }
    }
  }

  /**
   * 创建模拟流（无 API Key 时的开发模式）
   * 包含增强的 SSE 消息类型演示
   */
  private mockStream(): Readable {
    const mockText =
      '你站在一片广袤的草原上，远处隐约可以看到一座古老的城堡。风中传来若有若无的音乐声，仿佛在召唤着你。天空呈现出奇异的紫色，星辰在白昼中闪烁。一位旅人从远处走来，向你招手示意。';
    const mockChoices = [
      '向城堡走去',
      '与旅人交谈',
      '寻找音乐声的来源',
      '回头查看来时的路',
    ];
    const mockAttributes = {
      勇气: 5,
      智慧: 3,
      人气: 2,
    };

    const readable = new Readable({ objectMode: true });
    readable._read = () => {};

    // 模拟逐字输出
    let index = 0;
    const interval = setInterval(() => {
      if (index < mockText.length) {
        // 每次输出 2-4 个字符
        const len = Math.min(
          Math.floor(Math.random() * 3) + 2,
          mockText.length - index,
        );
        readable.push({
          type: 'text',
          content: mockText.slice(index, index + len),
        } as StreamMessage);
        index += len;
      } else {
        clearInterval(interval);

        // 发送选项
        readable.push({ type: 'choices', data: mockChoices } as StreamMessage);
        // 发送属性变化
        readable.push({ type: 'attribute_change', data: mockAttributes } as StreamMessage);

        // 发送物品变化事件（模拟获得物品）
        readable.push({
          type: 'item_change',
          data: {
            action: 'add',
            item: {
              id: 'rusty_sword',
              name: '生锈的剑',
              description: '一把古老但尚能使用的剑',
              type: 'weapon',
              quantity: 1,
              stats: { 攻击力: 3 },
              emoji: '🗡️',
            },
          },
        } as StreamMessage);

        // 发送 NPC 好感度变化
        readable.push({
          type: 'npc_relation_change',
          data: { npc: '旅人', change: 5 },
        } as StreamMessage);

        // 发送善恶值变化
        readable.push({
          type: 'karma_change',
          data: { change: 3, description: '你帮助了旅人，善恶值增加了' },
        } as StreamMessage);

        // 发送 flag 变化
        readable.push({
          type: 'flag_change',
          data: { flag: 'met_traveler', value: true },
        } as StreamMessage);

        // 发送对话
        readable.push({
          type: 'dialogue',
          data: { npc: '旅人', content: '你好，旅者。前方的城堡最近不太平静，你要小心。' },
        } as StreamMessage);

        // 发送完成信号
        readable.push({ type: 'done' } as StreamMessage);
        readable.push(null);
      }
    }, 30);

    return readable;
  }

  private createErrorStream(message: string): Readable {
    const readable = new Readable({ objectMode: true });
    readable._read = () => {};
    setImmediate(() => {
      readable.push({ type: 'error', content: message } as StreamMessage);
      readable.push(null);
    });
    return readable;
  }

  // ========================
  // AI 返回 JSON 解析辅助方法
  // ========================

  /**
   * 从流式文本中提取并解析 AI 返回的 JSON
   * 处理扩展的 JSON 返回格式，将各种变化事件转化为独立的 StreamMessage
   * @param fullText 完整的 AI 回复文本
   * @returns 解析结果和需要发送的 SSE 消息列表
   */
  parseAiResponse(fullText: string): {
    parsed: any | null;
    events: StreamMessage[];
  } {
    const events: StreamMessage[] = [];

    try {
      // 尝试提取 JSON（可能被 markdown 代码块包裹）
      let jsonStr = fullText;
      const codeBlockMatch = fullText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { parsed: null, events };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // 处理属性变化
      if (
        parsed.attribute_changes &&
        Object.keys(parsed.attribute_changes).length > 0
      ) {
        events.push({
          type: 'attribute_change',
          data: parsed.attribute_changes,
        });
      }

      // 处理物品变化
      if (parsed.item_changes && Array.isArray(parsed.item_changes)) {
        for (const itemChange of parsed.item_changes) {
          events.push({
            type: 'item_change',
            data: itemChange,
          });
        }
      }

      // 处理技能变化
      if (parsed.skill_changes && Array.isArray(parsed.skill_changes)) {
        for (const skillChange of parsed.skill_changes) {
          events.push({
            type: 'skill_change',
            data: skillChange,
          });
        }
      }

      // 处理 flag 变化
      if (parsed.flag_changes && Array.isArray(parsed.flag_changes)) {
        for (const flagChange of parsed.flag_changes) {
          events.push({
            type: 'flag_change',
            data: flagChange,
          });
        }
      }

      // 处理善恶值变化
      if (parsed.karma_change !== undefined && parsed.karma_change !== null) {
        events.push({
          type: 'karma_change',
          data: { change: parsed.karma_change },
        });
      }

      // 处理位置变化
      if (parsed.location_change) {
        events.push({
          type: 'location_change',
          data: { location: parsed.location_change },
        });
      }

      // 处理时间变化
      if (parsed.time_change) {
        events.push({
          type: 'time_change',
          data: { dayTime: parsed.time_change },
        });
      }

      // 处理 NPC 好感度变化
      if (parsed.npc_relation_changes && Array.isArray(parsed.npc_relation_changes)) {
        for (const relChange of parsed.npc_relation_changes) {
          events.push({
            type: 'npc_relation_change',
            data: relChange,
          });
        }
      }

      // 处理 NPC 对话
      if (parsed.dialogue) {
        events.push({
          type: 'dialogue',
          data: parsed.dialogue,
        });
      }

      // 处理战斗触发
      if (parsed.combat && parsed.combat.trigger) {
        events.push({
          type: 'combat_start',
          data: parsed.combat.enemy,
        });
      }

      // 处理结局达成
      if (parsed.ending) {
        events.push({
          type: 'ending',
          data: parsed.ending,
        });
      }

      // 处理成就达成
      if (parsed.achievement) {
        events.push({
          type: 'achievement',
          data: parsed.achievement,
        });
      }

      return { parsed, events };
    } catch {
      // JSON 解析失败
      return { parsed: null, events };
    }
  }

  /**
   * 将解析出的事件应用到 GameState
   * 返回是否成功应用了变化
   */
  static applyAiResponseToGameState(
    parsed: any,
    gameState: any,
  ): void {
    if (!parsed) return;

    // 应用属性变化
    if (parsed.attribute_changes) {
      for (const [key, val] of Object.entries(parsed.attribute_changes)) {
        const numVal = Number(val);
        if (gameState.attributes[key] !== undefined) {
          gameState.attributes[key] += numVal;
        } else {
          gameState.attributes[key] = numVal;
        }
      }
    }

    // 应用善恶值变化
    if (parsed.karma_change !== undefined && parsed.karma_change !== null) {
      gameState.karma = Math.max(-100, Math.min(100, (gameState.karma || 0) + Number(parsed.karma_change)));
    }

    // 应用位置变化
    if (parsed.location_change) {
      gameState.location = parsed.location_change;
    }

    // 应用时间变化
    if (parsed.time_change) {
      gameState.dayTime = parsed.time_change;
    }

    // 应用 NPC 好感度变化
    if (parsed.npc_relation_changes) {
      for (const rel of parsed.npc_relation_changes) {
        const npcName = rel.npc;
        if (npcName && gameState.npcRelations) {
          gameState.npcRelations[npcName] = (gameState.npcRelations[npcName] || 0) + Number(rel.change);
        }
      }
    }

    // 应用 flag 变化
    if (parsed.flag_changes) {
      for (const flag of parsed.flag_changes) {
        if (flag.flag && gameState.flags) {
          gameState.flags[flag.flag] = flag.value;
        }
      }
    }

    // 应用物品变化
    if (parsed.item_changes) {
      for (const itemChange of parsed.item_changes) {
        const itemData = itemChange.item;
        if (!itemData || !itemData.id) continue;

        switch (itemChange.action) {
          case 'add': {
            const existing = gameState.inventory.find((i: any) => i.id === itemData.id);
            if (existing) {
              existing.quantity += (itemData.quantity || 1);
            } else {
              gameState.inventory.push({
                id: itemData.id,
                name: itemData.name || itemData.id,
                description: itemData.description || '',
                type: itemData.type || 'special',
                quantity: itemData.quantity || 1,
                stats: itemData.stats,
                emoji: itemData.emoji,
              });
            }
            break;
          }
          case 'remove': {
            const idx = gameState.inventory.findIndex((i: any) => i.id === itemData.id);
            if (idx !== -1) {
              gameState.inventory[idx].quantity -= (itemData.quantity || 1);
              if (gameState.inventory[idx].quantity <= 0) {
                gameState.inventory.splice(idx, 1);
              }
            }
            break;
          }
          case 'equip': {
            // 装备逻辑在 useItem 中处理，这里仅做标记
            break;
          }
        }
      }
    }

    // 应用技能变化
    if (parsed.skill_changes) {
      for (const skillChange of parsed.skill_changes) {
        const skillData = skillChange.skill;
        if (!skillData || !skillData.id) continue;

        switch (skillChange.action) {
          case 'learn': {
            const exists = gameState.skills.find((s: any) => s.id === skillData.id);
            if (!exists) {
              gameState.skills.push({
                id: skillData.id,
                name: skillData.name || skillData.id,
                description: skillData.description || '',
                level: skillData.level || 1,
                maxLevel: skillData.maxLevel || 5,
                cooldown: skillData.cooldown || 3,
                currentCooldown: 0,
                emoji: skillData.emoji,
              });
            }
            break;
          }
          case 'upgrade': {
            const skill = gameState.skills.find((s: any) => s.id === skillData.id);
            if (skill) {
              skill.level = Math.min(skill.maxLevel, (skillData.level || skill.level) + 1);
            }
            break;
          }
        }
      }
    }

    // 应用战斗触发
    if (parsed.combat && parsed.combat.trigger && parsed.combat.enemy) {
      const enemy = parsed.combat.enemy;
      const maxHp = enemy.maxHp || enemy.hp || 50;
      const playerMaxHp = gameState.attributes.MaxHP || 100;
      gameState.combat = {
        enemyName: enemy.name || '未知敌人',
        enemyHp: enemy.hp || maxHp,
        enemyMaxHp: maxHp,
        enemyAttack: enemy.attack || 10,
        enemyDefense: enemy.defense || 5,
        playerHp: gameState.attributes.HP || playerMaxHp,
        playerMaxHp: playerMaxHp,
        playerDefense: gameState.attributes.防御力 || 5,
        turn: 0,
        isDefending: false,
        rewards: enemy.rewards,
      };
    }

    // 应用结局
    if (parsed.ending && parsed.ending.id) {
      if (!gameState.endings.includes(parsed.ending.id)) {
        gameState.endings.push(parsed.ending.id);
      }
    }

    // 应用成就
    if (parsed.achievement && parsed.achievement.id) {
      if (!gameState.achievements.includes(parsed.achievement.id)) {
        gameState.achievements.push(parsed.achievement.id);
      }
    }
  }
}
