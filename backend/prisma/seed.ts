import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed Style Templates
  const styleTemplates = [
    {
      name: '武侠仙侠',
      icon: '⚔️',
      preview: '古风武侠，剑气纵横',
      prompt: '你是一个古风武侠世界的叙述者。请用古典中文风格描述场景，注重氛围渲染，融入江湖恩怨、武功招式和侠义精神。',
    },
    {
      name: '现代都市',
      icon: '🏙️',
      preview: '现代都市，职场情场',
      prompt: '你是一个现代都市故事的叙述者。请用现代白话文描述场景，融入都市生活元素、职场细节和现代人物关系。',
    },
    {
      name: '科幻星际',
      icon: '🚀',
      preview: '未来科幻，星际探索',
      prompt: '你是一个科幻故事的叙述者。请用科技感的语言描述场景，注重宇宙的宏大感和未来科技细节，融入太空探索和人工智能元素。',
    },
    {
      name: '恐怖悬疑',
      icon: '👻',
      preview: '暗夜惊悚，层层迷雾',
      prompt: '你是一个恐怖悬疑故事的叙述者。请用阴暗压抑的语言描述场景，营造恐怖氛围，注重心理暗示和细节描写，逐步揭示真相。',
    },
    {
      name: '浪漫言情',
      icon: '💕',
      preview: '甜蜜恋爱，心路历程',
      prompt: '你是一个浪漫言情故事的叙述者。请用温暖细腻的语言描述场景，注重人物心理描写和情感变化，融入甜蜜和感动的元素。',
    },
  ];

  for (const style of styleTemplates) {
    await prisma.styleTemplate.upsert({
      where: { id: styleTemplates.indexOf(style) + 1 },
      update: style,
      create: style,
    });
  }
  console.log(`Seeded ${styleTemplates.length} style templates`);

  // Seed AI Models
  const aiModels = [
    {
      name: 'gpt-4o-mini',
      displayName: 'GPT-4o Mini',
      rate: 1.0,
      backendModel: 'gpt-4o-mini',
      multimodal: true,
      maxTokens: 4096,
      isActive: true,
    },
    {
      name: 'gpt-4o',
      displayName: 'GPT-4o',
      rate: 2.5,
      backendModel: 'gpt-4o',
      multimodal: true,
      maxTokens: 8192,
      isActive: true,
    },
    {
      name: 'gpt-3.5-turbo',
      displayName: 'GPT-3.5 Turbo',
      rate: 0.5,
      backendModel: 'gpt-3.5-turbo',
      multimodal: false,
      maxTokens: 4096,
      isActive: true,
    },
    {
      name: 'claude-3-haiku',
      displayName: 'Claude 3 Haiku',
      rate: 0.8,
      backendModel: 'claude-3-haiku-20240307',
      multimodal: true,
      maxTokens: 4096,
      isActive: true,
    },
    {
      name: 'claude-3-sonnet',
      displayName: 'Claude 3 Sonnet',
      rate: 2.0,
      backendModel: 'claude-3-sonnet-20240229',
      multimodal: true,
      maxTokens: 8192,
      isActive: true,
    },
    {
      name: 'deepseek-chat',
      displayName: 'DeepSeek Chat',
      rate: 0.3,
      backendModel: 'deepseek-chat',
      multimodal: false,
      maxTokens: 4096,
      isActive: true,
    },
    {
      name: 'qwen-turbo',
      displayName: '通义千问 Turbo',
      rate: 0.2,
      backendModel: 'qwen-turbo',
      multimodal: false,
      maxTokens: 4096,
      isActive: true,
    },
  ];

  for (const model of aiModels) {
    await prisma.aiModel.upsert({
      where: { name: model.name },
      update: model,
      create: model,
    });
  }
  console.log(`Seeded ${aiModels.length} AI models`);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
