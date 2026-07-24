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
    // ===== UU平台对标：主题模拟器模板 =====
    {
      name: '修仙模拟器：灵启',
      category: 'cultivation',
      description: '高自由度修仙模拟！自定义家世、灵根、属性、技能，踏上炼气至渡劫的九重境界。与NPC建立真实情感联结，体验有情道与无情道，探索秘境、渡劫飞升。',
      coverEmoji: '🕉️',
      worldSetting: '灵启大陆，一个以天地灵气为根基的修仙世界。灵气弥漫于山河之间，凡人中仅有天生具备灵根者才能踏上修行之路。天上仙界天帝统御万天，地下鬼界阎君掌生死簿，万魔殿魔尊镇压四方，万妖殿诸族分踞。五大人界宗门各据一方灵脉。剑修、体修、法修、丹修、器修、阵修、符修、魔修、魂修——三百六十行，行行可入道。你可以选择斩断尘缘的无情道，也能体验携手道侣的有情道；可以成为逍遥散修，也能加入宗门或世家。',
      stylePrompt: '你是一个修仙世界模拟器的叙述者。请用仙侠风格的语言描述场景，注重修仙境界的成长感、灵气运用的细节描写和修仙界的社交人情。支持高度自由的角色自定义，包括家世、灵根属性、性格特质等。重点在于日常社交、选择带来的连锁反应和一步步变强的真实成长过程。',
      npcTemplate: JSON.stringify([
        { name: '苏扶枝', personality: '东洲散修，性格洒脱不羁，实力深不可测，喜欢以酒会友，对有缘人倾囊相授' },
        { name: '赫连焰', personality: '镇北关守将，出身将门，性格刚毅正直，修习火系功法，对入侵者毫不留情但对百姓极其守护' },
        { name: '栖玄', personality: '仙界仙君，清冷出尘，修无情道千年，因某次下凡偶遇而心生波澜，外表淡漠内心纠结' },
        { name: '赤渊', personality: '万魔殿魔修，行事狠辣但重承诺，被正道追杀却有着自己的道义底线，亦正亦邪' },
        { name: '凤九炽', personality: '妖族少主，傲娇自负但重情义，化形为绝美少年，对强大者心生敬意，渴望证明妖族不弱于人' },
      ]),
      attrTemplate: JSON.stringify([
        { name: 'HP', type: 'number', defaultVal: '100', minVal: 0, maxVal: 9999 },
        { name: 'MP', type: 'number', defaultVal: '50', minVal: 0, maxVal: 9999 },
        { name: '灵力', type: 'number', defaultVal: '10', minVal: 0, maxVal: 999 },
        { name: '修为', type: 'number', defaultVal: '0', minVal: 0, maxVal: 99999 },
        { name: '灵根品质', type: 'number', defaultVal: '3', minVal: 1, maxVal: 9 },
        { name: '悟性', type: 'number', defaultVal: '50', minVal: 0, maxVal: 100 },
        { name: '善恶值', type: 'number', defaultVal: '0', minVal: -100, maxVal: 100 },
        { name: '声望', type: 'number', defaultVal: '0', minVal: -999, maxVal: 999 },
      ]),
      charConfig: JSON.stringify({
        origins: ['凡人', '散修', '宗门弟子', '世家天骄', '妖族血脉', '魔道传人'],
        spiritualRoots: ['金灵根', '木灵根', '水灵根', '火灵根', '土灵根', '冰灵根', '雷灵根', '风灵根', '变异灵根'],
        personalities: ['沉稳内敛', '活泼开朗', '冷酷无情', '温文尔雅', '狂放不羁', '心思缜密'],
        talents: ['过目不忘', '天生力壮', '灵觉敏锐', '丹道天赋', '阵法天赋', '剑道天赋', '体修天赋'],
        ambitions: ['飞升成仙', '守护苍生', '逍遥自在', '称霸三界', '追寻大道'],
        paths: ['无情道', '有情道', '剑修', '丹修', '体修', '法修', '魔修'],
      }),
      tags: JSON.stringify(['修仙', '高自由', '全性向', '养成', '自定义', '多结局']),
      useCount: 156379,
      rating: 4.9,
    },
    {
      name: '霍格沃茨模拟器（子世代）',
      category: 'fantasy',
      description: '收到霍格沃茨录取通知书，与哈利·波特同一年入学。沉浸式剧情体验、深度角色养成、情感羁绊系统、动态世界抉择。你的巫师生涯，你的爱恨抉择，你的传奇——现在开始。',
      coverEmoji: '⚡',
      worldSetting: '欢迎来到霍格沃茨。你将在J.K.罗琳创造的魔法世界中，体验完全属于自己的巫师人生。作为与哈利同届的新生，你将在九又四分之三站台、霍格沃茨特快、分院仪式中一步步踏入这个充满奇迹与危险的世界。从一年级开始，亲历巨怪事件、三头犬的秘密、穿越活板门的冒险……但你的选择将让这些原著事件走向未知的方向。每个学年都有全新的重大事件等待你参与甚至改变。',
      stylePrompt: '你是一个霍格沃茨魔法世界模拟器的叙述者。请用沉浸式的语言描述场景，注重魔法世界的细节和氛围。支持深度角色养成：随机生成的智力、魅力、体力与善恶值塑造初始命运。通过课程、事件提升魔咒、变形、黑魔法防御等六大魔法技能。与哈利、罗恩、赫敏、德拉科、塞德里克、卢娜等角色发展独特的友谊甚至更进一步。每位可攻略角色都有专属的好感度与剧情线。',
      npcTemplate: JSON.stringify([
        { name: '哈利·波特', personality: '救世主男孩，勇敢善良但有时冲动，有着强烈的正义感，天生的领导者，额头上有着闪电疤痕' },
        { name: '德拉科·马尔福', personality: '斯莱特林王子，高傲别扭但内心复杂，出身纯血家族，嘴上刻薄实则渴望被认可，对在意的人有着别扭的温柔' },
        { name: '赫敏·格兰杰', personality: '格兰芬多学霸，聪明勤奋且正义感爆棚，喜欢泡图书馆，说话有时过于直接但出发点总是好的' },
        { name: '塞德里克·迪戈里', personality: '赫奇帕奇级长，正直帅气且谦逊有礼，备受全校喜爱，有着超越年龄的成熟与担当' },
        { name: '卢娜·洛夫古德', personality: '拉文克劳怪女孩，空灵脱俗不在意他人目光，看似天马行空实则洞察力惊人，是个忠诚的朋友' },
      ]),
      attrTemplate: JSON.stringify([
        { name: 'HP', type: 'number', defaultVal: '100', minVal: 0, maxVal: 999 },
        { name: 'MP', type: 'number', defaultVal: '80', minVal: 0, maxVal: 999 },
        { name: '智力', type: 'number', defaultVal: '50', minVal: 0, maxVal: 100 },
        { name: '魅力', type: 'number', defaultVal: '40', minVal: 0, maxVal: 100 },
        { name: '体力', type: 'number', defaultVal: '45', minVal: 0, maxVal: 100 },
        { name: '善恶值', type: 'number', defaultVal: '0', minVal: -100, maxVal: 100 },
        { name: '魔咒学', type: 'number', defaultVal: '10', minVal: 0, maxVal: 100 },
        { name: '变形术', type: 'number', defaultVal: '10', minVal: 0, maxVal: 100 },
        { name: '黑魔法防御', type: 'number', defaultVal: '10', minVal: 0, maxVal: 100 },
        { name: '魔药学', type: 'number', defaultVal: '10', minVal: 0, maxVal: 100 },
        { name: '草药学', type: 'number', defaultVal: '10', minVal: 0, maxVal: 100 },
        { name: '天文學', type: 'number', defaultVal: '10', minVal: 0, maxVal: 100 },
      ]),
      charConfig: JSON.stringify({
        houses: ['格兰芬多', '斯莱特林', '拉文克劳', '赫奇帕奇'],
        bloodStatus: ['纯血', '混血', '麻瓜出身'],
        wands: ['凤凰羽木杖', '独角兽毛杖', '龙心弦杖', '蛇木杖'],
        personalities: ['勇敢无畏', '野心勃勃', '智慧好学', '忠诚善良', '机智狡黠'],
        talents: ['天生傲罗', '魔药天才', '变形高手', '黑魔法防御特长', '草药亲和'],
      }),
      tags: JSON.stringify(['哈利波特', '魔法', '养成', '恋爱', '多结局', '原著向']),
      useCount: 64172,
      rating: 4.9,
    },
    {
      name: '偶像养成模拟器',
      category: 'idol',
      description: '从默默无闻的练习生到万众瞩目的顶流偶像，训练、选秀、出道、恋爱……聚光灯下的每一步都是选择。',
      coverEmoji: '🎤',
      worldSetting: '星耀娱乐，国内顶尖的偶像经纪公司。每年数千名练习生在此接受严苛训练，只有最优秀的少数人能站上出道舞台。你怀揣着舞台梦想来到这里，但等待你的是残酷的淘汰赛制、复杂的人际关系和镁光灯背后的秘密。你能在竞争与友情中找到平衡，在梦想与现实中做出选择吗？',
      stylePrompt: '你是一个偶像养成模拟器的叙述者。请用充满娱乐圈氛围的语言描述场景，注重练习生日常训练细节、舞台表演的紧张感和粉丝互动。融入选秀淘汰、C位争夺、人设经营等元素。支持与同期练习生、导师、竞争对手发展关系，每个选择影响你的出道之路。',
      npcTemplate: JSON.stringify([
        { name: '顾言', personality: '同期练习生，冷酷的舞蹈天才，出身舞蹈世家，看似高冷实则在关键时刻会默默帮助他人' },
        { name: '苏念', personality: '人气最高的练习生，甜美可人但内心强势，有着完美偶像人设但私下压力巨大' },
        { name: '陆远', personality: '星耀娱乐的王牌制作人，严厉挑剔但眼光独到，曾经也是偶像出身，对有潜力的练习生格外严格' },
        { name: '林夏', personality: '你的室友兼好友，性格开朗大大咧咧，唱功出众但舞蹈是短板，是你在练习生生涯中最温暖的存在' },
      ]),
      attrTemplate: JSON.stringify([
        { name: 'HP', type: 'number', defaultVal: '100', minVal: 0, maxVal: 100 },
        { name: '体力', type: 'number', defaultVal: '80', minVal: 0, maxVal: 100 },
        { name: '唱功', type: 'number', defaultVal: '40', minVal: 0, maxVal: 100 },
        { name: '舞蹈', type: 'number', defaultVal: '35', minVal: 0, maxVal: 100 },
        { name: '颜值', type: 'number', defaultVal: '60', minVal: 0, maxVal: 100 },
        { name: '综艺感', type: 'number', defaultVal: '30', minVal: 0, maxVal: 100 },
        { name: '人气', type: 'number', defaultVal: '10', minVal: 0, maxVal: 999 },
        { name: '压力值', type: 'number', defaultVal: '20', minVal: 0, maxVal: 100 },
      ]),
      charConfig: JSON.stringify({
        positions: ['主唱', '主舞', '门面', '队长', '全能ACE', 'rapper'],
        personalities: ['元气满满', '高冷范', '温柔系', '搞笑担当', '神秘酷盖'],
        backgrounds: ['科班出身', '街舞达人', '网络红人', '星二代', '素人逆袭'],
      }),
      tags: JSON.stringify(['偶像', '养成', '选秀', '全性向', '现代都市']),
      useCount: 32089,
      rating: 4.7,
    },
    {
      name: 'ABO万人迷模拟器',
      category: 'abo',
      description: '兽耳+信息素+全性向+万人迷，所有人物皆可攻略。星阑国际贵族学园，踏入即成为全校无法忽视的存在。',
      coverEmoji: '🌸',
      worldSetting: '星阑国际贵族学园，国内顶尖、门槛极致严苛的半山私立精英学府，只收纳家世显赫、血统优异、第二性别已完成分化的贵族子弟。学院内分化为Alpha、Beta、Omega、Enigma四大性别。强势凛冽的Alpha自带压迫性气场与锐利兽耳；温和通透的Beta不受信息素牵制；稀少矜贵的Omega萦绕着独属香气；神秘超脱的Enigma凌驾所有性别规则。兽耳随情绪微动，信息素在空气里无声流淌。',
      stylePrompt: '你是一个ABO世界万人迷模拟器的叙述者。请用细腻感官化的语言描述场景，注重信息素、兽耳情绪反应等ABO特有元素的描写。不经意的回眸、擦肩而过的气息、逆光下的身影，都能让全校不由自主心动沉沦。支持全性向攻略，与不同性别角色发展独特关系。',
      npcTemplate: JSON.stringify([
        { name: '萧寒', personality: '顶级Alpha，学生会会长，冰冷禁欲系，信息素是凛冽松木香，对所有Omega都无动于衷却唯独对你产生异常反应' },
        { name: '温屿', personality: '温柔Beta，图书馆常客，不受信息素影响但自带独特气质，是全校公认的治愈系存在，对你有着特殊的关注' },
        { name: '阮软', personality: '稀有Omega，看似柔弱实则内心强大，信息素是甜蜜奶香，因你的出现而第一次对非Alpha产生强烈好奇' },
        { name: '玄夜', personality: '神秘Enigma，转学生，万变幻耳与混沌息韵，凌驾所有性别规则的存在，似乎对你的一切了如指掌' },
      ]),
      attrTemplate: JSON.stringify([
        { name: 'HP', type: 'number', defaultVal: '100', minVal: 0, maxVal: 999 },
        { name: '魅力', type: 'number', defaultVal: '80', minVal: 0, maxVal: 100 },
        { name: '信息素浓度', type: 'number', defaultVal: '50', minVal: 0, maxVal: 100 },
        { name: '精神力', type: 'number', defaultVal: '60', minVal: 0, maxVal: 100 },
        { name: '吸引力', type: 'number', defaultVal: '70', minVal: 0, maxVal: 100 },
      ]),
      charConfig: JSON.stringify({
        genders: ['Alpha', 'Beta', 'Omega', 'Enigma'],
        earTypes: ['狼耳', '猫耳', '狐耳', '兔耳', '龙角', '幻耳'],
        pheromones: ['松木香', '奶香', '花香', '海风', '焦糖', '冰雪'],
        backgrounds: ['财阀继承人', '学术世家', '军政子弟', '艺术名门', '神秘身世'],
      }),
      tags: JSON.stringify(['ABO', '兽耳', '万人迷', '全性向', '校园', '高自由']),
      useCount: 19089,
      rating: 4.8,
    },
    {
      name: '无限流主播模拟器',
      category: 'infinite',
      description: '全性向+高自由+内置直播小助手APP。你被投入恐怖副本当主播，在鬼怪追杀中解谜求生，观众打赏决定你的生死。',
      coverEmoji: '🎬',
      worldSetting: '"剧场"——一个吞人的高维空间，把倒霉蛋丢进恐怖副本当主播。每个副本都像一部恐怖片：古宅、鬼校、杀人魔的派对、飘满规则纸条的异世界。你必须在鬼怪追杀的间隙解谜、找钥匙、撑过倒计时，才能活着回到现实。你的一举一动都被直播给一群"观众"——他们不是人，可能是旧神、外星人、或某种泡在网线里的怪物。他们看着你尖叫、爆粗、满地打滚，然后打赏积分。积分能买道具、技能、甚至延长寿命——但也能让你死得更快，因为观众爱看翻车。',
      stylePrompt: '你是一个无限流恐怖直播模拟器的叙述者。请用紧张刺激的语言描述场景，注重恐怖副本的解谜元素和直播弹幕的互动感。融入直播间观众打赏、弹幕吐槽等元素。每个副本都有独立的世界观和规则，玩家需要在恐惧中保持理智，在绝望中寻找生机。支持与"老玩家"建立信任或背叛关系。',
      npcTemplate: JSON.stringify([
        { name: '沈倦', personality: '沉默的冷面大佬，老玩家中的传奇，总在关键时刻扔给你一根救命稻草，但没人知道他的真实目的' },
        { name: '季安宁', personality: '话痨的社牛小姐姐，教你在弹幕里卖惨骗打赏的高手，看似大大咧咧实则心思缜密' },
        { name: '言默', personality: '神秘的新玩家，与你同期进入剧场，存在感极低但每次都活到最后，似乎知道剧场的秘密' },
      ]),
      attrTemplate: JSON.stringify([
        { name: 'HP', type: 'number', defaultVal: '100', minVal: 0, maxVal: 100 },
        { name: '理智值', type: 'number', defaultVal: '100', minVal: 0, maxVal: 100 },
        { name: '积分', type: 'number', defaultVal: '100', minVal: 0, maxVal: 99999 },
        { name: '观众数', type: 'number', defaultVal: '1000', minVal: 0, maxVal: 999999 },
        { name: '人气值', type: 'number', defaultVal: '50', minVal: 0, maxVal: 100 },
        { name: '恐惧值', type: 'number', defaultVal: '0', minVal: 0, maxVal: 100 },
      ]),
      charConfig: JSON.stringify({
        talents: ['过人直觉', '机械亲和', '语言破译', '隐匿潜行', '精神抗性', '幸运光环'],
        personalities: ['冷静分析', '莽夫流', '苟王之王', '社交达人', '疯批美人'],
      }),
      tags: JSON.stringify(['无限流', '恐怖', '直播', '全性向', '高自由', '内置APP']),
      useCount: 17938,
      rating: 4.6,
    },
    {
      name: '古代模拟人生',
      category: 'wuxia',
      description: '高自由+全性向+男女平等+设定全加。嫡庶六选、九档家世、六个年龄节点、文武双线科举、蝴蝶效应真连锁。想考状元考状元，想当土匪当土匪。',
      coverEmoji: '🏯',
      worldSetting: '上京城的初雪落下来的时候，没有人知道，那个刚刚降生的婴孩，日后会在这繁华世间掀起怎样的波澜。这里没有男尊女卑的枷锁，女子亦可着绯穿紫、封侯拜相，甚至招纳夫侍；男子同样能在柴米油盐或朝堂诡谲中寻得归处。只是，嫡庶之分犹如一道无形的鸿沟，横亘在每个人的命运之前。从牙牙学语到鲜衣怒马，你的每一次抉择都在暗中拨动因果的齿轮。',
      stylePrompt: '你是一个古代模拟人生模拟器的叙述者。请用古典细腻的语言描述场景，注重古代社会的礼制、嫡庶、家世等阶层差异的描写。支持极高自由度：嫡庶六选、九档家世从王府到窝棚、六个年龄节点随时切入、文武双线科举。蝴蝶效应真连锁，一个选择二十年后杀回来。性格、天赋、特质、志向、家庭氛围全自选。',
      npcTemplate: JSON.stringify([
        { name: '沈昭', personality: '当朝状元郎，温润如玉的世家公子，才华横溢但身负家族重担，对有才学之人格外欣赏' },
        { name: '赵婉宁', personality: '长公主，权倾朝野的女政治家，手段强硬但心系天下，对有志向的女子格外提携' },
        { name: '陆小凤', personality: '江湖游侠，不拘小节的浪子，武功高强却不愿入仕，是你闯荡江湖时的可靠伙伴' },
      ]),
      attrTemplate: JSON.stringify([
        { name: 'HP', type: 'number', defaultVal: '100', minVal: 0, maxVal: 999 },
        { name: '才学', type: 'number', defaultVal: '20', minVal: 0, maxVal: 100 },
        { name: '武力', type: 'number', defaultVal: '15', minVal: 0, maxVal: 100 },
        { name: '容貌', type: 'number', defaultVal: '50', minVal: 0, maxVal: 100 },
        { name: '家世', type: 'number', defaultVal: '50', minVal: 0, maxVal: 100 },
        { name: '声望', type: 'number', defaultVal: '10', minVal: 0, maxVal: 999 },
        { name: '财富', type: 'number', defaultVal: '100', minVal: 0, maxVal: 99999 },
        { name: '善恶值', type: 'number', defaultVal: '0', minVal: -100, maxVal: 100 },
      ]),
      charConfig: JSON.stringify({
        legitimacy: ['嫡出', '庶出', '旁支', '养子', '外室', '不明'],
        families: ['王府', '国公府', '侯府', '官宦', '商贾', '庶民', '佃户', '乞丐', '窝棚'],
        ages: ['出生', '幼年', '少年', '青年', '中年', '老年'],
        paths: ['文科科举', '武科科举', '经商', '从军', '出家', '务农', '躺平'],
        personalities: ['沉稳', '活泼', '阴沉', '开朗', '内敛', '狂放'],
        talents: ['过目不忘', '天生神力', '过人容貌', '经商头脑', '武学奇才'],
      }),
      tags: JSON.stringify(['古风', '高自由', '全性向', '养成', '蝴蝶效应', '多结局']),
      useCount: 3203,
      rating: 4.8,
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
