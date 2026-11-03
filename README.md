# 一中偶像大师

《一中偶像大师》是一款纯前端的校园偶像养成卡牌游戏。玩家选择一位偶像，在 12 周内通过打牌叠加 buff 与对手比拼分数。

## 运行

角色数据通过 `fetch` 读取各自文件夹里的 `config.json`，因此建议用本地 HTTP 服务打开：

```bash
npm start
# 打开 http://localhost:8080
```

没有 npm 也可以直接用 Python：

```bash
python -m http.server 8080
```

直接双击 `index.html`（`file://`）也能玩。卡组写在 `cards.js` 里，不受影响；但浏览器会禁止读取本地 JSON，此时角色配置（`<角色名>/config.json`）不生效，改用 `script.js` 里的内置数据。

## 项目结构

```
index.html          页面结构
style.css           样式
script.js           游戏逻辑（抽牌、出伤、结算、配置加载）
cards.js            卡组配置（带中文注释，改卡就改这里）
package.json        启动脚本
<角色名>/config.json  角色配置（名字、擅长色、技能、格言、效果）
<角色名>/<图片>       角色头像
background/         开始/选角背景图与开始界面右侧入场立绘（*-cutout.webp）
bgm/                BGM 目录（预留）
```

## 角色配置

每个角色文件夹包含一张图片和一个 `config.json`：

| 字段 | 说明 |
|---|---|
| `name` | 角色显示名 |
| `romaji` | 英文名 |
| `type` | 类型（目前均为「感性」） |
| `rarity` | 角色卡稀有度（`R` / `SR` / `SSR`，缺省为 `SR`；目前所有角色均为 `SR`） |
| `specialty` | 擅长色中文（唱 / 舞 / 看） |
| `color` | 擅长色标识（`sing` / `dance` / `visual`） |
| `skill` | 技能展示文案 |
| `motto` | 格言 |
| `description` | 角色简介 |
| `image` | 图片文件名（与 config.json 同目录） |
| `exclusiveCard` | SSR 角色专属牌（卡牌对象，字段同 `cards.js`；仅 SSR 生效，开局加入牌库） |
| `effects` | 技能的实际数值效果，见下表 |

`skill` 只负责显示，真正生效的是 `effects`；修改数值时请同步更新 `skill` 文案。

### effects 字段

| 键 | 效果 |
|---|---|
| `startFocus` | 开局集中 +N |
| `startTune` | 开局好调 +N |
| `startVigor` | 开局元气 +N |
| `finalBonus` | 最后 3 回合开始时，分数按 `(N + 集中) × 好调倍率` 增加 |
| `lastTurnBonus` | 最后一回合开始时固定 +N 分 |
| `danceExtraAction` | 蓝色（舞）回合可多打一张（整局限一次） |
| `visualExtraAction` | 黄色（看）回合可多打一张（整局限一次） |
| `visualFocusBonus` | 黄色（看）回合开始时集中 +N |

只需要写用到的键，未写的沿用内置默认值。

### 稀有度差异

- **R / SR**：常规角色。
- **SSR**：
  - 开局牌库额外加入一张 `exclusiveCard` 专属牌，打出时播放专属演出特效。
  - 颜色轮盘倍率更强：得意色 ×2、非得意色 ×1.5（普通角色为 ×1.5 / ×1）。
  - 默认锁定，需通过「一中奖学金」抽卡解锁；解锁状态保存在 `localStorage`。

抽卡功能接入时调用：

```js
window.YizhongIdols.unlock('角色id');       // 解锁
window.YizhongIdols.isUnlocked('角色id');   // 是否已解锁
window.YizhongIdols.getUnlocked();          // 已解锁 id 列表
```

## 卡组配置

根目录的 `cards.js` 定义 `window.CARD_CONFIG` 数组，页面通过 `<script>` 直接加载，作为整个牌库；文件顶部有全部字段的中文说明，每张卡上方也有中文效果注释。直接往数组里追加对象即可加卡；如果 `cards.js` 没有加载，则沿用 `script.js` 里的内置卡组。

```js
window.CARD_CONFIG = [
  // 消耗 2 体力，集中 +3；可无限次使用
  { name: '静心凝神', icon: '🧘', type: 'M', cost: 2, focus: 3, multi: true },
  // 消耗 9 体力，基础伤害 12；整局仅限一次
  { name: '终场高潮', icon: '🌠', type: 'A', cost: 9, damage: 12 },
];
```

| 字段 | 说明 |
|---|---|
| `name` | 卡牌名（必填，为空会被忽略） |
| `icon` | 卡面图标，缺省 `🎴` |
| `type` | `A`=攻击（打分）/ `M`=支援（叠 buff），缺省 `M` |
| `cost` | 体力消耗（有元气优先扣元气），缺省 0 |
| `tuneCost` | 消耗好调 N；当前好调 ≥ N 才能打出，缺省不消耗 |
| `focusCost` | 消耗集中 N；当前集中 ≥ N 才能打出，缺省不消耗 |
| `damage` | 伤害，受集中 / 好调 / 绝好调 / 颜色影响 |
| `focus` | 集中 +N |
| `tune` | 好调 +N |
| `greatTune` | `true` = 获得绝好调 |
| `vigor` | 元气 +N |
| `heal` | 回复体力 +N |
| `refresh` | `true` = 再动（本回合可再打一张） |
| `draw` | 下次抽牌多抽 N 张 |
| `multi` | `true` = 可无限次使用（用后进弃牌堆，洗牌后还能再抽到）；缺省则整局仅限一次（用后进除外区） |
| `doubleNext` | `true` = 打出后，下一张打出的卡效果额外发动一次 |
| `aCardBonus` | 数值 N = 打出后获得 buff：此后每次使用 A 卡，额外获得 `(N + 集中) × 好调倍率 × 颜色倍率` 的分数；在 A 卡效果结算前触发，单独结算、不并入该卡伤害 |
| `turnEndFocus` | 数值 N = 打出后获得 buff：此后每回合结束时，若集中达到 `turnEndFocusReq`（默认 3）以上，集中 +N |
| `turnEndFocusReq` | 上述 buff 的集中门槛，缺省 3 |
| `costStamina` | 数值 N = 直接扣除 N 点体力（不消耗元气） |
| `pickTop` | 数值 N = 打出时从牌堆 / 弃牌堆选取 N 张卡置于牌堆顶部 |
| `nextTurnAction` | 数值 N = 下回合出牌次数 +N |
| `delayedDraw` | 数值 N = 延迟抽牌 N 张 |
| `delayedDrawTurns` | 延迟几个回合后触发，缺省 2 |
| `redrawHand` | `true` = 更换全部手牌（弃掉当前手牌，重抽相同张数） |
| `drawNow` | 数值 N = 立即抽 N 张加入当前手牌 |
| `costHalfTurns` | 数值 N = 之后 N 回合内体力消耗减半（向上取整） |

数值字段只写用到的键。`cost` 为 0 或省略时卡牌免费。

## 玩法

- 12 周养成，每回合从牌库抽 3 张，三选一打出。
- 卡牌分 `A` 攻击（打分）与 `M` 支援（叠 buff）。
- buff：集中（每点 +1 伤害）、好调（≥1 时 ×1.5，每回合 -1）、绝好调（倍率变为 `1.5 + 0.1 × 好调`）。
- 出伤：`(卡牌伤害 + 集中) × 好调倍率 × 颜色倍率`。
- 轮盘在唱 / 舞 / 看之间轮转，转到偶像得意色时本回合 ×1.5。
- 体力归零进入体调不良，可用「休息」恢复 8 点体力。
