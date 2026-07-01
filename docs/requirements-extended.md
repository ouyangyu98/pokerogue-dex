# PokeRogue 本地图鉴工具 — 扩展功能补记（二期已实现）

> 本文档作为 PRD（一期）的补充说明，记录项目在一期核心范围之外已经实现的扩展功能。所有扩展功能均基于一期已经建立的全量数据和中文映射体系，未引入后端服务或数据库。

## 一、功能定位

一期 PRD 的核心验收对象是“真实全量数据 + 可查询筛选”，覆盖精灵图鉴和地区/生态区查询。在实际开发过程中，为了更好地服务玩家决策和查询需求，项目在一期数据基础上提前实现了若干二期/扩展功能。本文档将这些功能纳入正式产品范围，并说明其数据来源、页面结构和验收状态。

## 二、扩展功能清单与验收状态

| 功能 | 入口路由 | 数据来源 | 状态 |
|------|---------|---------|------|
| 配队分析器 | `/team` | `pokemon.json` + `typeMatchups.ts` | ✅ 已实现 |
| 道具清单 | `/items` | `source/pokerogue/src/modifier/init-modifier-pools.ts` + `modifier-type.json` | ✅ 已实现 |
| 性格表 | `/natures` | `src/data/nature-zh.json` + 源码性格定义 | ✅ 已实现 |
| 属性克制 | `/types` | `src/typeMatchups.ts` | ✅ 已实现 |
| 招式查询 | `/moves` | `pokemon.json` 中的 `levelMoves` / `eggMoves` + `name-maps.json` | ✅ 已实现 |
| 招式详情 | `/move/:id` | `name-maps.json` + `pokemon.json` | ✅ 已实现 |
| 特性查询 | `/abilities` | `name-maps.json` | ✅ 已实现 |
| 特性详情 | `/ability/:id` | `name-maps.json` + `pokemon.json` | ✅ 已实现 |
| 地区导航地图 | `/map` | `biomes.json` + `biomeLinks` | ✅ 已实现 |
| SEO 静态页面 | 全站 HTML 预渲染 | `scripts/generate-static-pages.mjs` | ✅ 已实现 |
| 英文落地页 | `/en` | 静态文案 + 全站入口 | ✅ 已实现 |
| Smogon 推荐配招 | 精灵详情页 | `data.pkmn.cc/sets/gen9.json` | ✅ 已实现 |

## 三、各功能详细说明

### 3.1 配队分析器（Team Builder）

- **入口**：`/team`
- **功能**：玩家选择最多 6 只精灵组成队伍，页面实时展示队伍的属性克制覆盖、防御弱点、角色分布、技能缺口和优化建议。
- **数据来源**：`pokemon.json` 的种族值、属性、技能；`typeMatchups.ts` 的属性倍率表。
- **页面结构**：
  - 6 个队伍槽位，支持搜索添加和删除
  - 覆盖分析（Coverage Analysis）：统计队伍能打击的属性类型
  - 防御总览（Defense Overview）：汇总队伍整体抗性/弱点
  - 角色分布（Role Distribution）：按种族值倾向识别物攻/特攻/坦克/辅助等角色
  - 缺口建议（Gap Suggestions）：提示缺失的属性打击或防御覆盖
  - 数据表格（Team Data Table）：汇总队伍六维与关键属性

### 3.2 道具清单（Item List）

- **入口**：`/items`
- **功能**：展示游戏中可获取的道具/奖励，按稀有度分组，包含中文名、效果说明、图标 key。
- **数据来源**：`source/pokerogue/src/modifier/init-modifier-pools.ts` 定义玩家奖励池；`pokerogue-locales/zh-Hans/modifier-type.json` 提供名称和描述；`pokeball.json` 提供精灵球名称。
- **特殊处理**：`ATTACK_TYPE_BOOSTER` 在展示时自动展开为 18 个属性对应的强化道具（如丝绸围巾、木炭等）。

### 3.3 性格表（Nature Table）

- **入口**：`/natures`
- **功能**：展示全部性格及其对应的能力加成/减益方向，帮助玩家选择性格。
- **数据来源**：`src/data/nature-zh.json` 与官方源码中的性格数值定义。

### 3.4 属性克制（Type Matchup）

- **入口**：`/types`
- **功能**：展示 18 种属性之间的攻击/防御倍率关系，支持组合两种属性查看综合克制结果。
- **数据来源**：`src/typeMatchups.ts`。
- **附加能力**：在道具清单侧栏中展示属性强化道具对应关系。

### 3.5 招式查询与详情

- **入口**：`/moves`（列表）、`/move/:id`（详情）
- **功能**：
  - 列表页展示所有不重复招式，包括中文名、内部 ID、属性、分类、威力、命中；
  - 详情页展示该招式的基本信息、效果描述，以及可学习的精灵列表。
- **数据来源**：从 `pokemon.json` 中聚合 `levelMoves` 和 `eggMoves` 得到招式列表；`name-maps.json` 提供招式名、效果、属性名。
- **验收说明**：招式数据全部来自 PokeRogue 官方 learnset，未使用 PokéAPI 等第三方数据库。

### 3.6 特性查询与详情

- **入口**：`/abilities`（列表）、`/ability/:id`（详情）
- **功能**：
  - 列表页展示所有不重复特性，包括中文名、内部 ID、效果描述；
  - 详情页展示拥有该特性的精灵列表。
- **数据来源**：`name-maps.json` 中的 `ability` 和 `abilityDescription`。

### 3.7 地区导航地图（Biome Map）

- **入口**：`/map`
- **功能**：以可视化方式展示各地区之间的连接关系，帮助玩家规划跑图路线。
- **数据来源**：`biomes.json` 中的 `biomeLinks`。

### 3.8 SEO 静态页面

- **实现**：`scripts/generate-static-pages.mjs` 在构建阶段为所有精灵、地区、招式、特性、性格等生成独立 HTML 页面。
- **效果**：搜索引擎可直接索引每个实体页面；页面包含 `<title>`、`<meta description>`、Open Graph 标签、JSON-LD 结构化数据、sitemap.xml 和 robots.txt。
- **路由支持**：`vercel.json` 配置 rewrite，确保静态页面和 SPA 路由共存。

### 3.9 英文落地页（English Landing Page）

- **入口**：`/en`
- **功能**：为海外玩家提供英文介绍页面，展示站点功能并引导进入主图鉴。
- **特点**：不影响中文主站的默认语言；作为 SEO 的补充入口。

### 3.10 Smogon 推荐配招

- **入口**：精灵详情页底部 `/pokemon/:id`
- **功能**：对于在 Smogon 数据库中有数据的精灵，展示其竞技向配招（套装名称、描述、携带技能）。
- **数据来源**：构建时从 `https://data.pkmn.cc/sets/gen9.json` 获取，失败则跳过，不影响主构建流程。
- **使用说明**：Smogon 数据为外部参考，与 PokeRogue 的 learnset 和机制可能存在差异，仅作辅助决策。

## 四、功能矩阵：一期核心 vs 扩展功能

| 维度 | 一期核心 | 扩展功能 |
|------|---------|---------|
| 精灵图鉴 | 列表、搜索、筛选、排序、详情 | 招式/特性查询、Smogon 配招 |
| 地区查询 | 生态区列表、遭遇数据、筛选 | 地区导航地图 |
| 数据报告 | 统计、覆盖率 | 扩展覆盖率、普通/Boss 拆分 |
| 玩家决策 | 基础查询 | 配队分析、属性克制、性格表、道具清单 |
| 可发现性 | 站内链接 | SEO 静态页面、英文落地页 |

## 五、数据与架构约束

所有扩展功能均遵守一期 PRD 的技术约束：

- 数据来自本地 JSON 或源码提取，不依赖后端服务；
- 不引入复杂状态管理库；
- 桌面端优先，不强制移动端适配；
- 数据层与展示层分离；
- 类型定义集中维护在 `src/types/`。

## 六、后续可能方向

- 地区刷取建议：基于队伍配置推荐优先刷取的地区；
- 模式适配分析：针对无尽/经典/挑战等模式给出精灵/技能建议；
- 当前队伍缺口分析：与配队分析器联动，推荐可补位精灵；
- 招式效果与 PokeRogue 特殊机制的深度对齐（如部分招式对 Boss 无效等）。
