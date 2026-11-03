/* ============================================================================
   卡组配置（改这个文件即可调整牌库）
   ----------------------------------------------------------------------------
   每张卡是一个对象，按需写用到的字段即可，没写的字段走默认值。
   注意：JSON 不支持注释，所以卡组从 cards.json 改成了本 JS 文件。

   【字段说明】
   name       卡牌名（必填，不能为空）
   icon       卡面图标（emoji），默认 🎴
   type       'A' = 攻击牌（打分） / 'M' = 支援牌（叠 buff），默认 'M'
   cost       体力消耗（有元气时优先扣元气），默认 0 = 免费
   tuneCost   消耗好调 N；当前好调 ≥ N 才能打出（0 表示只检查、不消耗）
   focusCost  消耗集中 N；当前集中 ≥ N 才能打出
   damage     伤害值，出伤时受 集中 / 好调 / 绝好调 / 得意色 加成
              （公式：(damage + 集中) × 好调倍率 × 颜色倍率）
   focus      集中 +N（每点集中让每次伤害 +1）
   tune       好调 +N（≥1 时伤害 ×1.5，每回合开始 -1）
   greatTune  true = 获得绝好调（好调倍率变为 1.5 + 0.1 × 好调数）
   vigor      元气 +N（上限 50，打牌时优先消耗）
   heal       体力 +N（上限 100，可解除体调不良）
   refresh    true = 再动（本回合可以多打一张牌）
   draw       下次抽牌多抽 N 张
   multi      true = 可无限次使用（用后进弃牌堆，洗牌后还能再抽到）
              不写 = 整局仅限使用一次（用后进除外区）
   doubleNext true = 打出后，下一张打出的卡牌效果额外发动一次
   aCardBonus 数值 N = 打出后获得 buff：此后每次使用 A 卡，额外获得
              (N + 集中) × 好调倍率 × 得意色倍率 的分数
              （在 A 卡效果结算前触发，单独结算，不并入该卡伤害）
   costStamina 数值 N = 直接扣除 N 点体力（不消耗元气）
   pickTop    数值 N = 从牌堆/弃牌堆选取 N 张卡置于牌堆顶部（打牌时弹窗选择）
   nextTurnAction 数值 N = 下回合出牌次数 +N
   delayedDraw 数值 N = 延迟抽牌，N 张
   delayedDrawTurns 延迟几回合后触发，缺省 2
   redrawHand true = 更换全部手牌（弃掉当前手牌，重抽相同张数）
   drawNow    数值 N = 立即抽 N 张加入当前手牌
   costHalfTurns 数值 N = 之后 N 回合内体力消耗减半（向上取整）
   turnEndFocus  数值 N = 打出后获得 buff：此后每回合结束时，
              若集中达到 turnEndFocusReq（默认 3）以上，集中 +N
   turnEndFocusReq  turnEndFocus 的集中门槛，缺省 3
   ============================================================================ */
window.CARD_CONFIG = [
  /* ---------------------------- M：支援牌 ---------------------------- */
  // 消耗 3 体力，好调 +2；整局仅限一次
  { name: '心情高涨', icon: '🎶', type: 'M', cost: 3, tune: 2 },

  // 消耗 4 体力，获得绝好调；整局仅限一次
  { name: '绝佳状态', icon: '🌟', type: 'M', cost: 4, greatTune: true },

  // 消耗 4 体力，集中 +3，下次抽牌多抽 1 张；整局仅限一次
  { name: '全神贯注', icon: '🎯', type: 'M', cost: 4, focus: 3, draw: 1 },

  // 好调 ≥ 0 即可打出（不消耗好调），集中 +5，再动；可重复使用
  { name: '存在感', icon: '💞', type: 'M', tuneCost: 0, focus: 5, refresh: true, multi: true },

  // 需要集中 ≥ 2（消耗 2 集中），好调 +3、伤害 6，再动；可重复使用
  { name: '齐声应援', icon: '📣', type: 'M', focusCost: 2, tune: 3, damage: 6, refresh: true, multi: true },

  // 消耗 1 好调（需好调 ≥ 1），元气 +8，再动；下一张打出的卡效果额外发动一次；整局仅限一次
  { name: '国民偶像', icon: '👑', type: 'M', tuneCost: 1, vigor: 8, refresh: true, doubleNext: true },

  // 直接扣 6 体力；好调 +7（每回合衰减 1，约持续七回合）；
  // 下回合多抽 2 张，两回合后再多抽 1 张；可重复使用
  { name: '聚光灯', icon: '🔦', type: 'M', costStamina: 6, tune: 7, draw: 2, delayedDraw: 1, delayedDrawTurns: 2, multi: true },

  // 消耗 5 体力；更换全部手牌并立即再抽 2 张；再动；
  // 之后 6 回合内体力消耗减半（向上取整）；整局仅限一次
  { name: '重新开始', icon: '🔄', type: 'M', cost: 5, refresh: true, redrawHand: true, drawNow: 2, costHalfTurns: 6 },

  // 消耗 3 体力；此后每回合结束时，若集中 ≥ 3 则集中 +2；整局仅限一次
  { name: '天真浪漫', icon: '🧸', type: 'M', cost: 3, turnEndFocus: 2, turnEndFocusReq: 3 },

  // 直接扣 10 体力；好调 +3（每回合衰减 1，约持续三回合）、集中 +2；
  // 从牌堆/弃牌堆选 2 张置于牌堆顶部；下回合出牌次数 +1；整局仅限一次
  { name: '天赋之才', icon: '🧠', type: 'M', costStamina: 10, tune: 3, focus: 2, pickTop: 2, nextTurnAction: 1 },

  /* ---------------------------- A：攻击牌 ---------------------------- */

  // 消耗 7 体力，基础伤害 10；整局仅限一次
  { name: '华丽绽放', icon: '💐', type: 'A', cost: 7, damage: 10 },

  // 消耗 6 体力，基础伤害 8、好调 +1；整局仅限一次
  { name: '心潮澎湃', icon: '💓', type: 'A', cost: 6, damage: 8, tune: 1 },

  // 消耗 9 体力，基础伤害 12；整局仅限一次
  { name: '终场高潮', icon: '🌠', type: 'A', cost: 9, damage: 12 },

  // 消耗 5 体力，基础伤害 4，下次抽牌多抽 2 张；整局仅限一次
  { name: '节奏攻势', icon: '🥁', type: 'A', cost: 5, damage: 4, draw: 2 },

  // 消耗 5 体力，基础伤害 7、集中 +1；整局仅限一次
  { name: '心意合一', icon: '💞', type: 'A', cost: 5, damage: 7, focus: 1 },

  // 需集中 ≥ 2（消耗 2 集中），下回合多抽 1 张；获得 buff：此后每次使用 A 卡，按 (5+集中)×好调×得意色 额外加分（单独结算）；整局仅限一次
  { name: '至高娱乐', icon: '🎬', type: 'A', focusCost: 2, draw: 1, aCardBonus: 5 },
];
