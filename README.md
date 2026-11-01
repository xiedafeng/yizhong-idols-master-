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

直接双击 `index.html`（`file://`）也能玩，但浏览器会禁止读取本地 JSON，此时游戏使用 `script.js` 里的内置数据，配置文件修改不会生效。

## 项目结构

```
index.html          页面结构
style.css           样式
script.js           游戏逻辑（抽牌、出伤、结算、配置加载）
package.json        启动脚本
<角色名>/config.json  角色配置（名字、擅长色、技能、格言、效果）
<角色名>/<图片>       角色头像
bgm/                BGM 目录（预留）
```

## 角色配置

每个角色文件夹包含一张图片和一个 `config.json`：

| 字段 | 说明 |
|---|---|
| `name` | 角色显示名 |
| `romaji` | 英文名 |
| `type` | 类型（目前均为「感性」） |
| `specialty` | 擅长色中文（唱 / 舞 / 看） |
| `color` | 擅长色标识（`sing` / `dance` / `visual`） |
| `skill` | 技能展示文案 |
| `motto` | 格言 |
| `description` | 角色简介 |
| `image` | 图片文件名（与 config.json 同目录） |
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
| `danceExtraAction` | 蓝色（舞）回合可多打一张（每回合限一次） |
| `visualExtraAction` | 黄色（看）回合可多打一张（每回合限一次） |
| `visualFocusBonus` | 黄色（看）回合开始时集中 +N |

只需要写用到的键，未写的沿用内置默认值。

## 玩法

- 12 周养成，每回合从牌库抽 3 张，三选一打出。
- 卡牌分 `A` 攻击（打分）与 `M` 支援（叠 buff）。
- buff：集中（每点 +1 伤害）、好调（≥1 时 ×1.5，每回合 -1）、绝好调（倍率变为 `1.5 + 0.1 × 好调`）。
- 出伤：`(卡牌伤害 + 集中) × 好调倍率 × 颜色倍率`，体调不良时再 ×0.5。
- 轮盘在唱 / 舞 / 看之间轮转，转到偶像得意色时本回合 ×1.5。
- 体力归零进入体调不良，可用「休息」恢复 8 点体力。
