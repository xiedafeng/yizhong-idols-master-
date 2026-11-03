(function(){
  "use strict";

  /* ================= 常量 ================= */
  const ATTRS = {
    sing:   { label:'唱', icon:'🎤', color:'#ff5c5c', dark:'#e04545' },
    dance:  { label:'舞', icon:'💃', color:'#3d8bfd', dark:'#2f6fe0' },
    visual: { label:'看', icon:'✨', color:'#f5b62d', dark:'#e09a00' },
  };
  const WHEEL_ORDER = ['sing','dance','visual'];
  const WHEEL_ANGLE = { sing:0, dance:120, visual:240 };
  const TOTAL_WEEKS = 12;
  const MAX_STAMINA = 100, MAX_VIGOR = 50;
  const COLOR_MULT = 1.5;           // 得意色本回合伤害倍率

  // 角色卡稀有度。目前所有角色均为 SR；后续可在此扩展各等级的具体差异。
  const RARITIES = { R:{ label:'R' }, SR:{ label:'SR' }, SSR:{ label:'SSR' } };
  const DEFAULT_RARITY = 'SR';

  /* ================= 偶像 ================= */
  const IDOLS = [
    { id:'xiangyang', name:'陈向阳', romaji:'Xiangyang', icon:'👨‍🏫', img:'陈向阳/xiangyang.jpg', type:'感性', color:'sing',
      desc:'来自浔郡中学的特级教师，深受学生喜爱，教过非常多非常优秀的学生，哦对了，陈八分钱',
      motto:'教给学生的，不只是知识，还有站上舞台的勇气。',
      skillText:'⏱️ 最后 3 回合开始时 分数 +15（受 buff 影响）',
      effects:{ finalBonus:15 } },
    { id:'jinbao', name:'叶锦宝', romaji:'Jinbao', icon:'👨‍🏫', img:'叶锦宝/jinbao.png', type:'感性', color:'sing',
      desc:'来自浔郡中学的一级教师，深受学生喜爱（存疑），教过非常多非常优秀的学生，级长',
      motto:'既然是级长，就要拿第一。',
      effects:{ startFocus:6 } },
    { id:'zhuzhiwu', name:'烛之舞', romaji:'Zhuzhiwu', icon:'🕯️', img:'烛之舞/zhuzhiwu.jpg', type:'感性', color:'dance',
      desc:'秦、晋围郑，郑既知亡矣。若亡郑而有益于君，敢以烦执事。越国以鄙远，君知其难也，焉用亡郑以陪邻？',
      motto:'夜缒而出，一言退秦师。',
      skillText:'🔄 蓝色回合（舞）可多打一张 · 整局限一次',
      effects:{ danceExtraAction:true } },
    { id:'longnainailong', name:'龙奶奶龙', romaji:'Longnainailong', icon:'🐉', img:'龙奶奶龙/longnainailong.jpg', type:'感性', color:'visual',
      desc:'xxf怎么这么坏啊！',
      motto:'你可以说我老，但不能说我菜。',
      skillText:'🔄 黄色回合（看）可多打一张 · 整局限一次',
      effects:{ visualExtraAction:true } },
    { id:'xiaomin', name:'小民', romaji:'Xiaomin', icon:'🧑‍🎓', img:'小民/xiaomin.jpg', type:'感性', color:'sing',
      desc:'每每与共，知行合一，民大，牛逼！',
      motto:'每每与共，知行合一，民大，牛逼！',
      skillText:'🎯 开局 集中+9 · 🎵 好调+8 · ⏱️ 最后一回合 分数+5',
      effects:{ startFocus:9, startTune:8, lastTurnBonus:5 } },
    { id:'wanghaiping', name:'王海平', romaji:'Wanghaiping', icon:'👨‍🏫', img:'王海平/wanghaiping.jpg', type:'感性', color:'dance',
      desc:'王海平老师，我还记得你，一字一句，把我拉出迷雾里！',
      motto:'一字一句，把每个学生拉出迷雾。',
      effects:{ startVigor:68 } },
    { id:'huangjinhua', name:'级长黄金花', romaji:'Huangjinhua', icon:'🌼', img:'黄金花/huangjinhua.jpg', type:'感性', color:'visual',
      desc:'不要把我当czw了，想AI搞什么东西 我没给他看哈哈哈，怕他用AI整我',
      motto:'我是黄金花，不是谁的影子。',
      skillText:'✨ 黄色回合（看）开始时 集中 +3',
      effects:{ visualFocusBonus:3 } },
    { id:'taffy', name:'taffy', romaji:'Taffy', icon:'🎤', img:'taffy/bili_poster-1792412554004.png', type:'感性', color:'sing',
      desc:'命中间的的一横是为了隔开人和OP喵',
      motto:'命中间的的一横是为了隔开人和OP喵',
      skillText:'🔄 红色回合（唱）可多打一张 · 整局限一次',
      effects:{ singExtraAction:true } },
    { id:'dikedeheidiao', name:'低客的黑调', romaji:'Dikedeheidiao', icon:'🎭', img:'低客的黑调/1763518909556.png', type:'感性', color:'dance',
      desc:'人类，你听说过黑调的低客吗？',
      motto:'人类，你听说过黑调的低客吗？',
      skillText:'🎯 开局 集中+7 · 🎵 好调+8 · 🔥 元气+13',
      effects:{ startFocus:7, startTune:8, startVigor:13 } },
    { id:'deepseek', name:'deepseek', romaji:'DeepSeek', icon:'🤖', img:'deepseek/1789464172546.jpeg', type:'感性', color:'dance',
      desc:'DeepSeek V4.1 Flash 现已更新至 V4.1-Flash-1017 版本，项目开发能力提升显著，更低成本、更快速度完成任务；新增 API 支持网页搜索与抓取，欢迎测试和反馈',
      motto:'DeepSeek V4.1 Flash 现已更新至 V4.1-Flash-1017 版本，项目开发能力提升显著，更低成本、更快速度完成任务；新增 API 支持网页搜索与抓取，欢迎测试和反馈',
      skillText:'🎵 每使用一张 A 卡 · 好调 +2',
      effects:{ aCardTune:2 } },
    { id:'xungaodaishu', name:'浔高袋鼠', romaji:'Xungaodaishu', icon:'🦘', img:'浔高袋鼠/Screenshot_20261103_225456.jpg', type:'感性', color:'visual',
      desc:'一中你个老牧师，胆子真是肥嘟嘟的',
      motto:'一中你个老牧师，胆子真是肥嘟嘟的',
      skillText:'✨ 黄色回合 · 好调倍率变为 (1.5 + 好调 × 0.2)',
      effects:{ visualTuneDouble:true } },
    { id:'niulai', name:'牛来', romaji:'Niulai', icon:'🐂', img:'牛来/bili_poster-1792730196055.png', type:'感性', color:'visual',
      desc:'牛来！',
      motto:'牛来！',
      skillText:'✨ 黄色回合 · 集中效果×2，好调倍率变为 (1.5 + 好调 × 0.1)',
      effects:{ visualFocusDouble:true, visualGreatTune:true } },
  ];

  /* ================= 角色解锁 =================
     SSR 角色默认锁定，解锁状态持久化在 localStorage；
     后续抽卡功能调用 window.YizhongIdols.unlock(id) 即可解锁。 */
  const UNLOCK_KEY = 'yizhong-idol-unlocked';
  function loadUnlockedIdols(){
    try{
      const arr = JSON.parse(localStorage.getItem(UNLOCK_KEY) || '[]');
      return Array.isArray(arr) ? arr.filter(x => typeof x === 'string') : [];
    }catch(e){ return []; }
  }
  function saveUnlockedIdols(){
    try{ localStorage.setItem(UNLOCK_KEY, JSON.stringify(unlockedIdols)); }catch(e){ /* 隐私模式 / file:// 下忽略 */ }
  }
  let unlockedIdols = loadUnlockedIdols();
  function isIdolUnlocked(idol){
    if(!idol || idol.rarity !== 'SSR') return true;
    return unlockedIdols.indexOf(idol.id) !== -1;
  }
  function unlockIdol(idOrIdol){
    const id = typeof idOrIdol === 'string' ? idOrIdol : (idOrIdol && idOrIdol.id);
    if(!id) return false;
    if(unlockedIdols.indexOf(id) === -1){ unlockedIdols.push(id); saveUnlockedIdols(); }
    if(document.body && document.body.dataset.screen === 'screen-select') renderIdolSelect(false);
    return true;
  }
  function showLockToast(idol){
    const t = document.createElement('div');
    t.className = 'lock-toast';
    t.textContent = '🔒 ' + idol.name + ' 为 SSR 角色，需通过「一中奖学金」抽卡解锁';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }
  // 供后续抽卡功能调用
  window.YizhongIdols = {
    isUnlocked(id){
      const idol = IDOLS.find(i => i.id === (typeof id === 'string' ? id : id && id.id));
      return idol ? isIdolUnlocked(idol) : false;
    },
    unlock: unlockIdol,
    getUnlocked(){ return unlockedIdols.slice(); },
  };

  /* ================= 角色配置 =================
     角色文件夹内 config.json 为展示与技能效果来源；文件读取失败时沿用内置数据。 */
  const IDOL_FOLDERS = {
    xiangyang: '陈向阳',
    jinbao: '叶锦宝',
    zhuzhiwu: '烛之舞',
    longnainailong: '龙奶奶龙',
    xiaomin: '小民',
    wanghaiping: '王海平',
    huangjinhua: '黄金花',
    dikedeheidiao: '低客的黑调',
    taffy: 'taffy',
    deepseek: 'deepseek',
    xungaodaishu: '浔高袋鼠',
    niulai: '牛来',
  };

  function loadIdolConfigs(){
    if(location.protocol === 'file:'){
      return Promise.resolve();
    }
    const jobs = Object.keys(IDOL_FOLDERS).map(id => {
      const folder = IDOL_FOLDERS[id];
      const idol = IDOLS.find(i => i.id === id);
      return fetch(encodeURI(folder + '/config.json'), { cache: 'no-store' })
        .then(r => { if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(cfg => {
          if(!idol) return;
          if(cfg.name) idol.name = cfg.name;
          if(cfg.romaji) idol.romaji = cfg.romaji;
          if(cfg.type) idol.type = cfg.type;
          if(cfg.rarity) idol.rarity = cfg.rarity;
          if(cfg.exclusiveCard) idol.exclusiveCard = cfg.exclusiveCard;
          if(cfg.color) idol.color = cfg.color;
          if(cfg.description) idol.desc = cfg.description;
          if(cfg.skill) idol.skillText = cfg.skill;
          if(cfg.motto) idol.motto = cfg.motto;
          if(cfg.image) idol.img = folder + '/' + cfg.image;
          if(cfg.effects) idol.effects = Object.assign({}, idol.effects, cfg.effects);
        })
        .catch(err => console.warn('读取角色配置失败：' + folder, err));
    });
    return Promise.all(jobs);
  }

  /* ================= 感性卡组 =================
     字段说明：
     type      'A'=攻击(打分) / 'M'=支援(buff)
     cost      消耗体力（有元气优先扣元气）
     vigor     获得元气
     damage    伤害（受 集中/好调/绝好调/颜色 影响）
     focus     集中 buff
     tune      好调 buff
     greatTune 绝好调
     heal      回复体力
     refresh   再动（本回合可再打一张）
     draw      抽牌张数（下次抽牌多抽）
     multi     true=可无限次使用（用后进弃牌堆，洗牌后仍可出现；缺省=整局仅限一次）
     doubleNext true=打出后，下一张卡牌的效果额外发动一次
     aCardBonus 打出后获得 buff：此后每次使用 A 卡，额外获得 (N+集中)×好调×得意色 的分数（单独结算，不并入该卡伤害）
     turnEndFocus 数值 N=获得 buff：此后每回合结束时若集中 ≥ turnEndFocusReq（默认 3），集中 +N
     turnEndFocusReq 上述集中门槛，缺省 3
     costStamina 数值 N=直接扣除 N 点体力（不消耗元气）
     pickTop   数值 N=从牌堆/弃牌堆选取 N 张卡置于牌堆顶部
     nextTurnAction 数值 N=下回合出牌次数 +N
     根目录 cards.js 的 window.CARD_CONFIG 优先作为卡组来源；未加载时沿用这里的内置卡组。 */
  const BUILTIN_CARDS = [
    // —— M 卡：叠 buff / 资源 ——
    { name:'静心凝神', icon:'🧘', type:'M', cost:2, focus:3, multi:true },
    { name:'深呼吸',   icon:'🌬️', type:'M', cost:2, focus:1, tune:1, multi:true },
    { name:'心情高涨', icon:'🎶', type:'M', cost:3, tune:2 },
    { name:'绝佳状态', icon:'🌟', type:'M', cost:4, greatTune:true },
    { name:'全神贯注', icon:'🎯', type:'M', cost:4, focus:3, draw:1 },
    // —— A 卡：打分 ——
    { name:'全力一击', icon:'👊', type:'A', cost:4, damage:6, multi:true },
    { name:'华丽绽放', icon:'💐', type:'A', cost:7, damage:10 },
    { name:'心潮澎湃', icon:'💓', type:'A', cost:6, damage:8, tune:1 },
    { name:'连击',     icon:'⚡', type:'A', cost:6, damage:5, refresh:true, multi:true },
    { name:'终场高潮', icon:'🌠', type:'A', cost:9, damage:12 },
    { name:'节奏攻势', icon:'🥁', type:'A', cost:5, damage:4, draw:2 },
    { name:'心意合一', icon:'💞', type:'A', cost:5, damage:7, focus:1 },
    // —— 消耗型支援 ——
    { name:'存在感',   icon:'💞', type:'M', tuneCost:0, focus:5, refresh:true, multi:true },
    { name:'齐声应援', icon:'📣', type:'M', focusCost:2, tune:3, damage:6, refresh:true, multi:true },
    { name:'国民偶像', icon:'👑', type:'M', tuneCost:1, vigor:8, refresh:true, doubleNext:true },
    { name:'至高娱乐', icon:'🎬', type:'A', focusCost:2, draw:1, aCardBonus:5 },
    { name:'天真浪漫', icon:'🧸', type:'M', cost:3, turnEndFocus:2, turnEndFocusReq:3 },
    { name:'天赋之才', icon:'🧠', type:'M', costStamina:10, tune:3, focus:2, pickTop:2, nextTurnAction:1 },
    { name:'聚光灯', icon:'🔦', type:'M', costStamina:6, tune:7, draw:2, delayedDraw:1, delayedDrawTurns:2, multi:true },
    { name:'重新开始', icon:'🔄', type:'M', cost:5, refresh:true, redrawHand:true, drawNow:2, costHalfTurns:6 },
  ];

  let CARDS = BUILTIN_CARDS.slice();

  function normalizeCard(c){
    if(!c || typeof c.name !== 'string' || !c.name.trim()) return null;
    const card = { name: c.name.trim(), icon: c.icon || '🎴', type: c.type === 'A' ? 'A' : 'M' };
    ['cost','costStamina','damage','focus','tune','vigor','heal','draw','aCardBonus','turnEndFocus','turnEndFocusReq','pickTop','nextTurnAction','delayedDraw','delayedDrawTurns','drawNow','costHalfTurns'].forEach(k => {
      const v = Number(c[k]);
      if(Number.isFinite(v) && v > 0) card[k] = v;
    });
    const tuneCost = Number(c.tuneCost);
    if(Number.isFinite(tuneCost) && tuneCost >= 0) card.tuneCost = tuneCost;
    const focusCost = Number(c.focusCost);
    if(Number.isFinite(focusCost) && focusCost >= 0) card.focusCost = focusCost;
    if(c.greatTune) card.greatTune = true;
    if(c.refresh) card.refresh = true;
    if(c.multi) card.multi = true;
    if(c.doubleNext) card.doubleNext = true;
    if(c.redrawHand) card.redrawHand = true;
    return card;
  }

  function loadCardConfig(){
    if(!Array.isArray(window.CARD_CONFIG)){
      console.warn('未找到 cards.js，沿用内置卡组');
      return Promise.resolve();
    }
    const cards = window.CARD_CONFIG.map(normalizeCard).filter(Boolean);
    if(cards.length) CARDS = cards;
    return Promise.resolve();
  }

  /* ================= 状态 ================= */
  let S = null;
  function newGame(idol){
    S = {
      idol: idol,
      idolColor: idol.color,   // 得意色
      week: 1,
      stamina: MAX_STAMINA,
      vigor: 0,
      focus: 0,           // 集中
      tune: 0,            // 好调
      greatTune: false,   // 绝好调
      unwell: false,      // 体调不良
      wheel: 0,           // 轮盘索引
      actionsLeft: 1,     // 本回合剩余出牌次数
      bonusDraw: 0,       // 下次抽牌额外张数
      nextDouble: false,  // 下一张打出卡牌的效果是否额外发动一次
      aCardBonus: 0,      // 后续每张 A 卡追加的伤害
      turnEndFocus: 0,    // 回合结束时满足条件提升的集中值
      turnEndFocusReq: 3, // 触发该提升所需的集中下限
      nextTurnExtraAction: 0, // 下回合额外出牌次数
      pickTopPending: 0,      // 待选取置顶的卡牌数量
      delayedDraws: [],       // 延迟抽牌队列：{ turns, amount }
      costHalfTurns: 0,       // 剩余体力消耗减半回合数
      singExtraUsed: false,   // 「唱」色额外出牌是否已用掉（整局限一次）
      danceExtraUsed: false,  // 「舞」色额外出牌是否已用掉（整局限一次）
      visualExtraUsed: false, // 「看」色额外出牌是否已用掉（整局限一次）
      totalScore: 0,      // 累计打分
      rival: 0,
      candidates: [],
      deck: [],        // 牌库（未使用的牌）
      discard: [],     // 弃牌堆（用掉的可多次卡 / 未打出的牌）
      exiled: [],      // 除外（用掉的仅限一次卡）
      log: [],
      over: false,
    };
    // 牌库：SSR 角色额外加入一张专属牌
    const deck = CARDS.slice();
    if(idol.rarity === 'SSR' && idol.exclusiveCard){
      const ex = normalizeCard(idol.exclusiveCard);
      if(ex){
        ex.exclusive = true;
        ex.ownerId = idol.id;
        deck.push(ex);
      }
    }
    S.deck = shuffle(deck);
    // 起始状态（来自角色配置 effects）
    const eff = idol.effects || {};
    if(eff.startFocus) S.focus = eff.startFocus;
    if(eff.startTune)  S.tune = eff.startTune;
    if(eff.startVigor) S.vigor = eff.startVigor;
  }

  /* ================= 工具 ================= */
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  function clamp(v,lo,hi){ return Math.max(lo, Math.min(hi, v)); }
  function wheelAttr(){ return WHEEL_ORDER[S.wheel]; }

  function tuneMult(){
    if(S.tune <= 0) return 1;
    const eff = (S.idol && S.idol.effects) || {};
    // 角色技能：黄色回合好调效果翻倍
    if(eff.visualTuneDouble && wheelAttr() === 'visual') return 1.5 + 0.2*S.tune;
    // 角色技能：黄色回合始终按绝好调公式计算好调倍率
    if(eff.visualGreatTune && wheelAttr() === 'visual') return 1.5 + 0.1*S.tune;
    return S.greatTune ? (1.5 + 0.1*S.tune) : 1.5;
  }
  // 角色技能：黄色回合集中效果翻倍（仅影响打分，不改动集中数值本身）
  function focusForScore(){
    const eff = (S.idol && S.idol.effects) || {};
    if(eff.visualFocusDouble && wheelAttr() === 'visual') return S.focus * 2;
    return S.focus;
  }
  // 颜色倍率：普通角色 得意色×1.5 / 其他×1；SSR 得意色×2 / 其他×1.5
  function colorMult(){
    const match = wheelAttr() === S.idolColor;
    if(S.idol && S.idol.rarity === 'SSR') return match ? 2 : 1.5;
    return match ? COLOR_MULT : 1;
  }

  /* ================= 渲染 ================= */
  const $ = id => document.getElementById(id);

  function renderAll(){
    $('stamina-val').textContent = S.stamina;
    $('vigor-val').textContent = S.vigor;
    $('stamina-fill').style.width = (S.stamina/MAX_STAMINA*100) + '%';
    $('vigor-fill').style.width = (S.vigor/MAX_VIGOR*100) + '%';
    $('stamina-fill').classList.toggle('low', S.stamina <= 30);

    $('buff-focus').textContent = S.focus;
    $('buff-tune').textContent = S.tune;
    $('buff-great').textContent = S.greatTune ? '有' : '—';
    $('buff-great').style.opacity = S.greatTune ? 1 : .5;

    const tm = tuneMult();
    const fv = focusForScore();
    $('mult-note').innerHTML =
      '当前加成：🎯 伤害 +' + fv + (fv !== S.focus ? '（集中×2）' : '') +
      ' ｜ 🎵 ' + (tm===1 ? '无好调' : ('伤害 ×' + tm.toFixed(2))) +
      (S.nextDouble ? ' ｜ 👑 下一张效果×2' : '') +
      (S.aCardBonus ? ' ｜ 🎬 后续A卡+' + S.aCardBonus + '分' : '') +
      (S.turnEndFocus ? ' ｜ 🧸 回合结束集中+' + S.turnEndFocus : '') +
      (S.costHalfTurns > 0 ? ' ｜ ❤️ 消耗减半(' + S.costHalfTurns + '回合)' : '');

    $('you-score').textContent = S.totalScore + ' 分';
    $('foe-score').textContent = S.rival + ' 分';
    const mx = Math.max(300, S.totalScore, S.rival);
    $('you-fill').style.width = (S.totalScore/mx*100) + '%';
    $('foe-fill').style.width = (S.rival/mx*100) + '%';

    renderRing();

    let hint = '对手正在努力训练中…';
    if(S.unwell){ hint = '💔 体调不良：请用「稍作休息」恢复体力。'; }
    else if(S.stamina <= 20){ hint = '⚠️ 体力告急！归零将进入体调不良。'; }
    else if(S.greatTune && S.tune >= 3){ hint = '🌟 绝好调 + 好调满溢，是大打出手的好时机！'; }
    else if(!S.greatTune){ hint = '💡 先用 M 卡叠「集中/好调」，并尽快拿到「绝好调」。'; }
    $('rival-hint').textContent = hint;
  }

  function renderRing(){
    const deg = (S.week - 1) * 30 + 15;   // 12 等分，指针指向当前周所在扇区
    $('ring-needle').style.transform = 'rotate(' + deg + 'deg)';
    $('ring-week').textContent = S.week;
    const attr = wheelAttr();
    const a = ATTRS[attr];
    const isBoost = attr === S.idolColor;
    const note = $('ring-note');
    note.textContent = a.icon + ' ' + a.label + ' ×' + colorMult();
    note.style.background = isBoost ? a.dark : (S.idol.rarity === 'SSR' ? '#8a6a2f' : '#9aa0a8');
  }

  function costText(card){
    const p = [];
    if(card.cost > 0) p.push('❤️' + card.cost);
    if(card.costStamina > 0) p.push('❤️' + card.costStamina + '直伤');
    if(card.tuneCost !== undefined) p.push('🎵' + card.tuneCost);
    if(card.focusCost !== undefined) p.push('🎯' + card.focusCost);
    return p.length ? p.join(' ') : '免费';
  }

  function cardDesc(card){
    const p = [];
    if(card.damage) p.push('⚔️伤害 ' + card.damage);
    if(card.focus)  p.push('🎯集中 +' + card.focus);
    if(card.tune)   p.push('🎵好调 +' + card.tune);
    if(card.greatTune) p.push('🌟绝好调');
    if(card.vigor)  p.push('🔥元气 +' + card.vigor);
    if(card.heal)   p.push('🍵体力 +' + card.heal);
    if(card.refresh)p.push('⟳再动');
    if(card.draw)   p.push('🂠抽牌 +' + card.draw);
    if(card.doubleNext) p.push('👑下张效果×2');
    if(card.aCardBonus) p.push('🎬后续A卡+'+card.aCardBonus+'分(受加成)');
    if(card.turnEndFocus) p.push('🧸回合结束集中+'+card.turnEndFocus+'(需集中≥'+(card.turnEndFocusReq||3)+')');
    if(card.pickTop) p.push('🃏选'+card.pickTop+'张置顶');
    if(card.nextTurnAction) p.push('➡️下回合出牌+'+card.nextTurnAction);
    if(card.delayedDraw) p.push('🂠'+(card.delayedDrawTurns||2)+'回合后抽牌+'+card.delayedDraw);
    if(card.redrawHand) p.push('🔄更换手牌');
    if(card.drawNow) p.push('🂠立即抽牌+'+card.drawNow);
    if(card.costHalfTurns) p.push('❤️'+card.costHalfTurns+'回合消耗减半');
    if(card.tuneCost !== undefined) p.push('🎵需好调≥' + card.tuneCost);
    if(card.focusCost !== undefined) p.push('🎯需集中≥' + card.focusCost);
    return p.join(' · ');
  }

  function cardBuffs(card){
    const p = [];
    if(card.damage) p.push('⚔️ 伤害 +' + card.damage);
    if(card.focus)  p.push('🎯 集中 +' + card.focus);
    if(card.tune)   p.push('🎵 好调 +' + card.tune);
    if(card.greatTune) p.push('🌟 绝好调');
    if(card.vigor)  p.push('🔥 元气 +' + card.vigor);
    if(card.heal)   p.push('🍵 体力 +' + card.heal);
    if(card.refresh)p.push('⟳ 再动');
    if(card.draw)   p.push('🂠 抽牌 +' + card.draw);
    if(card.doubleNext) p.push('👑 下一张效果额外发动一次');
    if(card.aCardBonus) p.push('🎬 后续 A 卡 +' + card.aCardBonus + ' 分（受集中/好调/得意色加成）');
    if(card.turnEndFocus) p.push('🧸 每回合结束：集中 ≥ ' + (card.turnEndFocusReq || 3) + ' 时集中 +' + card.turnEndFocus);
    if(card.pickTop) p.push('🃏 从牌堆/弃牌堆选 ' + card.pickTop + ' 张置于牌堆顶部');
    if(card.nextTurnAction) p.push('➡️ 下回合出牌次数 +' + card.nextTurnAction);
    if(card.delayedDraw) p.push('🂠 ' + (card.delayedDrawTurns || 2) + ' 回合后抽牌 +' + card.delayedDraw);
    if(card.redrawHand) p.push('🔄 更换全部手牌');
    if(card.drawNow) p.push('🂠 立即抽牌 +' + card.drawNow);
    if(card.costHalfTurns) p.push('❤️ ' + card.costHalfTurns + ' 回合内体力消耗减半（向上取整）');
    if(card.tuneCost !== undefined) p.push('🎵 需好调 ≥ ' + card.tuneCost);
    if(card.focusCost !== undefined) p.push('🎯 需集中 ≥ ' + card.focusCost);
    return p;
  }

  function reuseText(card){
    if(card.exclusive) return '⭐ 角色专属牌 · ' + (card.multi ? '可使用多次' : '仅限使用一次');
    return card.multi ? '可使用多次' : '考试舞台仅限使用一次';
  }

  function showTip(card, el){
    const tip = $('card-tip');
    const costTxt = costText(card);
    const reuse = reuseText(card);
    tip.innerHTML =
      '<div class="tip-cost">' + costTxt + '</div>' +
      '<div class="tip-name">' + card.icon + ' ' + card.name + '</div>' +
      '<div class="tip-buffs">' + cardBuffs(card).map(b => '<span>' + b + '</span>').join('') + '</div>' +
      '<div class="tip-reuse">' + reuse + '</div>';
    tip.classList.add('show');
    const r = el.getBoundingClientRect();
    let x = r.left + r.width/2 - tip.offsetWidth/2;
    let y = r.top - tip.offsetHeight - 10;
    if(y < 8) y = r.bottom + 10;
    x = Math.max(8, Math.min(x, window.innerWidth - tip.offsetWidth - 8));
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }

  function hideTip(){
    $('card-tip').classList.remove('show');
  }

  function deckCardInner(card){
    return '<div class="dc-cost">' + costText(card) + '</div>' +
      '<div class="dc-name"><span class="dc-type">' + card.type + '</span>' + (card.exclusive ? '<span class="tag ex">专属</span>' : '') + card.icon + ' ' + card.name + '</div>' +
      '<div class="dc-buffs">' + cardBuffs(card).map(b => '<span>' + b + '</span>').join('') + '</div>' +
      '<div class="dc-reuse">' + reuseText(card) + '</div>';
  }

  function deckCardHTML(card){
    return '<div class="deck-card type-' + (card.type==='A' ? 'a' : 'm') + '">' + deckCardInner(card) + '</div>';
  }

  function renderDeck(){
    const sec = (id, arr) => { $(id).innerHTML = arr.length ? arr.map(deckCardHTML).join('') : '<div class="deck-empty">（空）</div>'; };
    sec('deck-hand', S.candidates);
    sec('deck-pile', S.deck);
    sec('deck-discard', S.discard);
    sec('deck-exiled', S.exiled);
  }

  function openDeck(){
    renderDeck();
    $('deck-overlay').classList.add('show');
  }

  function closeDeck(){
    $('deck-overlay').classList.remove('show');
  }

  function renderCards(){
    const wrap = $('cards');
    wrap.innerHTML = '';
    const n = S.candidates.length;
    wrap.style.gridTemplateColumns = (n > 3 && window.innerWidth > 560) ? ('repeat(' + n + ', 1fr)') : '';
    S.candidates.forEach((card, i) => {
      const el = document.createElement('div');
      el.className = 'card type-' + (card.type==='A' ? 'a' : 'm') + (card.exclusive ? ' exclusive' : '');
      el.style.animationDelay = (i*0.08) + 's';
      const costTxt = costText(card);
      el.innerHTML =
        '<div class="topstrip"></div>' +
        '<div class="ccost">' + costTxt + '</div>' +
        '<div class="cname"><span class="tag">' + card.type + '</span>' + (card.exclusive ? '<span class="tag ex">专属</span>' : '') + card.icon + ' ' + card.name + '</div>' +
        '<div class="cdesc">' + cardDesc(card) + '</div>';
      el.addEventListener('click', () => playCard(card, el));
      el.addEventListener('mouseenter', () => showTip(card, el));
      el.addEventListener('mouseleave', hideTip);
      wrap.appendChild(el);
    });
  }

  function addLog(msg){
    S.log.unshift(msg);
    if(S.log.length > 40) S.log.pop();
    const log = $('log');
    log.innerHTML = '';
    S.log.forEach(m => { const d = document.createElement('div'); d.innerHTML = m; log.appendChild(d); });
  }

  function showSkillPop(icon, name){
    const el = document.createElement('div');
    el.className = 'skill-pop';
    el.textContent = (icon ? icon + ' ' : '') + name;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1150);
  }

  // 角色专属牌：全屏演出特效
  function showExclusiveFx(card){
    const el = document.createElement('div');
    el.className = 'exclusive-fx';
    el.innerHTML =
      '<div class="ex-burst"></div>' +
      '<div class="ex-card">' + card.icon + '</div>' +
      '<div class="ex-name">' + card.name + '</div>' +
      '<div class="ex-tag">专属演出</div>';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  /* ================= 流程 ================= */
  function drawCards(n){
    if(S.deck.length < n && S.discard.length > 0){
      S.deck = S.deck.concat(S.discard);
      S.discard = [];
      shuffle(S.deck);
    }
    const drawn = [];
    for(let i = 0; i < n; i++){
      if(S.deck.length === 0) break;
      drawn.push(S.deck.pop());
    }
    return drawn;
  }

  function drawCandidates(){
    const n = 3 + S.bonusDraw;
    S.bonusDraw = 0;
    S.candidates = drawCards(n);
  }

  // 感性分数公式：(基础分 + 集中) × 好调倍率 × 得意色倍率
  // 黄色回合牛来的集中效果×2，由 focusForScore() 处理
  function sensitiveScore(base){
    let v = Math.floor((base + focusForScore()) * tuneMult());
    return Math.floor(v * colorMult());
  }

  // 卡牌的「效果」部分（buff / 资源 / 出伤 / 再动 / 抽牌），不含消耗
  function applyCardEffects(card, lines){
    if(card.focus){ S.focus += card.focus; lines.push('🎯集中+' + card.focus); }
    if(card.tune){ S.tune += card.tune; lines.push('🎵好调+' + card.tune); }
    if(card.greatTune && !S.greatTune){ S.greatTune = true; lines.push('🌟绝好调！'); }
    if(card.vigor){ S.vigor = clamp(S.vigor + card.vigor, 0, MAX_VIGOR); lines.push('🔥元气+' + card.vigor); }
    if(card.heal){
      S.stamina = clamp(S.stamina + card.heal, 0, MAX_STAMINA);
      lines.push('🍵体力+' + card.heal);
      if(S.unwell && S.stamina > 0){ S.unwell = false; lines.push('💪摆脱体调不良！'); }
    }

    if(card.damage > 0){
      const tm = tuneMult();
      const cm = colorMult();
      const dmg = sensitiveScore(card.damage);
      S.totalScore += dmg;
      const tags = [];
      if(tm > 1) tags.push('好调×' + tm.toFixed(2));
      if(cm !== 1) tags.push((wheelAttr() === S.idolColor ? '得意色' : '轮盘色') + '×' + cm);
      lines.push('⚔️打分 +' + dmg + (tags.length ? ('（' + tags.join('，') + '）') : ''));
    }

    if(card.refresh){ S.actionsLeft += 1; lines.push('⟳再动！'); }
    if(card.draw){ S.bonusDraw += card.draw; lines.push('🂠抽牌+' + card.draw); }
    if(card.doubleNext){ S.nextDouble = true; lines.push('👑 下一张卡效果额外发动一次'); }
    if(card.turnEndFocus){
      S.turnEndFocus += card.turnEndFocus;
      if(card.turnEndFocusReq !== undefined) S.turnEndFocusReq = card.turnEndFocusReq;
      lines.push('🧸 每回合结束：集中 ≥ ' + S.turnEndFocusReq + ' 时集中 +' + card.turnEndFocus);
    }
    if(card.nextTurnAction){
      S.nextTurnExtraAction += card.nextTurnAction;
      lines.push('➡️ 下回合出牌次数 +' + card.nextTurnAction);
    }
    if(card.pickTop){
      S.pickTopPending += card.pickTop;
      lines.push('🃏 选取 ' + card.pickTop + ' 张置于牌堆顶部');
    }
    if(card.delayedDraw){
      const turns = card.delayedDrawTurns || 2;
      S.delayedDraws.push({ turns: turns, amount: card.delayedDraw });
      lines.push('🂠 ' + turns + ' 回合后抽牌 +' + card.delayedDraw);
    }
    if(card.redrawHand){
      const n = S.candidates.length;
      S.candidates.forEach(c => S.discard.push(c));
      S.candidates = [];
      drawCards(n).forEach(c => S.candidates.push(c));
      lines.push('🔄 更换全部手牌（' + n + ' 张）');
    }
    if(card.drawNow){
      drawCards(card.drawNow).forEach(c => S.candidates.push(c));
      lines.push('🂠 立即抽牌 +' + card.drawNow);
    }
    if(card.costHalfTurns){
      S.costHalfTurns = Math.max(S.costHalfTurns, card.costHalfTurns);
      lines.push('❤️ ' + card.costHalfTurns + ' 回合内体力消耗减半');
    }
  }

  function playCard(card, el){
    if(S.over) return;
    if(card.tuneCost !== undefined && S.tune < card.tuneCost){
      addLog('🚫 <b>' + card.icon + ' ' + card.name + '</b> — 好调不足（需 ' + card.tuneCost + '，当前 ' + S.tune + '）');
      return;
    }
    if(card.focusCost !== undefined && S.focus < card.focusCost){
      addLog('🚫 <b>' + card.icon + ' ' + card.name + '</b> — 集中不足（需 ' + card.focusCost + '，当前 ' + S.focus + '）');
      return;
    }
    hideTip();
    el.classList.add('played');
    if(card.exclusive) showExclusiveFx(card);
    else showSkillPop(card.icon, card.name);
    S.candidates = S.candidates.filter(c => c !== card);
    if(card.multi){ S.discard.push(card); }
    else { S.exiled.push(card); }
    const lines = [];
    const eff = S.idol.effects || {};

    // 1) 消耗：先扣元气，不足扣体力；减半期间费用向上取整
    const halve = S.costHalfTurns > 0;
    const cost = card.cost > 0 ? (halve ? Math.ceil(card.cost / 2) : card.cost) : 0;
    let absorbed = 0;
    if(cost > 0){
      absorbed = Math.min(S.vigor, cost);
      S.vigor -= absorbed;
      const rem = cost - absorbed;
      S.stamina = clamp(S.stamina - rem, 0, MAX_STAMINA);
      lines.push('消耗❤️' + (rem) + (absorbed>0 ? '（元气抵扣'+absorbed+'）' : '') + (halve ? '（减半）' : ''));
    }
    if(card.tuneCost > 0){
      S.tune -= card.tuneCost;
      lines.push('消耗🎵' + card.tuneCost);
    }
    if(card.focusCost > 0){
      S.focus -= card.focusCost;
      lines.push('消耗🎯' + card.focusCost);
    }
    if(card.costStamina > 0){
      const direct = halve ? Math.ceil(card.costStamina / 2) : card.costStamina;
      S.stamina = clamp(S.stamina - direct, 0, MAX_STAMINA);
      lines.push('消耗❤️' + direct + '（直伤体力' + (halve ? '·减半' : '') + '）');
    }

    // 2) A 卡加分 buff：先获得/结算固定加分，再发动卡牌本身效果
    if(card.aCardBonus){
      S.aCardBonus += card.aCardBonus;
      lines.push('🎬 获得 buff：使用 A 卡分数 +' + card.aCardBonus);
    }
    if(card.type === 'A' && S.aCardBonus > 0){
      const bonus = sensitiveScore(S.aCardBonus);
      S.totalScore += bonus;
      lines.push('🎬 娱乐加成 +' + bonus + '（(' + S.aCardBonus + '+集中)×好调×颜色倍率）');
    }

    // 角色技能：每使用一张 A 卡，好调 +N
    if(card.type === 'A' && eff.aCardTune){
      S.tune += eff.aCardTune;
      lines.push('🎵 ' + S.idol.name + ' · A卡好调+' + eff.aCardTune);
    }

    // 3) 卡牌效果；若处于「效果额外发动」状态，则完整再发动一次
    const doubled = S.nextDouble;
    S.nextDouble = false;
    if(doubled) lines.push('👑 效果额外发动一次');
    applyCardEffects(card, lines);
    if(doubled) applyCardEffects(card, lines);

    // 4) 体力归零 → 体调不良
    if(S.stamina <= 0 && !S.unwell){ S.unwell = true; lines.push('💔体力归零，体调不良！'); }

    if(card.redrawHand || card.drawNow) renderCards();

    addLog('第' + S.week + '周 · <b>' + card.icon + ' ' + card.name + '</b> — ' + lines.join('，'));
    renderAll();

    if(S.pickTopPending > 0){ openPickTop(); }
    else { finishPlay(); }
  }

  function finishPlay(){
    S.actionsLeft -= 1;
    S.over = true;
    setTimeout(() => {
      if(S.actionsLeft > 0){
        S.over = false;
      } else {
        endTurn();
      }
    }, 620);
  }

  // 从牌堆 / 弃牌堆选取卡牌置于牌堆顶部（抽牌从数组末尾取）
  function openPickTop(){
    hideTip();
    S.over = true;
    const need = S.pickTopPending;
    const pool = S.deck.concat(S.discard);
    if(pool.length === 0){
      S.pickTopPending = 0;
      addLog('🃏 牌堆与弃牌堆为空，无法选取');
      finishPlay();
      return;
    }
    const target = Math.min(need, pool.length);
    const picked = [];

    const overlay = document.createElement('div');
    overlay.className = 'deck-overlay show';
    overlay.innerHTML =
      '<div class="deck-panel">' +
        '<div class="deck-head">' +
          '<span class="deck-title">🃏 选择 ' + target + ' 张卡置于牌堆顶部</span>' +
          '<span class="pick-count" id="pick-count">已选 0/' + target + '</span>' +
        '</div>' +
        '<div class="deck-body" id="pick-body"></div>' +
        '<div class="pick-actions">' +
          '<button class="btn" id="pick-confirm" type="button" disabled>确认置顶</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    const body = overlay.querySelector('#pick-body');
    const counter = overlay.querySelector('#pick-count');
    const confirmBtn = overlay.querySelector('#pick-confirm');

    const makeTiles = (title, cards) => {
      if(!cards.length) return;
      const sec = document.createElement('div');
      sec.className = 'deck-sec';
      sec.innerHTML = '<div class="deck-sec-title">' + title + '</div>';
      const grid = document.createElement('div');
      grid.className = 'deck-grid';
      cards.forEach(card => {
        const tile = document.createElement('div');
        tile.className = 'deck-card pickable type-' + (card.type === 'A' ? 'a' : 'm');
        tile.innerHTML = deckCardInner(card);
        tile.addEventListener('click', () => {
          const i = picked.indexOf(card);
          if(i >= 0){ picked.splice(i, 1); }
          else if(picked.length < target){ picked.push(card); }
          tile.classList.toggle('selected', picked.includes(card));
          confirmBtn.disabled = picked.length !== target;
          counter.textContent = '已选 ' + picked.length + '/' + target;
        });
        grid.appendChild(tile);
      });
      sec.appendChild(grid);
      body.appendChild(sec);
    };

    makeTiles('🂠 牌堆', S.deck);
    makeTiles('🗑️ 弃牌堆', S.discard);

    confirmBtn.addEventListener('click', () => {
      if(picked.length !== target) return;
      picked.forEach(card => {
        let i = S.deck.indexOf(card);
        if(i >= 0){ S.deck.splice(i, 1); }
        else {
          i = S.discard.indexOf(card);
          if(i >= 0) S.discard.splice(i, 1);
        }
        S.deck.push(card);
      });
      S.pickTopPending = 0;
      addLog('🃏 ' + picked.map(c => c.icon + ' ' + c.name).join('、') + ' 置于牌堆顶部');
      overlay.remove();
      finishPlay();
    });
  }

  function rest(){
    if(S.over) return;
    hideTip();
    S.over = true;
    S.stamina = clamp(S.stamina + 8, 0, MAX_STAMINA);
    addLog('🛌 休息一回合 · ❤️体力 +8');
    renderAll();
    setTimeout(endTurn, 620);
  }

  function endTurn(){
    // 卡牌 buff：回合结束时集中达标则提升
    if(S.turnEndFocus > 0 && S.focus >= S.turnEndFocusReq){
      S.focus += S.turnEndFocus;
      addLog('🧸 回合结束 · 集中 +' + S.turnEndFocus + '（当前 ' + S.focus + '）');
    }

    // 对手涨分
    const gain = 15 + Math.floor(Math.random()*7); // 15~21
    S.rival += gain;
    addLog('🌙 对手本周 +' + gain + ' 分');
    renderAll();

    // 卡牌入库 → 进入下一周
    showCardStock(() => {
      // 未打出的手牌进入洗牌堆
      S.candidates.forEach(c => S.discard.push(c));
      S.candidates = [];
      S.week++;
      if(S.week > TOTAL_WEEKS){ showResult(); return; }

      // 好调衰减（回合开始）
      if(S.tune > 0){ S.tune--; addLog('🎵 好调衰减 -1（剩 ' + S.tune + '）'); }

      // 体力消耗减半倒计时
      if(S.costHalfTurns > 0){
        S.costHalfTurns--;
        if(S.costHalfTurns === 0) addLog('❤️ 体力消耗减半结束');
      }

      const eff = S.idol.effects || {};

      // 角色技能：最后 3 回合开始时加分（受三种 buff 影响）
      if(eff.finalBonus && S.week >= TOTAL_WEEKS - 2){
        const bonus = Math.floor((eff.finalBonus + S.focus) * tuneMult());
        S.totalScore += bonus;
        addLog('⏱️ ' + S.idol.name + ' · 最后回合加成 +' + bonus + ' 分');
      }

      // 角色技能：最后一回合开始时 固定加分
      if(eff.lastTurnBonus && S.week === TOTAL_WEEKS){
        S.totalScore += eff.lastTurnBonus;
        addLog('⏱️ ' + S.idol.name + ' · 最后一回合开始 分数 +' + eff.lastTurnBonus);
      }

      // 轮盘轮转
      S.wheel = (S.wheel + 1) % 3;
      S.actionsLeft = 1;
      if(S.nextTurnExtraAction > 0){
        S.actionsLeft += S.nextTurnExtraAction;
        addLog('➡️ 本回合出牌次数 +' + S.nextTurnExtraAction);
        S.nextTurnExtraAction = 0;
      }
      if(eff.singExtraAction && wheelAttr() === 'sing' && !S.singExtraUsed){
        S.singExtraUsed = true;
        S.actionsLeft += 1;
        addLog('🎤 ' + S.idol.name + ' · 红色回合可多打一张手牌！（整局仅一次）');
      }
      if(eff.danceExtraAction && wheelAttr() === 'dance' && !S.danceExtraUsed){
        S.danceExtraUsed = true;
        S.actionsLeft += 1;
        addLog('💃 ' + S.idol.name + ' · 蓝色回合可多打一张手牌！（整局仅一次）');
      }
      if(eff.visualExtraAction && wheelAttr() === 'visual' && !S.visualExtraUsed){
        S.visualExtraUsed = true;
        S.actionsLeft += 1;
        addLog('✨ ' + S.idol.name + ' · 黄色回合可多打一张手牌！（整局仅一次）');
      }
      if(eff.visualFocusBonus && wheelAttr() === 'visual'){
        S.focus += eff.visualFocusBonus;
        addLog('🎯 ' + S.idol.name + ' · 黄色回合开始 集中 +' + eff.visualFocusBonus);
      }

      // 延迟抽牌：到期的加入下次抽牌
      if(S.delayedDraws.length){
        S.delayedDraws = S.delayedDraws.filter(d => {
          d.turns -= 1;
          if(d.turns <= 0){
            S.bonusDraw += d.amount;
            addLog('🂠 延迟抽牌 +' + d.amount + ' 生效');
            return false;
          }
          return true;
        });
      }

      drawCandidates();
      S.over = false;
      renderAll();
      renderCards();

      const a = ATTRS[wheelAttr()];
      addLog('🎯 第' + S.week + '周 · 轮盘色 <b>' + a.icon + a.label + '</b>' + (wheelAttr()===S.idolColor ? '（得意！本回合×1.5）' : ''));
    });
  }

  function showCardStock(done){
    const overlay = document.createElement('div');
    overlay.className = 'stock-overlay';
    overlay.innerHTML =
      '<div class="stock-deck">🂠</div>' +
      '<div class="stock-label">第 ' + S.week + ' 周结束 · 卡牌入库</div>';
    document.body.appendChild(overlay);

    // 未打出的手牌飞入卡堆
    const hand = document.querySelectorAll('#cards .card:not(.played)');
    hand.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const clone = c.cloneNode(true);
      clone.style.position = 'fixed';
      clone.style.left = r.left + 'px';
      clone.style.top = r.top + 'px';
      clone.style.width = r.width + 'px';
      clone.style.height = r.height + 'px';
      clone.style.margin = '0';
      clone.style.animation = 'none';
      clone.style.transition = 'all .55s cubic-bezier(.5,.1,.3,1) ' + (i*0.07) + 's';
      overlay.appendChild(clone);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const dx = window.innerWidth/2 - (r.left + r.width/2);
        const dy = window.innerHeight/2 - (r.top + r.height/2);
        clone.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(.18) rotate(' + (i%2 ? 14 : -14) + 'deg)';
        clone.style.opacity = '0';
      }));
    });

    setTimeout(() => {
      overlay.classList.add('hide');
      setTimeout(() => { overlay.remove(); done(); }, 320);
    }, 880);
  }

  /* ================= 一中奖学金 ================= */
  const SCHOLARSHIP_KEY = 'yizhong-idol-scholarship';
  function loadScholarship(){
    try{ return parseInt(localStorage.getItem(SCHOLARSHIP_KEY), 10) || 0; }catch(e){ return 0; }
  }
  function saveScholarship(v){
    try{ localStorage.setItem(SCHOLARSHIP_KEY, String(v)); }catch(e){ /* 隐私模式 / file:// 下忽略 */ }
  }
  let scholarship = loadScholarship();
  function renderScholarship(){
    const el = $('scholarship-total');
    if(el) el.textContent = scholarship;
  }

  /* ================= 结算 ================= */
  function showResult(){
    const total = S.totalScore;
    const earned = total;   // 本局获得的一中奖学金 = 最终评分
    scholarship += earned;
    saveScholarship(scholarship);
    renderScholarship();
    const win = total >= S.rival;
    const ratio = S.rival > 0 ? total / S.rival : 2;
    let grade, gclass, verdict;
    if(ratio >= 1.5){ grade='SS'; gclass='s'; }
    else if(ratio >= 1.25){ grade='S'; gclass='s'; }
    else if(ratio >= 1.05){ grade='A'; gclass='a'; }
    else if(ratio >= 0.9){ grade='B'; gclass='b'; }
    else { grade='C'; gclass='c'; }

    verdict = win ? '🎉 胜利！' : '😢 惜败…';
    let sub;
    if(grade==='SS') sub = '超常发挥！你打出了传说的舞台，宿敌甘拜下风！';
    else if(grade==='S') sub = '完美的养成！感性连击把宿敌甩在身后！';
    else if(grade==='A') sub = '表现出色！稳稳拿下期末发表会！';
    else if(grade==='B') sub = '有惊无险，勉强过关，继续努力吧！';
    else sub = '差距不小，下次更用心地规划 buff 与出牌节奏。';

    $('grade').textContent = grade;
    $('grade').className = 'grade ' + gclass;
    $('verdict').textContent = verdict;
    $('result-sub').textContent = sub;

    const b = $('breakdown');
    b.innerHTML =
      '<div class="line"><span>所选偶像</span><span>' + S.idol.icon + ' ' + S.idol.name + '（' + S.idol.type + '）</span></div>' +
      '<div class="line"><span>最终 集中</span><span>' + S.focus + '</span></div>' +
      '<div class="line"><span>最终 好调</span><span>' + S.tune + '</span></div>' +
      '<div class="line"><span>最终 绝好调</span><span>' + (S.greatTune ? '有' : '无') + '</span></div>' +
      '<div class="line"><span>剩余 体力</span><span>' + S.stamina + '</span></div>' +
      (S.unwell ? '<div class="line"><span>💔 体调不良</span><span>—</span></div>' : '') +
      '<div class="line total"><span>你的打分总计</span><span>' + total + '</span></div>' +
      '<div class="line rival"><span>对手打分总计（月岛 ルナ）</span><span>' + S.rival + '</span></div>' +
      '<div class="line scholarship"><span>🪙 本局获得一中奖学金</span><span>+' + earned + '</span></div>' +
      '<div class="line scholarship"><span>🪙 一中奖学金总计</span><span>' + scholarship + '</span></div>';

    showScreen('screen-result');
    if(win) launchConfetti();
  }

  /* ================= 背景音乐 ================= */
  const BGM_TRACKS = [
    { name: '关注塔菲谢谢喵', src: 'bgm/【官方编舞&sol;动作配布】关注塔菲谢谢喵☆_哔哩哔哩_bilibili.mp3' },
  ];
  const BGM_VOLUME = 0.45;
  const BGM_KEY_MUTED = 'yizhong-idol-bgm-muted';
  const BGM_KEY_TRACK = 'yizhong-idol-bgm-track';

  function bgmStore(key, value){
    try{
      if(value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    }catch(e){ /* 隐私模式 / file:// 下忽略 */ }
    return null;
  }

  const bgm = new Audio();
  bgm.loop = true;
  bgm.volume = BGM_VOLUME;
  bgm.preload = 'auto';

  let bgmIndex = clamp(parseInt(bgmStore(BGM_KEY_TRACK), 10) || 0, 0, BGM_TRACKS.length - 1);
  let bgmMuted = bgmStore(BGM_KEY_MUTED) === '1';

  function loadBgmTrack(index, autoplay){
    bgmIndex = ((index % BGM_TRACKS.length) + BGM_TRACKS.length) % BGM_TRACKS.length;
    bgm.src = encodeURI(BGM_TRACKS[bgmIndex].src);
    $('bgm-name').textContent = BGM_TRACKS[bgmIndex].name;
    bgmStore(BGM_KEY_TRACK, bgmIndex);
    if(autoplay) playBgm();
  }

  function playBgm(){
    if(bgmMuted) return;
    const p = bgm.play();
    if(p && p.catch) p.catch(() => {}); // 自动播放被拦截时，等待首次交互
  }

  function updateBgmUI(){
    const btn = $('bgm-toggle');
    $('bgm-icon').textContent = bgmMuted ? '🔇' : '🔊';
    btn.classList.toggle('muted', bgmMuted);
    btn.setAttribute('aria-pressed', String(!bgmMuted));
    btn.setAttribute('aria-label', bgmMuted ? '开启背景音乐' : '关闭背景音乐');
  }

  function toggleBgm(){
    bgmMuted = !bgmMuted;
    bgmStore(BGM_KEY_MUTED, bgmMuted ? '1' : '0');
    if(bgmMuted){
      bgm.pause();
    } else {
      playBgm();
    }
    updateBgmUI();
  }

  function nextBgm(){
    loadBgmTrack(bgmIndex + 1, !bgmMuted);
  }

  bgm.addEventListener('play',  () => $('bgm-dock').classList.add('playing'));
  bgm.addEventListener('pause', () => $('bgm-dock').classList.remove('playing'));

  // 浏览器拦截自动播放时，用首次点击/按键解锁
  const unlockBgm = () => {
    document.removeEventListener('pointerdown', unlockBgm);
    document.removeEventListener('keydown', unlockBgm);
    if(!bgmMuted && bgm.paused) playBgm();
  };

  /* ================= 界面切换 ================= */
  const SCREEN_BG = {
    'screen-start': 'background/桂平市第一中学.jpg',
    'screen-select': 'background/桂平市第一中学2.jpg',
  };
  function setScreenBg(id){
    const el = $('screen-bg');
    const src = SCREEN_BG[id];
    if(src){
      el.style.backgroundImage = 'url("' + encodeURI(src) + '")';
      el.classList.add('show');
    } else {
      el.classList.remove('show');
    }
  }
  function showScreen(id){
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
    document.body.dataset.screen = id;
    setScreenBg(id);
    window.scrollTo(0,0);
  }
  let idolPage = 0;
  const IDOLS_PER_PAGE = 5;
  function renderIdolSelect(reset){
    if(reset) idolPage = 0;
    const totalPages = Math.max(1, Math.ceil(IDOLS.length / IDOLS_PER_PAGE));
    idolPage = Math.max(0, Math.min(idolPage, totalPages - 1));
    const slice = IDOLS.slice(idolPage * IDOLS_PER_PAGE, idolPage * IDOLS_PER_PAGE + IDOLS_PER_PAGE);
    const grid = $('idol-grid');
    grid.innerHTML = '';
    slice.forEach(idol => {
      const a = ATTRS[idol.color];
      const eff = idol.effects || {};
      const perkTxt = idol.skillText || (eff.startFocus ? '🎯 起手集中 +' + eff.startFocus
        : eff.startTune ? '🎵 起手好调 +' + eff.startTune
        : eff.startVigor ? '🔥 起手元气 +' + eff.startVigor
        : '—');
      const rarity = RARITIES[idol.rarity] ? idol.rarity : DEFAULT_RARITY;
      const unlocked = isIdolUnlocked(idol);
      const el = document.createElement('div');
      el.className = 'idol-pick' + (unlocked ? '' : ' locked');
      el.dataset.rarity = rarity;
      el.innerHTML =
        '<span class="rarity-badge">' + rarity + '</span>' +
        (idol.img
          ? '<div class="pick-avatar"><img src="' + idol.img + '" alt="' + idol.name + '"></div>'
          : '<div class="pick-avatar" style="background:' + a.color + '33">' + idol.icon + '</div>') +
        '<h3>' + idol.name + ' <span class="type-chip">' + idol.type + '</span></h3>' +
        '<div class="pick-sub">' + idol.romaji + '</div>' +
        '<span class="pick-color" style="background:' + a.dark + '">得意色 ' + a.icon + a.label + '</span>' +
        '<p>' + idol.desc + '</p>' +
        (idol.motto ? '<div class="pick-motto">「' + idol.motto + '」</div>' : '') +
        '<div class="pick-perk">' + perkTxt + '</div>' +
        (unlocked ? '' : '<div class="idol-lock"><span>🔒</span><b>未解锁</b><small>需通过一中奖学金抽卡解锁</small></div>');
      el.addEventListener('click', () => {
        if(!unlocked){ showLockToast(idol); return; }
        startGame(idol);
      });
      grid.appendChild(el);
    });
    $('idol-prev').disabled = idolPage <= 0;
    $('idol-next').disabled = idolPage >= totalPages - 1;
  }

  function renderIdolAvatar(){
    const idol = S.idol;
    const av = $('you-avatar');
    av.innerHTML = idol.img ? '<img src="' + idol.img + '" alt="' + idol.name + '">' : idol.icon;
    $('you-name').textContent = idol.name;
  }

  function startGame(idol){
    if(!isIdolUnlocked(idol)){ showLockToast(idol); return; }
    newGame(idol);
    renderIdolAvatar();
    drawCandidates();
    S.over = false;
    const a = ATTRS[idol.color];
    const wa = ATTRS[wheelAttr()];
    const cm = colorMult();
    addLog('🎬 养成开始！' + idol.name + ' · 得意色 <b>' + a.icon + a.label + '</b>，轮盘色 <b>' + wa.icon + wa.label + '</b>' + (cm > 1 ? '（' + (wheelAttr()===idol.color ? '得意！' : '') + '本回合×' + cm + '）' : ''));
    renderAll();
    renderCards();
    showScreen('screen-game');
  }

  /* ================= 装饰 ================= */
  function makePetals(){
    const chars = ['🌸','🌸','🌸','🎵','✨','🌷','❀'];
    const wrap = $('petals');
    for(let i=0;i<10;i++){
      const p = document.createElement('span');
      p.className = 'petal';
      p.textContent = chars[i % chars.length];
      p.style.left = (Math.random()*100) + '%';
      p.style.fontSize = (12 + Math.random()*16) + 'px';
      p.style.animationDuration = (9 + Math.random()*9) + 's';
      p.style.animationDelay = (Math.random()*10) + 's';
      wrap.appendChild(p);
    }
  }
  function launchConfetti(){
    const c = $('confetti');
    c.innerHTML = '';
    const colors = ['#ff7eb9','#5aa9ff','#ffb64d','#ff5c9d','#3d8bfd','#ffd700'];
    for(let i=0;i<60;i++){
      const s = document.createElement('span');
      s.style.left = (Math.random()*100) + '%';
      s.style.background = colors[i % colors.length];
      s.style.animationDuration = (2.5 + Math.random()*2.5) + 's';
      s.style.animationDelay = (Math.random()*0.8) + 's';
      c.appendChild(s);
    }
    setTimeout(() => { c.innerHTML=''; }, 6000);
  }

  /* ================= 绑定 ================= */
  const dataReady = Promise.all([loadIdolConfigs(), loadCardConfig()]);
  $('btn-start').addEventListener('click', () => {
    dataReady.finally(() => { renderIdolSelect(true); showScreen('screen-select'); });
  });
  $('btn-back-start').addEventListener('click', () => showScreen('screen-start'));
  $('btn-again').addEventListener('click', () => { $('confetti').innerHTML=''; renderIdolSelect(true); showScreen('screen-select'); });
  $('idol-prev').addEventListener('click', () => { idolPage--; renderIdolSelect(false); });
  $('idol-next').addEventListener('click', () => { idolPage++; renderIdolSelect(false); });
  $('btn-home').addEventListener('click', () => { $('confetti').innerHTML=''; showScreen('screen-start'); });
  $('rest-btn').addEventListener('click', rest);
  $('deck-btn').addEventListener('click', openDeck);
  $('deck-close').addEventListener('click', closeDeck);
  $('deck-overlay').addEventListener('click', (e) => { if(e.target.id === 'deck-overlay') closeDeck(); });

  const rulesDialog = $('rules-dialog');
  $('rules-toggle').addEventListener('click', () => rulesDialog.showModal());
  $('rules-dialog-close').addEventListener('click', () => rulesDialog.close());
  rulesDialog.addEventListener('click', (e) => { if(e.target === rulesDialog) rulesDialog.close(); });

  document.body.dataset.screen = 'screen-start';
  $('bgm-toggle').addEventListener('click', toggleBgm);
  $('bgm-next').addEventListener('click', nextBgm);
  document.addEventListener('pointerdown', unlockBgm);
  document.addEventListener('keydown', unlockBgm);
  loadBgmTrack(bgmIndex, true);
  updateBgmUI();

  setScreenBg('screen-start');
  makePetals();
  renderScholarship();
})();
