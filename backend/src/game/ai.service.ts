import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';

interface StreamMessage {
  type: 'text' | 'choices' | 'attribute_change' | 'done' | 'error';
  content?: string;
  data?: any;
}

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
            readable.push({ type: 'text', content });
          }
        } catch {
          // 跳过无法解析的行
        }
      }
    }
  }

  /**
   * 创建模拟流（无 API Key 时的开发模式）
   */
  private mockStream(): Readable {
    const mockText =
      '你站在一片广袤的草原上，远处隐约可以看到一座古老的城堡。风中传来若有若无的音乐声，仿佛在召唤着你。天空呈现出奇异的紫色，星辰在白昼中闪烁。';
    const mockChoices = [
      '向城堡走去',
      '寻找音乐声的来源',
      '在原地驻足观察',
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
        });
        index += len;
      } else {
        clearInterval(interval);
        // 发送选项
        readable.push({ type: 'choices', data: mockChoices });
        // 发送属性变化
        readable.push({ type: 'attribute_change', data: mockAttributes });
        readable.push({ type: 'done' });
        readable.push(null);
      }
    }, 30);

    return readable;
  }

  private createErrorStream(message: string): Readable {
    const readable = new Readable({ objectMode: true });
    readable._read = () => {};
    setImmediate(() => {
      readable.push({ type: 'error', content: message });
      readable.push(null);
    });
    return readable;
  }
}
