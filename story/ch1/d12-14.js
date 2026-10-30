import { che, man, zhou, nico, cat, me, t, note, bg, show, choice, opt, when } from '../lines.js';

// Who you have grown closest to, for the ending. Ties go to the earlier name.
const CLOSEST = ['ache', 'xiaoman', 'laozhou', 'nico'];
export function closest(state) {
  return CLOSEST.reduce((best, id) => ((state.aff[id] ?? 0) > (state.aff[best] ?? 0) ? id : best), CLOSEST[0]);
}

export default [
  // ───────────────────────── 第十二天 ─────────────────────────
  {
    id: 'd12-morning', day: 12, slot: 'dawn', title: '一整面冰箱',
    bg: 'kitchen', time: 'dawn',
    steps: [
      t('早上你走进厨房，愣住了。'),
      t('冰箱门上，原来那些小满画的小人都被挪到了侧面。正中间贴着一排便利贴，一张接一张，从冰箱门顶一直贴到把手。'),
      note('ache', '我想了一个星期，决定了。\n下个月开始，我去社区医院。白天上班。\n不是因为急诊不好。是因为我想晚上能在家，和你们一起吃饭。'),
      note('ache', '我第一次搬来四楼，是因为这里的灯是暖的。\n现在我知道了，灯是暖的，是因为有人在。'),
      note('ache', '小满我会自己告诉她。她肯定会哭。\n老周会说「好」。Nico 会问社区是什么意思。\n你是第一个知道的。'),
      when({ mem: 'replyToAche' }, [
        note('ache', '你写给我的每一张，我都留着。'),
      ]),
      t('你站在冰箱前面，看了很久。然后你去找了一沓新的便利贴。'),
      choice(
        opt('写：「恭喜你。以后晚饭，我做。」', [], { aff: { ache: 3 }, mem: { finalNote: '以后晚饭，我做' } }),
        opt('写：「白天见。」', [], { aff: { ache: 3 }, mem: { finalNote: '白天见' } }),
        opt('写了很长很长，贴了五张', [
          t('你写了你来四楼以后的每一天。写到最后，你自己都笑了：原来你也是会写这么多字的人。')
        ], { aff: { ache: 4 }, mem: { finalNote: '五张便利贴' } })
      ),
      t('那天下午，你听见小满在阿澈的房间里大哭，然后大笑，然后又哭了。')
    ]
  },
  {
    id: 'd12-evening', day: 12, slot: 'dusk', title: '门开了一条缝',
    bg: 'living', time: 'dusk',
    steps: [
      show('xiaoman'),
      man('{name}！闭上眼睛！不许偷看！'),
      t('她拉着你走到客厅中间，然后掀开了一块布。'),
      man('smile', '……好了。可以看了。'),
      t('那幅长长的走廊，尽头不再是空白了。'),
      when({ flag: 'door_fourth_floor' },
        [t('尽头是一扇门，开着一条缝。门缝里是四楼的客厅：旧沙发、折叠饭桌、墙上的住户表，还有一只胖了的猫。')],
        [t('尽头是一扇门，开着一条缝。门缝里有一道很暖的光，照在走廊的地板上。')]
      ),
      man('我没有画开。开一条缝，就够了。'),
      man('我昨天去了那个旧房子。在门口站了半个小时。没进去。'),
      man('smile', '但是我发现，我不用进去了。我已经有地方回了。'),
      choice(
        opt('「这是你画得最好的一幅。」', [
          man('smile', '我知道！哈哈哈我知道！'),
          man('……不过你说出来，我更知道了。')
        ], { aff: { xiaoman: 2 } }),
        opt('「门后面的那只猫，是房东吧？」', [
          man('smile', '当然！它是这幅画的模特，我付了三根猫条。'),
          t('房东从沙发上抬起头，好像知道在说它。')
        ], { if: { flag: 'door_fourth_floor' }, aff: { xiaoman: 2, cat: 1 } }),
        opt('什么也不说，抱了她一下', [
          man('surprised', '……'),
          man('smile', '……颜料会蹭到你衣服上的。算了，蹭吧。')
        ], { aff: { xiaoman: 3 } })
      ),
      when({ flag: 'have_ticket' }, [
        man('毕业展下个月十五号。你……要来吗？不来也没关系。'),
        t('你从口袋里掏出 Nico 给你的票。她愣住了，然后脸一下子红了。'),
        man('surprised', 'Nico！！！你给我出来！！！')
      ])
    ]
  },

  // ───────────────────────── 第十三天 ─────────────────────────
  {
    id: 'd13-dinner', day: 13, slot: 'night', title: '又是周六',
    bg: 'living', time: 'night',
    steps: [
      t('又是周六。饭桌拉开，砂锅摆在中间。桌上还是六副碗筷。'),
      show('laozhou', 'ache', 'xiaoman', 'nico'),
      man('smile', '今天要庆祝！阿澈姐换工作！我的画画完了！Nico 的蛋挞……'),
      nico('第七次！这次没有焦！'),
      man('……Nico 的蛋挞没有焦！'),
      t('吃到一半，老周的手机响了。是那个国外的号码。'),
      t('桌上一下子安静了。'),
      when({ any: [{ flag: 'letter_sent' }, { flag: 'will_answer' }] },
        [
          zhou('……'),
          t('老周看了你一眼。你点了点头。'),
          t('他站起来，走到窗边，接了。'),
          zhou('……喂。'),
          zhou('……嗯。是我。'),
          zhou('sad', '……收到了？'),
          t('他背对着大家，说话的声音很低。你们谁都没有动筷子，也没有人假装在说话。'),
          t('过了很久，他转过身来，眼睛是红的，脸上在笑。'),
          zhou('smile', '……她说，明年春节，带外孙回来。'),
          man('surprised', '外孙？！周叔你有外孙？！'),
          zhou('smile', '我也是刚知道。'),
          t('那天晚上，那副多出来的碗筷，第一次被用了。老周往里面盛了一碗汤，说先替她喝着。')
        ],
        [
          zhou('……'),
          t('电话响了很久，老周一直看着它。'),
          che('周叔。接吧。'),
          t('他接了。只说了一句「喂」，就走到楼道里去了。'),
          t('他回来的时候，什么也没说，只是给每个人都多夹了一块肉。'),
          zhou('smile', '……吃饭，吃饭。'),
          t('你看见他的手在抖。不过是好的那种抖。')
        ]
      ),
      t('饭后，大家没有散。Nico 把他的小本子拿出来，翻到最后一页。'),
      nico('我想好了。'),
      nico('smile', '我要留下来，读硕士。'),
      nico('我妈妈说，留下来也好。她说，saudade 不是坏东西，是心里有两个家的证明。'),
      man('surprised', '……所以你还要在这里烤四年蛋挞？！'),
      nico('smile', '至少四年。'),
      t('小满骂了他一句，然后偷偷抹了一下眼睛。')
    ]
  },

  // ───────────────────────── 第十四天 ─────────────────────────
  {
    id: 'd14-rooftop', day: 14, slot: 'dusk', title: '天台上的落日',
    bg: 'rooftop', time: 'dusk',
    steps: [
      t('第十四天的傍晚，小满把大家都叫上了天台。'),
      t('她搬了画架，说要画一幅新的住户表，这次要照着真人画。'),
      show('ache', 'xiaoman', 'nico', 'laozhou'),
      man('smile', '都站好！阿澈姐你笑一下！周叔你别躲！Nico 你别比耶！'),
      nico('比耶是国际通用的！'),
      man('{name}，你站中间。'),
      me('为什么是我？'),
      man('smile', '因为住户表上，你那一格一直是空的。今天要补上。'),
      when({ memIs: ['nickname', '问号'] }, [
        man('……那个外号，你还是不打算告诉我吗？'),
        choice(
          opt('告诉她', [
            t('你小声说了。她笑得蹲在地上起不来。'),
            man('smile', '……好！以后就叫你这个！'),
          ], { aff: { xiaoman: 2 }, mem: { nickname: '只有小满知道的外号' } }),
          opt('「等第二章再说。」', [man('……你学坏了。')])
        )
      ]),
      t('太阳慢慢落进那座总在修的桥后面。桥上的灯一盏一盏亮起来。'),
      t('小满画得很快。画完的时候，天已经快黑了。'),
      t('画上，五个人和一只猫挤在天台上。每个人都在笑，除了猫。'),
      t('你那一格，终于有了一张脸。')
    ]
  },
  {
    id: 'd14-night', day: 14, slot: 'night', title: '四楼的灯',
    bg: 'stairs', time: 'night',
    steps: [
      t('大家陆续下楼了。楼道里，三楼那盏声控灯，今天亮了。'),
      t('不知道是谁修好的。没有人承认。'),
      // The ending scene belongs to whoever you grew closest to.
      when(st => closest(st) === 'ache', [
        show('ache'),
        che('……我修的。下夜班的时候，顺手。'),
        che('smile', '以后你晚上回来，不会再摸黑了。'),
        che('明天见，{name}。'),
        t('她说「明天见」的时候，好像这是一件很确定的事。')
      ]),
      when(st => closest(st) === 'xiaoman', [
        show('xiaoman'),
        man('smile', '是我修的！我爬上去换的灯泡！差点摔死！'),
        man('……因为你每次回来，在三楼都会放慢脚步。我听得出来。'),
        man('smile', '明天见！明天也要见！后天也要！')
      ]),
      when(st => closest(st) === 'laozhou', [
        show('laozhou'),
        zhou('smile', '人老了，睡不着，就找点事做。'),
        zhou('这栋楼我住了三十年，那盏灯坏了五年。是你来了以后，我才想起来修。'),
        zhou('smile', '小家伙，晚安。明天来店里，我泡新茶。')
      ]),
      when(st => closest(st) === 'nico', [
        show('nico'),
        nico('smile', '是我！我查了视频，学了中文的「灯泡」「螺口」「断电」。'),
        nico('今天的新词是「亮了」。'),
        nico('smile', '晚安，{name}。……这个词是你第一个教我的。')
      ]),
      bg('myroom', 'night'), show(),
      t('你回到房间。门背后，那张第一天的便利贴还在，已经有点卷边了。'),
      note('ache', '欢迎。热水器要等三分钟才热。毛巾在柜子第二层，新的。'),
      t('旁边，不知道什么时候，多了四张新的。'),
      note('xiaoman', '四楼住户表已更新！你那一格不许再空着！'),
      note('laozhou', '周六的饭，记得来。'),
      note('nico', '今天的词：家。'),
      cat('喵。'),
      t('房东从门缝里挤进来，在你脚边转了两圈，睡了。'),
      t('窗外，四楼的灯，一盏一盏地暗下去。只有走廊那一盏，一直亮着。'),
      t('第一章 · 四楼的灯 · 完'),
      t('明天，他们还在。')
    ]
  }
];
