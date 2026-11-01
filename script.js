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

  /* ================= 偶像 ================= */
  const IDOLS = [
    { id:'hikari', name:'星野 ひかり', romaji:'Hikari', icon:'🎀', type:'感性', color:'sing',
      desc:'以「集中 + 好调 + 绝好调」叠出高额打分的感性型偶像，越战越强。',
      effects:{ startFocus:1 } },
    { id:'kanade', name:'青羽 かなで', romaji:'Kanade', icon:'🎻', type:'感性', color:'dance',
      desc:'擅长节奏与连击的感性型偶像，起手好调 1，倍率优势更大。',
      effects:{ startTune:1 } },
    { id:'akari', name:'藤堂 あかり', romaji:'Akari', icon:'🌸', type:'感性', color:'visual',
      desc:'均衡稳健、续航充沛的感性型偶像，起手元气 10，连打更从容。',
      effects:{ startVigor:10 } },
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
      skillText:'🔄 蓝色回合（舞）可多打一张 · 每回合限一次',
      effects:{ danceExtraAction:true } },
    { id:'longnainailong', name:'龙奶奶龙', romaji:'Longnainailong', icon:'🐉', img:'龙奶奶龙/longnainailong.jpg', type:'感性', color:'visual',
      desc:'xxf怎么这么坏啊！',
      motto:'你可以说我老，但不能说我菜。',
      skillText:'🔄 黄色回合（看）可多打一张 · 每回合限一次',
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
  ];

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
     multi     true=可使用多次（用后进洗牌堆，后续回合仍可出现；缺省=考试舞台仅限一次） */
  const CARDS = [
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
  ];

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
      totalScore: 0,      // 累计打分
      rival: 0,
      candidates: [],
      deck: [],        // 牌库（未使用的牌）
      discard: [],     // 弃牌堆（用掉的可多次卡 / 未打出的牌）
      exiled: [],      // 除外（用掉的仅限一次卡）
      log: [],
      over: false,
    };
    S.deck = shuffle(CARDS.slice());
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
    return S.greatTune ? (1.5 + 0.1*S.tune) : 1.5;
  }
  function colorMult(){ return wheelAttr() === S.idolColor ? COLOR_MULT : 1; }

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
    $('mult-note').innerHTML =
      '当前加成：🎯 伤害 +' + S.focus +
      ' ｜ 🎵 ' + (tm===1 ? '无好调' : ('伤害 ×' + tm.toFixed(2)));

    $('you-score').textContent = S.totalScore + ' 分';
    $('foe-score').textContent = S.rival + ' 分';
    const mx = Math.max(300, S.totalScore, S.rival);
    $('you-fill').style.width = (S.totalScore/mx*100) + '%';
    $('foe-fill').style.width = (S.rival/mx*100) + '%';

    renderRing();

    let hint = '对手正在努力训练中…';
    if(S.unwell){ hint = '💔 体调不良：伤害减半！请用「稍作休息」恢复体力。'; }
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
    note.textContent = a.icon + ' ' + a.label + (isBoost ? ' ×1.5' : ' ×1.0');
    note.style.background = isBoost ? a.dark : '#9aa0a8';
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
    return p;
  }

  function reuseText(card){
    return card.multi ? '可使用多次' : '考试舞台仅限使用一次';
  }

  function showTip(card, el){
    const tip = $('card-tip');
    const costTxt = card.cost > 0 ? ('❤️' + card.cost) : '免费';
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

  function deckCardHTML(card){
    const costTxt = card.cost > 0 ? ('❤️' + card.cost) : '免费';
    return '<div class="deck-card type-' + (card.type==='A' ? 'a' : 'm') + '">' +
        '<div class="dc-cost">' + costTxt + '</div>' +
        '<div class="dc-name"><span class="dc-type">' + card.type + '</span>' + card.icon + ' ' + card.name + '</div>' +
        '<div class="dc-buffs">' + cardBuffs(card).map(b => '<span>' + b + '</span>').join('') + '</div>' +
        '<div class="dc-reuse">' + reuseText(card) + '</div>' +
      '</div>';
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
      el.className = 'card type-' + (card.type==='A' ? 'a' : 'm');
      el.style.animationDelay = (i*0.08) + 's';
      const costTxt = card.cost > 0 ? ('❤️' + card.cost) : '免费';
      el.innerHTML =
        '<div class="topstrip"></div>' +
        '<div class="ccost">' + costTxt + '</div>' +
        '<div class="cname"><span class="tag">' + card.type + '</span>' + card.icon + ' ' + card.name + '</div>' +
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

  /* ================= 流程 ================= */
  function drawCandidates(){
    const n = 3 + S.bonusDraw;
    S.bonusDraw = 0;
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
    S.candidates = drawn;
  }

  function playCard(card, el){
    if(S.over) return;
    hideTip();
    el.classList.add('played');
    showSkillPop(card.icon, card.name);
    S.candidates = S.candidates.filter(c => c !== card);
    if(card.multi){ S.discard.push(card); }
    else { S.exiled.push(card); }
    const lines = [];

    // 1) 消耗：先扣元气，不足扣体力
    const cost = card.cost || 0;
    let absorbed = 0;
    if(cost > 0){
      absorbed = Math.min(S.vigor, cost);
      S.vigor -= absorbed;
      const rem = cost - absorbed;
      S.stamina = clamp(S.stamina - rem, 0, MAX_STAMINA);
      lines.push('消耗❤️' + (rem) + (absorbed>0 ? '（元气抵扣'+absorbed+'）' : ''));
    }

    // 2) buff / 资源
    if(card.focus){ S.focus += card.focus; lines.push('🎯集中+' + card.focus); }
    if(card.tune){ S.tune += card.tune; lines.push('🎵好调+' + card.tune); }
    if(card.greatTune && !S.greatTune){ S.greatTune = true; lines.push('🌟绝好调！'); }
    if(card.vigor){ S.vigor = clamp(S.vigor + card.vigor, 0, MAX_VIGOR); lines.push('🔥元气+' + card.vigor); }
    if(card.heal){
      S.stamina = clamp(S.stamina + card.heal, 0, MAX_STAMINA);
      lines.push('🍵体力+' + card.heal);
      if(S.unwell && S.stamina > 0){ S.unwell = false; lines.push('💪摆脱体调不良！'); }
    }

    // 3) 出伤（A 卡）
    if(card.damage > 0){
      let dmg = card.damage + S.focus;
      const tm = tuneMult();
      dmg = Math.floor(dmg * tm);
      const cm = colorMult();
      dmg = Math.floor(dmg * cm);
      if(S.unwell) dmg = Math.floor(dmg * 0.5);
      S.totalScore += dmg;
      const tags = [];
      if(tm > 1) tags.push('好调×' + tm.toFixed(2));
      if(cm > 1) tags.push('得意色×' + COLOR_MULT);
      lines.push('⚔️打分 +' + dmg + (tags.length ? ('（' + tags.join('，') + '）') : ''));
    }

    // 4) 再动 / 抽牌
    if(card.refresh){ S.actionsLeft += 1; lines.push('⟳再动！'); }
    if(card.draw){ S.bonusDraw += card.draw; lines.push('🂠抽牌+' + card.draw); }

    // 5) 体力归零 → 体调不良
    if(S.stamina <= 0 && !S.unwell){ S.unwell = true; lines.push('💔体力归零，体调不良！'); }

    addLog('第' + S.week + '周 · <b>' + card.icon + ' ' + card.name + '</b> — ' + lines.join('，'));
    renderAll();

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
      if(eff.danceExtraAction && wheelAttr() === 'dance'){
        S.actionsLeft += 1;
        addLog('💃 ' + S.idol.name + ' · 蓝色回合可多打一张手牌！');
      }
      if(eff.visualExtraAction && wheelAttr() === 'visual'){
        S.actionsLeft += 1;
        addLog('✨ ' + S.idol.name + ' · 黄色回合可多打一张手牌！');
      }
      if(eff.visualFocusBonus && wheelAttr() === 'visual'){
        S.focus += eff.visualFocusBonus;
        addLog('🎯 ' + S.idol.name + ' · 黄色回合开始 集中 +' + eff.visualFocusBonus);
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

  /* ================= 结算 ================= */
  function showResult(){
    const total = S.totalScore;
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
      (S.unwell ? '<div class="line"><span>💔 体调不良</span><span>伤害减半</span></div>' : '') +
      '<div class="line total"><span>你的打分总计</span><span>' + total + '</span></div>' +
      '<div class="line rival"><span>对手打分总计（月岛 ルナ）</span><span>' + S.rival + '</span></div>';

    showScreen('screen-result');
    if(win) launchConfetti();
  }

  /* ================= 界面切换 ================= */
  function showScreen(id){
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
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
      const el = document.createElement('div');
      el.className = 'idol-pick';
      el.style.borderColor = a.color;
      el.innerHTML =
        (idol.img
          ? '<div class="pick-avatar"><img src="' + idol.img + '" alt="' + idol.name + '"></div>'
          : '<div class="pick-avatar" style="background:' + a.color + '33">' + idol.icon + '</div>') +
        '<h3>' + idol.name + ' <span class="type-chip">' + idol.type + '</span></h3>' +
        '<div class="pick-sub">' + idol.romaji + '</div>' +
        '<span class="pick-color" style="background:' + a.dark + '">得意色 ' + a.icon + a.label + '</span>' +
        '<p>' + idol.desc + '</p>' +
        (idol.motto ? '<div class="pick-motto">「' + idol.motto + '」</div>' : '') +
        '<div class="pick-perk">' + perkTxt + '</div>';
      el.addEventListener('click', () => startGame(idol));
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
    newGame(idol);
    renderIdolAvatar();
    drawCandidates();
    S.over = false;
    const a = ATTRS[idol.color];
    const wa = ATTRS[wheelAttr()];
    addLog('🎬 养成开始！' + idol.name + ' · 得意色 <b>' + a.icon + a.label + '</b>，轮盘色 <b>' + wa.icon + wa.label + '</b>' + (wheelAttr()===idol.color ? '（得意！本回合×1.5）' : ''));
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
  const idolConfigReady = loadIdolConfigs();
  $('btn-start').addEventListener('click', () => {
    idolConfigReady.finally(() => { renderIdolSelect(true); showScreen('screen-select'); });
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

  makePetals();
})();
