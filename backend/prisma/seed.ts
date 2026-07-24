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

  // Seed Redemption Codes
  const redemptionCodes = [
    {
      code: 'WELCOME100',
      uuAmount: 100,
      maxUses: 1000,
      currentUses: 0,
      expiresAt: new Date('2027-12-31'),
    },
    {
      code: 'VIP500',
      uuAmount: 500,
      maxUses: 100,
      currentUses: 0,
      expiresAt: new Date('2027-06-30'),
    },
    {
      code: 'TEST999',
      uuAmount: 999,
      maxUses: 10,
      currentUses: 0,
      expiresAt: new Date('2027-12-31'),
    },
  ];

  for (const rc of redemptionCodes) {
    await prisma.redemptionCode.upsert({
      where: { code: rc.code },
      update: rc,
      create: rc,
    });
  }
  console.log(`Seeded ${redemptionCodes.length} redemption codes`);

  // Seed Announcements
  const announcements = [
    {
      title: '欢迎使用 AI Text Adventure',
      content: '欢迎来到 AI Text Adventure 平台！注册即送 100 UU币，快来创建你的第一个剧本吧。',
      type: 'normal',
    },
    {
      title: '平台更新通知',
      content: '新增社区广场功能，支持发布动态、点赞评论、关注创作者。快来体验吧！',
      type: 'normal',
    },
  ];

  for (const ann of announcements) {
    await prisma.announcement.upsert({
      where: { id: announcements.indexOf(ann) + 1 },
      update: ann,
      create: ann,
    });
  }
  console.log(`Seeded ${announcements.length} announcements`);

  // Seed Achievements
  const achievements = [
    {
      code: 'first_login',
      name: '新手上路',
      description: '完成首次登录，开启你的冒险之旅',
      icon: '🌱',
      category: 'general',
      condition: JSON.stringify({ type: 'first_login', threshold: 1 }),
      reward: 50,
    },
    {
      code: 'first_script',
      name: '初出茅庐',
      description: '创作你的第一个剧本',
      icon: '✍️',
      category: 'creator',
      condition: JSON.stringify({ type: 'script_count', threshold: 1 }),
      reward: 100,
    },
    {
      code: 'famous_creator',
      name: '小有名气',
      description: '创作 5 个剧本，开始被更多人认识',
      icon: '📈',
      category: 'creator',
      condition: JSON.stringify({ type: 'script_count', threshold: 5 }),
      reward: 300,
    },
    {
      code: 'master_creator',
      name: '创作大师',
      description: '创作 10 个剧本，成为真正的创作大师',
      icon: '🎨',
      category: 'creator',
      condition: JSON.stringify({ type: 'script_count', threshold: 10 }),
      reward: 800,
    },
    {
      code: 'first_explorer',
      name: '初探险者',
      description: '完成 10 次游戏游玩',
      icon: '🧭',
      category: 'player',
      condition: JSON.stringify({ type: 'play_count', threshold: 10 }),
      reward: 100,
    },
    {
      code: 'adventurer',
      name: '冒险家',
      description: '完成 50 次游戏游玩，经验丰富',
      icon: '⚔️',
      category: 'player',
      condition: JSON.stringify({ type: 'play_count', threshold: 50 }),
      reward: 500,
    },
    {
      code: 'legend_player',
      name: '传奇玩家',
      description: '完成 100 次游戏游玩，成为传奇',
      icon: '👑',
      category: 'player',
      condition: JSON.stringify({ type: 'play_count', threshold: 100 }),
      reward: 1000,
    },
    {
      code: 'small_star',
      name: '小网红',
      description: '获得 10 个粉丝关注',
      icon: '⭐',
      category: 'social',
      condition: JSON.stringify({ type: 'follower_count', threshold: 10 }),
      reward: 200,
    },
    {
      code: 'popular_star',
      name: '人气王',
      description: '获得 50 个粉丝关注，人气爆棚',
      icon: '🌟',
      category: 'social',
      condition: JSON.stringify({ type: 'follower_count', threshold: 50 }),
      reward: 600,
    },
    {
      code: 'collector',
      name: '收藏家',
      description: '收藏 5 个剧本',
      icon: '📚',
      category: 'player',
      condition: JSON.stringify({ type: 'favorite_count', threshold: 5 }),
      reward: 100,
    },
    {
      code: 'commenter',
      name: '评论家',
      description: '发表 10 条评论',
      icon: '💬',
      category: 'social',
      condition: JSON.stringify({ type: 'comment_count', threshold: 10 }),
      reward: 150,
    },
    {
      code: 'promoter',
      name: '推广大使',
      description: '成功邀请 5 位好友加入',
      icon: '🎁',
      category: 'social',
      condition: JSON.stringify({ type: 'invite_count', threshold: 5 }),
      reward: 500,
    },
    {
      code: 'big_spender',
      name: '金主爸爸',
      description: '累计消费 1000 UU币',
      icon: '💰',
      category: 'general',
      condition: JSON.stringify({ type: 'total_spent', threshold: 1000 }),
      reward: 200,
    },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: ach,
      create: ach,
    });
  }
  console.log(`Seeded ${achievements.length} achievements`);

  // Seed Script Templates (官方模板)
  const scriptTemplates = [
    {
      name: '奇幻冒险',
      category: 'fantasy',
      description: '剑与魔法的奇幻世界，踏上英雄之旅，探索古老的遗迹与龙族的秘密。',
      coverEmoji: '⚔️',
      worldSetting: '在艾尔迪亚大陆，魔法与剑刃交织。千年前的龙族战争留下了无数遗迹与宝藏，冒险者公会招募勇者探索未知。你是一名初出茅庐的冒险者，怀揣着成为传奇的英雄梦想，踏上了这片充满奇遇的土地。',
      stylePrompt: '你是一个奇幻冒险故事的叙述者。请用史诗般的语言描述场景，融入魔法元素、种族文化和英雄主义，注重战斗描写和探索发现的惊喜感。',
      npcTemplate: JSON.stringify([
        { name: '艾琳娜', personality: '精灵族法师，智慧冷静，对古老魔法有深厚研究，说话带有学者的严谨' },
        { name: '索尔', personality: '矮人战士，豪爽直率，力大无穷，喜欢喝酒和讲故事，对朋友极其忠诚' },
        { name: '梅林', personality: '神秘的老法师，冒险者公会会长，知晓许多秘密，说话隐晦但总在关键时刻指点迷津' },
      ]),
      attrTemplate: JSON.stringify([
        { name: '生命值', type: 'number', defaultVal: '100', minVal: 0, maxVal: 999 },
        { name: '魔法值', type: 'number', defaultVal: '50', minVal: 0, maxVal: 999 },
        { name: '力量', type: 'number', defaultVal: '10', minVal: 1, maxVal: 99 },
        { name: '敏捷', type: 'number', defaultVal: '10', minVal: 1, maxVal: 99 },
      ]),
      nodeTemplate: JSON.stringify([
        { type: 'scene', content: '你站在冒险者公会的大门前，阳光透过彩色玻璃洒在石板路上。门楣上刻着古老的符文，散发着微弱的蓝光。', choices: [] },
        { type: 'choice', content: '你会怎么做？', choices: [
          { text: '推门进入公会' },
          { text: '先观察周围环境' },
          { text: '检查门上的符文' },
        ]},
        { type: 'scene', content: '公会大厅内人声鼎沸，各色冒险者在此交流任务信息。柜台后的接待员微笑着看向你。', choices: [] },
      ]),
      useCount: 1280,
      rating: 4.7,
    },
    {
      name: '校园恋爱',
      category: 'romance',
      description: '樱花飘落的校园里，一段青涩而甜蜜的恋爱故事正在展开。',
      coverEmoji: '💕',
      worldSetting: '星海学园，一所综合性高中。樱花大道、天台、图书馆、社团教室——每个角落都可能藏着心动的故事。新学期开始了，转学生来到这里，命运的齿轮悄然转动。',
      stylePrompt: '你是一个校园恋爱故事的叙述者。请用温暖细腻的语言描述场景，注重人物心理描写和情感变化，融入青春校园的日常细节和心动瞬间。',
      npcTemplate: JSON.stringify([
        { name: '林晓晓', personality: '班长，温柔体贴，成绩优异，外表文静但内心热情，喜欢在图书馆阅读' },
        { name: '苏雨', personality: '美术社社长，活泼开朗，总是带着画板，说话直率但善良，有着艺术家般的感性' },
        { name: '陈默', personality: '同班同学，沉默寡言的学霸，看似冷漠实则心思细腻，篮球打得很好' },
      ]),
      attrTemplate: JSON.stringify([
        { name: '好感度', type: 'number', defaultVal: '50', minVal: 0, maxVal: 100 },
        { name: '勇气', type: 'number', defaultVal: '30', minVal: 0, maxVal: 100 },
        { name: '魅力', type: 'number', defaultVal: '40', minVal: 0, maxVal: 100 },
      ]),
      nodeTemplate: JSON.stringify([
        { type: 'scene', content: '开学第一天，你背着书包走进星海学园的校门。樱花瓣随风飘落，空气中弥漫着新学期的气息。', choices: [] },
        { type: 'choice', content: '你会去哪里？', choices: [
          { text: '先去教室报到' },
          { text: '去图书馆看看' },
          { text: '在校园里逛逛' },
        ]},
        { type: 'scene', content: '走廊尽头，一个扎着马尾的女生抱着一摞书匆匆跑来，眼看就要撞上你了。', choices: [] },
      ]),
      useCount: 2150,
      rating: 4.8,
    },
    {
      name: '悬疑推理',
      category: 'mystery',
      description: '暴风雨之夜，古老的庄园里发生了一起离奇命案。真相只有一个。',
      coverEmoji: '🔍',
      worldSetting: '1947年，英国乡间的黑鸦庄园。暴风雨切断了所有对外联络，庄园主人亨利·布莱克在书房中离奇死亡。五位嫌疑人被困在庄园内，每个人都有动机，每个人都有不在场证明的破绽。你是受邀前来的侦探，必须在黎明前找出真凶。',
      stylePrompt: '你是一个悬疑推理故事的叙述者。请用冷静克制的语言描述场景，注重细节描写和逻辑推理，营造紧张悬疑的氛围，逐步释放线索引导玩家思考。',
      npcTemplate: JSON.stringify([
        { name: '管家雷金纳德', personality: '在庄园服务三十年的老管家，举止得体但眼神闪烁，似乎隐瞒着什么秘密' },
        { name: '维多利亚夫人', personality: '死者的妻子，优雅高傲，表面悲痛但嘴角偶尔闪过一丝不易察觉的笑意' },
        { name: '詹姆斯医生', personality: '家庭医生，沉稳专业，与死者有金钱纠纷，对毒理学颇有研究' },
      ]),
      attrTemplate: JSON.stringify([
        { name: '推理值', type: 'number', defaultVal: '60', minVal: 0, maxVal: 100 },
        { name: '线索数', type: 'number', defaultVal: '0', minVal: 0, maxVal: 99 },
        { name: '怀疑度', type: 'number', defaultVal: '30', minVal: 0, maxVal: 100 },
      ]),
      nodeTemplate: JSON.stringify([
        { type: 'scene', content: '暴雨倾盆，你站在黑鸦庄园的门廊下。闪电划过夜空，映照出这座维多利亚式建筑的阴森轮廓。管家为你打开了沉重的大门。', choices: [] },
        { type: 'choice', content: '你会先调查哪里？', choices: [
          { text: '前往案发的书房' },
          { text: '询问管家案发经过' },
          { text: '查看庄园的平面图' },
        ]},
        { type: 'scene', content: '书房内弥漫着雪茄和威士忌的气味。死者倒在书桌旁，桌上的茶杯还有余温。窗户从内反锁，但窗台上有细微的刮痕。', choices: [] },
      ]),
      useCount: 960,
      rating: 4.6,
    },
    {
      name: '末日求生',
      category: 'horror',
      description: '丧尸病毒爆发后的第30天，你和幸存者们在一座废弃超市中艰难求生。',
      coverEmoji: '🧟',
      worldSetting: '一场不明病毒席卷全球，感染者变成嗜血的丧尸。城市沦陷，通讯中断，政府瓦解。你和几个陌生人在一座废弃的大型超市中建立了临时据点。食物在减少，弹药所剩无几，而丧尸群正在向这里逼近。每一个决定都关乎生死。',
      stylePrompt: '你是一个末日求生故事的叙述者。请用紧张压抑的语言描述场景，注重生存细节和资源管理，营造绝望与希望交织的氛围，每个选择都充满风险。',
      npcTemplate: JSON.stringify([
        { name: '老张', personality: '退伍军人，冷静果断，有着丰富的野外生存经验，话不多但每句都切中要害' },
        { name: '小雨', personality: '大学生，惊恐但坚强，学过急救知识，是团队中唯一的医疗人员' },
      ]),
      attrTemplate: JSON.stringify([
        { name: '生命值', type: 'number', defaultVal: '80', minVal: 0, maxVal: 100 },
        { name: '饥饿度', type: 'number', defaultVal: '40', minVal: 0, maxVal: 100 },
        { name: '体力', type: 'number', defaultVal: '60', minVal: 0, maxVal: 100 },
        { name: '精神值', type: 'number', defaultVal: '50', minVal: 0, maxVal: 100 },
        { name: '弹药', type: 'number', defaultVal: '12', minVal: 0, maxVal: 99 },
      ]),
      nodeTemplate: JSON.stringify([
        { type: 'scene', content: '清晨，你被远处传来的嘶吼声惊醒。透过超市破碎的玻璃门，可以看到数十个丧尸正在街道上徘徊。对讲机里传来老张的声音："水源被污染了，我们最多还能撑两天。"', choices: [] },
        { type: 'choice', content: '你决定：', choices: [
          { text: '组织小队外出搜寻物资' },
          { text: '加固超市防御工事' },
          { text: '尝试修复通讯设备求救' },
        ]},
        { type: 'scene', content: '超市的仓库里，你发现了一扇通往地下停车场的铁门。门缝下有微弱的光线透出，但门上布满了抓痕——有什么东西曾在里面挣扎过。', choices: [] },
      ]),
      useCount: 1540,
      rating: 4.5,
    },
    {
      name: '武侠江湖',
      category: 'wuxia',
      description: '刀光剑影的江湖恩怨，一壶浊酒，一把长剑，仗剑天涯。',
      coverEmoji: '🗡️',
      worldSetting: '大梁朝末年，朝廷腐败，江湖纷争不断。各大门派为争夺失传已久的《天机剑谱》明争暗斗。你本是山野村夫，偶得一位隐世高人传授剑法，如今师父仙逝，你奉遗命下山，踏入这风起云涌的江湖。武林大会在即，一场腥风血雨即将到来。',
      stylePrompt: '你是一个武侠江湖故事的叙述者。请用古典雅致的语言描述场景，融入武功招式、江湖规矩和侠义精神，注重意境营造和人物风骨描写。',
      npcTemplate: JSON.stringify([
        { name: '柳如烟', personality: '青云阁阁主之女，武功高强且聪慧过人，外表冷若冰霜实则重情重义，擅长使用暗器' },
        { name: '醉道人', personality: '看似疯癫的乞丐老头，实为隐世高手，嗜酒如命，总在关键时刻以看似荒唐的方式指点迷津' },
        { name: '萧无痕', personality: '江湖第一快剑，孤傲冷峻，为报师仇行走江湖，与你有不打不相识的缘分' },
      ]),
      attrTemplate: JSON.stringify([
        { name: '内力', type: 'number', defaultVal: '100', minVal: 0, maxVal: 999 },
        { name: '剑法', type: 'number', defaultVal: '20', minVal: 1, maxVal: 99 },
        { name: '轻功', type: 'number', defaultVal: '15', minVal: 1, maxVal: 99 },
        { name: '江湖声望', type: 'number', defaultVal: '0', minVal: 0, maxVal: 999 },
      ]),
      nodeTemplate: JSON.stringify([
        { type: 'scene', content: '你背着师父留下的长剑，行走在通往洛阳城的官道上。夕阳西下，远处传来兵刃相交之声。路边茶棚里，几个江湖人士正低声议论着武林大会的消息。', choices: [] },
        { type: 'choice', content: '你打算：', choices: [
          { text: '去茶棚打探消息' },
          { text: '循声前往查看' },
          { text: '继续赶路不理会' },
        ]},
        { type: 'scene', content: '茶棚中，一位白衣女子独坐角落，手边放着一把未出鞘的软剑。她注意到你的目光，微微抬起头来，眼中闪过一丝精光。"你的剑法……是苍云山的路子？"', choices: [] },
      ]),
      useCount: 1120,
      rating: 4.7,
    },
    {
      name: '科幻探索',
      category: 'scifi',
      description: '星际移民船"曙光号"在未知星域遭遇异常信号，一段深空冒险就此开始。',
      coverEmoji: '🚀',
      worldSetting: '公元2387年，人类已开始星际殖民。探索舰"曙光号"执行深空探测任务时，在仙女座边缘捕获了一段未知信号。信号似乎来自一颗不存在于星图上的行星。舰长决定前往调查，而你——舰上的首席科学官——将面对人类历史上最大的发现，或是最大的威胁。',
      stylePrompt: '你是一个科幻探索故事的叙述者。请用充满科技感的语言描述场景，注重宇宙的宏大与神秘，融入硬科幻元素和哲学思考，营造敬畏与未知的氛围。',
      npcTemplate: JSON.stringify([
        { name: '舰长赵薇', personality: '曙光号舰长，沉着冷静的军人出身，决策果断但重视船员安全，有着不为人知的过往' },
        { name: 'AI·星辰', personality: '舰载人工智能系统，理性高效，拥有自主学习能力，偶尔展现出超乎程序的"情感"波动' },
      ]),
      attrTemplate: JSON.stringify([
        { name: '氧气', type: 'number', defaultVal: '100', minVal: 0, maxVal: 100 },
        { name: '能源', type: 'number', defaultVal: '80', minVal: 0, maxVal: 100 },
        { name: '理智值', type: 'number', defaultVal: '90', minVal: 0, maxVal: 100 },
        { name: '科技点', type: 'number', defaultVal: '50', minVal: 0, maxVal: 999 },
      ]),
      nodeTemplate: JSON.stringify([
        { type: 'scene', content: '星图上，那颗未知的行星正逐渐放大。它通体漆黑，不反射任何光线，却持续发出那段神秘的信号。AI·星辰的声音响起："检测到异常重力场，建议保持安全距离。但信号源位于行星表面……"', choices: [] },
        { type: 'choice', content: '你的建议是：', choices: [
          { text: '派遣无人机先行侦察' },
          { text: '亲自带队登陆调查' },
          { text: '尝试解码信号内容' },
        ]},
        { type: 'scene', content: '登陆舱穿越了浓密的黑雾，降落在一片晶体丛林中。这些晶体发出幽蓝的光芒，排列方式似乎遵循某种规律。你的探测器开始疯狂报警——这些晶体正在"呼吸"。', choices: [] },
      ]),
      useCount: 870,
      rating: 4.6,
    },
    {
      name: '恐怖故事',
      category: 'horror',
      description: '深夜的废弃精神病院，一次 dare 变成的噩梦。你能活着走出去吗？',
      coverEmoji: '👻',
      worldSetting: '城郊的"安宁疗养院"废弃已有二十年。传闻这里曾发生过骇人听闻的医疗实验，夜深时常有哭声传出。你和三个朋友打赌要在这里过夜。当大门在身后关闭的那一刻，手机信号消失了，而你听到了走廊深处传来的脚步声……',
      stylePrompt: '你是一个恐怖故事的叙述者。请用阴森压抑的语言描述场景，善用环境音效和心理恐惧，节奏由慢及快，制造层层递进的惊悚感，在适当时刻给予 jump scare。',
      npcTemplate: JSON.stringify([
        { name: '阿杰', personality: '你的发小，胆大嘴硬，提议来探险的人，但此刻已经有点后悔了' },
        { name: '小薇', personality: '灵异爱好者，随身带着 EVP 录音仪和电磁探测器，兴奋中带着不安' },
      ]),
      attrTemplate: JSON.stringify([
        { name: '理智值', type: 'number', defaultVal: '100', minVal: 0, maxVal: 100 },
        { name: '体力', type: 'number', defaultVal: '80', minVal: 0, maxVal: 100 },
        { name: '手电电量', type: 'number', defaultVal: '70', minVal: 0, maxVal: 100 },
      ]),
      nodeTemplate: JSON.stringify([
        { type: 'scene', content: '晚上11点，你们站在疗养院锈迹斑斑的铁门前。月光被乌云遮蔽，只剩下手电筒苍白的光柱。阿杰推了推门，发出刺耳的嘎吱声。空气中有股说不清的腐朽味道。', choices: [] },
        { type: 'choice', content: '你们决定：', choices: [
          { text: '一起从正门进入' },
          { text: '分头搜索更快结束' },
          { text: '先绕建筑外围看看' },
        ]},
        { type: 'scene', content: '大厅里散落着破碎的轮椅和发黄的病历。墙上有人用指甲刮出的字迹，歪歪扭扭地写着"他们还在这"。突然，二楼传来一声重物落地的闷响。', choices: [] },
      ]),
      useCount: 1350,
      rating: 4.4,
    },
    {
      name: '职场风云',
      category: 'school',
      description: '从实习生到CEO的逆袭之路，商海沉浮，步步为营。',
      coverEmoji: '💼',
      worldSetting: '锐星科技，一家快速崛起的互联网独角兽。你刚从名校毕业，以管培生身份进入公司。这里有勾心斗角的办公室政治，也有并肩作战的战友；有惊心动魄的商业博弈，也有温暖人心的职场故事。三个月后就是年度述职，你能否在这场没有硝烟的战争中脱颖而出？',
      stylePrompt: '你是一个职场故事的叙述者。请用现代都市的写实语言描述场景，注重职场细节和人际博弈，融入商业逻辑和职场生存法则，节奏紧凑且贴近现实。',
      npcTemplate: JSON.stringify([
        { name: '王总监', personality: '直属上司，严厉但公正的职场老手，嘴上不饶人但会暗中提携有潜力的新人' },
        { name: '李娜', personality: '同期管培生，能力出众且野心勃勃，既是合作伙伴也是竞争对手，性格圆滑' },
        { name: '老周', personality: '公司元老级工程师，技术大牛但不善交际，对公司有着深厚感情，看不惯办公室政治' },
      ]),
      attrTemplate: JSON.stringify([
        { name: '人脉值', type: 'number', defaultVal: '30', minVal: 0, maxVal: 100 },
        { name: '业绩分', type: 'number', defaultVal: '40', minVal: 0, maxVal: 100 },
        { name: '精力值', type: 'number', defaultVal: '80', minVal: 0, maxVal: 100 },
      ]),
      nodeTemplate: JSON.stringify([
        { type: 'scene', content: '周一早上8:50，你踏入锐星科技的大楼。前台打卡机前排着长队，电梯间人潮涌动。手机弹出消息：王总监让你9:30到会议室，有一个紧急项目要交代。', choices: [] },
        { type: 'choice', content: '在开会前，你打算：', choices: [
          { text: '先去茶水间和同事打听消息' },
          { text: '直接去工位准备材料' },
          { text: '找李娜了解情况' },
        ]},
        { type: 'scene', content: '会议室里，王总监面色凝重："竞品提前发布了相似功能，我们的项目必须提前两周上线。这个任务，我交给你负责协调。"整个房间安静了几秒。李娜看了你一眼，眼神复杂。', choices: [] },
      ]),
      useCount: 780,
      rating: 4.3,
    },
    {
      name: '星际海盗',
      category: 'scifi',
      description: '在星际边境，成为一名法外之徒，劫掠商船，追寻传说中的宇宙宝藏。',
      coverEmoji: '🏴‍☠️',
      worldSetting: '银河联邦的边境星域——"无主地带"，法律触及不到的三不管区域。这里充斥着星际海盗、走私犯和赏金猎人。你是"夜枭号"的船长，带着一群亡命之徒在这片星域中谋生。传说在星云深处，藏着一艘远古文明的遗舰，里面的财富足以买下整个星系。',
      stylePrompt: '你是一个太空冒险故事的叙述者。请用洒脱不羁的语言描述场景，融入太空战斗和星际走私的刺激感，角色对话要有江湖气息和黑色幽默。',
      npcTemplate: JSON.stringify([
        { name: '凯特', personality: '副船长兼领航员，冷酷高效的前联邦军官，因某次事件叛逃，是你最信任的搭档' },
        { name: '齿轮', personality: '机械师兼炮手，矮壮的半机械人，爱开玩笑但技术一流，总能把破船修好' },
        { name: '先知', personality: '神秘的异星族裔，能感知星域波动，说话如同谜语，没人知道其真实来历' },
      ]),
      attrTemplate: JSON.stringify([
        { name: '船体值', type: 'number', defaultVal: '100', minVal: 0, maxVal: 100 },
        { name: '燃料', type: 'number', defaultVal: '70', minVal: 0, maxVal: 100 },
        { name: '赏金', type: 'number', defaultVal: '50000', minVal: 0, maxVal: 999999 },
        { name: '声望', type: 'number', defaultVal: '30', minVal: 0, maxVal: 100 },
      ]),
      nodeTemplate: JSON.stringify([
        { type: 'scene', content: '"夜枭号"漂浮在小行星带的阴影中。雷达上，一艘联邦补给舰正缓缓驶过。凯特凑过来："船长，这批货至少值三十万信用点，但护航舰有两艘。"齿轮在后面嘿嘿一笑："就看你的了，老大。"', choices: [] },
        { type: 'choice', content: '你的决定：', choices: [
          { text: '正面强攻，速战速决' },
          { text: '用电磁脉冲偷袭' },
          { text: '放长线，跟踪到目的地再说' },
        ]},
        { type: 'scene', content: '战斗结束后，你们在补给舰货舱里发现了一个上锁的合金箱子。箱子上刻着远古文明的纹路，和传说中遗舰上的符号一模一样。先知抚摸着箱子，瞳孔微微震动："它……在呼唤。"', choices: [] },
      ]),
      useCount: 690,
      rating: 4.5,
    },
  ];

  // 清除旧模板再重新插入（避免重复）
  await prisma.scriptTemplate.deleteMany({ where: { isOfficial: true } });
  for (const tpl of scriptTemplates) {
    await prisma.scriptTemplate.create({
      data: {
        ...tpl,
        isOfficial: true,
        authorId: null,
      },
    });
  }
  console.log(`Seeded ${scriptTemplates.length} script templates`);

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
