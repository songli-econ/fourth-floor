// Between story scenes, the apartment is still lived in. Who is home depends on the real
// time of day; tapping someone gives a short exchange. Lines can depend on memory and flags.
// Each line: { text, face?, if? } ; text may be a function of state.

export const PRESENCE = {
  // part of day → who you can find, and where
  dawn:  { room: 'kitchen', who: ['ache', 'cat'] },
  day:   { room: 'bookshop', who: ['laozhou', 'cat'] },
  dusk:  { room: 'living', who: ['xiaoman', 'nico', 'cat'] },
  night: { room: 'rooftop', who: ['nico', 'xiaoman'] }
};

// 阿澈 is on night shift; on a rest night she can be found in the living room.
export function presentNow(part, state) {
  const p = { ...PRESENCE[part], who: [...PRESENCE[part].who] };
  if (part === 'night' && state.flags.ache_why_here) p.who.push('ache');
  return p;
}

export const IDLE = {
  ache: [
    { text: '……刚回来。今天还好。', face: 'normal' },
    { text: '冰箱里有豆浆。别全喝了，留一口给我。', face: 'smile' },
    { text: st => (st.mem.cilantro === 'no' ? '楼下新开的米线店，可以说「不要香菜」。我试过了。' : '楼下新开的米线店，香菜是自助的。你会喜欢。'), face: 'smile' },
    { text: '房东今天早上咬了我的绿萝。第三次了。', face: 'sad' },
    { text: '你今天看起来有点累。早点睡。', face: 'normal' },
    { text: '……嗯。就是想坐一会儿。你不用说话。', face: 'normal' },
    { text: st => (st.mem.replyToAche ? `你那天写的「${st.mem.replyToAche}」，我贴在储物柜里了。` : '便利贴是我们医院护士站的。多拿了一沓。'), face: 'smile', if: { seen: 'd2-morning' } },
    { text: '下雨的时候，急诊会安静一点。很奇怪吧。', face: 'normal' }
  ],
  xiaoman: [
    { text: '{name}！你看你看，这个颜色是不是很像傍晚的天台？', face: 'smile' },
    { text: '完蛋了，我又把颜料挤多了。你要不要来画两笔？', face: 'surprised' },
    { text: st => `你在住户表上叫「${st.mem.nickname || '新邻居'}」，这件事已经定了，不接受上诉。`, face: 'smile', if: { mem: 'nickname' } },
    { text: '……不想谈毕业展。谈点别的。比如你今天吃了什么？', face: 'sad' },
    { text: 'Nico 今天把「加油」说成了「加醋」，我笑了一整节课。', face: 'smile' },
    { text: '诶，你觉得一扇门，画成开着的好，还是关着的好？……随便问问。', face: 'normal', if: { seen: 'd2-night' } },
    { text: '橘子汽水是世界上最好的饮料。不接受反驳。', face: 'smile' },
    { text: '阿澈姐今天对我笑了一下。我要记在日历上。', face: 'smile' }
  ],
  laozhou: [
    { text: '小家伙，来了？坐，茶刚泡。', face: 'smile' },
    { text: st => (st.mem.book ? `那本${st.mem.book}，看到哪儿了？不急，慢慢看。` : '书架第三层新到了一批旧书，去看看。'), face: 'normal' },
    { text: '房东刚吃过了。别听它叫，它骗人。', face: 'smile' },
    { text: '人到我这个年纪，最喜欢的声音就是楼上有人走来走去。', face: 'normal' },
    { text: '周六记得上来吃饭。不来我就把你的那份给猫。', face: 'smile' },
    { text: '书里都写着呢。可是有些事，书里也写不全。', face: 'sad' },
    { text: '天冷了，多穿一件。你们年轻人总是不听。', face: 'normal' }
  ],
  nico: [
    { text: '{name}！今天我学了一个新词：「凑合」。是很中国的词。', face: 'smile' },
    { text: st => (st.mem.nicoWord ? `你教我的「${st.mem.nicoWord}」，我今天用了两次！` : '你今天能教我一个词吗？什么都可以。'), face: 'smile' },
    { text: '那座桥修了三年了。我觉得我离开的时候它也修不完。', face: 'normal' },
    { text: '我妈妈问我，这里的人好不好。我说，四楼的人很好。', face: 'smile' },
    { text: '……今天是周日吗？我不喜欢周日下午。', face: 'sad' },
    { text: '小满说我的蛋挞是「黑暗料理」。黑暗料理是什么意思？是夸我吗？', face: 'surprised' },
    { text: '天台的风今天很温柔。中文可以说风温柔吗？', face: 'normal' }
  ],
  cat: [
    { text: '喵。', face: 'normal' },
    { text: '房东看了你一眼，翻了个身，露出肚子。这不是邀请。', face: 'smile' },
    { text: '它蹭了蹭你的裤腿，然后走向了冰箱。', face: 'normal' },
    { text: '房东正在洗脸。请勿打扰。', face: 'normal' },
    { text: '它发出一声很长的、不满的「喵……」，好像在说今天的减肥委员会不公平。', face: 'sad', if: { seen: 'd2-night' } }
  ]
};

// Shown on the hub when you come back after some days away.
export function welcomeBack(days, state) {
  if (days <= 0) return null;
  if (days === 1) return null;
  if (days < 4) return { who: 'xiaoman', face: 'smile', text: `{name}！你这两天去哪儿了？冰箱上有阿澈姐给你的字条，我没偷看。……就看了一点点。` };
  if (days < 10) return { who: 'laozhou', face: 'smile', text: '回来就好。你不在的这几天，房东每天晚上在你门口坐一会儿。我们都看见了。' };
  const extra = state.mem.item === '一盆多肉' ? '你的多肉我帮你浇了。不多，一周一次。' : '前几天下雨，你房间的窗户我帮你关了。';
  return { who: 'ache', face: 'smile', text: `……你回来啦。${extra}` };
}
