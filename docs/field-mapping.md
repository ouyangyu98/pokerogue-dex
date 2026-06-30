# PokeRogue 本地图鉴工具 — 数据导入方案与字段映射表

> 版本：基于 PokeRogue beta 分支源码（2026-06-15）
> 最后更新：2026-06-19

---

## 1. 目录结构

```
pokerogue-dex/
  source/
    pokerogue/              # 官方源码（用户手动放置）
    pokerogue-locales/      # 官方本地化仓库（用户手动放置）
  scripts/                  # 数据提取脚本（.mjs，Node.js ESM）
  public/data/              # 生成的 JSON 数据文件
  docs/
    field-mapping.md        # 本文件
    acceptance-report.md    # 验收报告（M5）
    requirements.md         # 需求文档
  src/
    types/                  # TypeScript 类型定义
    hooks/                  # React Hooks（如 useLazyImage）
    utils/                  # 工具函数（atlas、渲染、进化链）
    styles/                 # 模块化 CSS（pokemon.css、biome-map.css）
    components/             # 页面组件
```

---

## 2. 数据来源总览

| 目标数据 | 主数据源 | 中文映射源 | 备注 |
|---------|---------|-----------|------|
| 精灵基础数据 | `src/data/pokemon-species.ts` | `locales/zh-Hans/pokemon.json` | 含种族值、特性、费用 |
| 特性 | `src/data/abilities/ability.ts` | `locales/zh-Hans/ability.json` | 含描述 |
| 技能 | `src/data/moves/` 目录 | `locales/zh-Hans/move.json` | 含效果描述 |
| 等级技能 | `src/data/balance/species/` 目录 | — | 每个精灵独立文件 |
| 蛋招 | `src/data/balance/moves/egg-moves.ts` | — | 统一文件 |
| 进化 | `src/data/balance/pokemon-evolutions.ts` | `locales/zh-Hans/pokemon-evolutions.json` | — |
| 生态区 | `src/data/balance/biomes/*.ts` (35个) | `locales/zh-Hans/biomes.json` | 每个生态区独立文件 |
| 形态 | `src/data/pokemon-species.ts` (forms字段) | `locales/zh-Hans/pokemon-form.json` | — |
| 被动 | `src/data/abilities/` 或注册表 | — | 需进一步确认 |
| 费用 | `src/data/balance/starters.ts` | — | 初始精灵费用 |

---

## 3. 字段映射详表

### 3.1 精灵基础数据 (Pokemon)

**来源文件：** `source/pokerogue/src/data/pokemon-species.ts`

| 目标字段 | 源码字段/获取方式 | 类型 | 转换规则 | 缺失处理 |
|---------|-----------------|------|---------|---------|
| `id` | `PokemonSpecies.speciesId` | number | 直接使用 | 无 |
| `numericId` | `public/data/species-ids.json` | number | `speciesIds[id]` 查表（SpeciesId → Pokédex 编号） | 兜底 0 |
| `nameEn` | `PokemonSpecies.name` | string | 直接使用 | 无 |
| `nameZh` | `locales/zh-Hans/pokemon.json` | string | key = camelCase(nameEn) | 回退 nameEn |
| `generation` | `PokemonSpecies.generation` | number | 直接使用 | 无 |
| `type1` | `PokemonSpeciesForm.type1` | enum | 映射为中文属性名 | 无 |
| `type2` | `PokemonSpeciesForm.type2` | enum \| null | 映射为中文属性名 | null |
| `height` | `PokemonSpeciesForm.height` | number | 直接使用 | 无 |
| `weight` | `PokemonSpeciesForm.weight` | number | 直接使用 | 无 |
| `ability1` | `PokemonSpeciesForm.ability1` | enum | 映射为 AbilityId → 中文名 | 无 |
| `ability2` | `PokemonSpeciesForm.ability2` | enum | 映射为 AbilityId → 中文名 | null（若为NONE） |
| `abilityHidden` | `PokemonSpeciesForm.abilityHidden` | enum | 映射为 AbilityId → 中文名 | null（若为NONE） |
| `baseTotal` | `PokemonSpeciesForm.baseTotal` | number | 直接使用 | 无 |
| `baseHp` | `PokemonSpeciesFormConstructor.baseHp` | number | 直接使用 | 无 |
| `baseAtk` | `PokemonSpeciesFormConstructor.baseAtk` | number | 直接使用 | 无 |
| `baseDef` | `PokemonSpeciesFormConstructor.baseDef` | number | 直接使用 | 无 |
| `baseSpatk` | `PokemonSpeciesFormConstructor.baseSpatk` | number | 直接使用 | 无 |
| `baseSpdef` | `PokemonSpeciesFormConstructor.baseSpdef` | number | 直接使用 | 无 |
| `baseSpd` | `PokemonSpeciesFormConstructor.baseSpd` | number | 直接使用 | 无 |
| `catchRate` | `PokemonSpeciesForm.catchRate` | number | 直接使用 | 无 |
| `growthRate` | `PokemonSpecies.growthRate` | enum | 映射为中文 | 无 |
| `genderDiffs` | `PokemonSpecies.genderDiffs` | boolean | 直接使用 | false |
| `isStarterSelectable` | `PokemonSpeciesForm.isStarterSelectable` | boolean | 直接使用 | false |
| `subLegendary` | `PokemonSpecies.subLegendary` | boolean | 直接使用 | false |
| `legendary` | `PokemonSpecies.legendary` | boolean | 直接使用 | false |
| `mythical` | `PokemonSpecies.mythical` | boolean | 直接使用 | false |
| `forms` | `PokemonSpecies.forms` | PokemonForm[] | 遍历提取，见3.6 | [] |
| `cost` | `source/pokerogue/src/data/balance/starters.ts` | number | 查表获取 | null |
| `passive` | `speciesDataRegistry.getPassive()` | AbilityId | 运行时获取 | null |
| `eggMoves` | `source/pokerogue/src/data/balance/moves/egg-moves.ts` | MoveId[] | 查 speciesEggMoves[rootSpeciesId] | [] |
| `levelMoves` | `source/pokerogue/src/data/balance/species/*.ts` | LevelMoves | 查对应文件 | [] |

**提取方式：**
- 由于 `pokemon-species.ts` 使用 `SpeciesId` 枚举和类实例化，无法直接正则提取。
- **方案：** 使用 TypeScript 编译器 API（ts-morph）或构建临时 Node.js 脚本，导入源码模块，遍历 `speciesDataRegistry` 或所有 `SpeciesId` 枚举值，调用 `getPokemonSpecies(id)` 获取实例，再读取属性。
- **替代方案：** 若模块导入困难，使用 AST 解析提取 `new PokemonSpecies({...})` 构造参数。

---

### 3.2 特性 (Ability)

**来源文件：** `source/pokerogue/src/data/abilities/ability.ts`

| 目标字段 | 源码字段 | 类型 | 转换规则 | 缺失处理 |
|---------|---------|------|---------|---------|
| `id` | `AbilityId` 枚举值 | number | 直接使用 | 无 |
| `nameEn` | 源码中定义的名称 | string | 提取 | 无 |
| `nameZh` | `locales/zh-Hans/ability.json` | string | key = camelCase(nameEn) | 回退 nameEn |
| `descriptionZh` | `locales/zh-Hans/ability.json` | string | 取 description 字段 | 空字符串 |

**提取方式：**
- 特性数据分散在 `ability.ts` 中，使用 `new Ability(AbilityId.XXX, ...)` 定义。
- 使用 AST 解析或模块导入提取。

---

### 3.3 技能 (Move)

**来源文件：** `source/pokerogue/src/data/moves/` 目录

| 目标字段 | 源码字段 | 类型 | 转换规则 | 缺失处理 |
|---------|---------|------|---------|---------|
| `id` | `MoveId` 枚举值 | number | 直接使用 | 无 |
| `nameEn` | 源码中定义的名称 | string | 提取 | 无 |
| `nameZh` | `locales/zh-Hans/move.json` | string | key = camelCase(nameEn) | 回退 nameEn |
| `effectZh` | `locales/zh-Hans/move.json` | string | 取 effect 字段 | 空字符串 |
| `type` | `PokemonType` | enum | 映射为中文属性名 | 无 |
| `category` | 技能分类 | enum | 物理/特殊/变化 | 无 |
| `power` | 威力 | number | 直接使用 | null |
| `accuracy` | 命中 | number | 直接使用 | null |
| `pp` | PP | number | 直接使用 | 无 |

---

### 3.4 等级技能 (Level Moves)

**来源文件：** `source/pokerogue/src/data/balance/species/*.ts` (每个精灵一个文件)

| 目标字段 | 源码字段 | 类型 | 转换规则 | 缺失处理 |
|---------|---------|------|---------|---------|
| `speciesId` | 文件名或导出变量 | number | 提取 | 无 |
| `formKey` | 形态键 | string | 基础形态为 null | null |
| `level` | 等级 | number | 直接使用 | 无 |
| `moveId` | `MoveId` | number | 映射为技能信息 | 无 |

**数据结构示例：**
```typescript
export const BULBASAUR_LEVEL_MOVES = [
  [1, MoveId.TACKLE],
  [1, MoveId.GROWL],
  [3, MoveId.VINE_WHIP],
  // ...
] as const satisfies LevelMoves;
```

---

### 3.5 蛋招 (Egg Moves)

**来源文件：** `source/pokerogue/src/data/balance/moves/egg-moves.ts`

| 目标字段 | 源码字段 | 类型 | 转换规则 | 缺失处理 |
|---------|---------|------|---------|---------|
| `speciesId` | `SpeciesId` 键 | number | 直接使用 | 无 |
| `moveIds` | `MoveId[]` | number[] | 映射为技能信息 | [] |

**注意：** 蛋招数据以**基础形态**（root species）为键。对于进化型，需要找到其未进化形态的键。

---

### 3.6 形态 (Form)

**来源文件：** `source/pokerogue/src/data/pokemon-species.ts` (forms 字段)

| 目标字段 | 源码字段 | 类型 | 转换规则 | 缺失处理 |
|---------|---------|------|---------|---------|
| `formIndex` | 数组索引 | number | 0, 1, 2... | 无 |
| `formKey` | `PokemonForm.formKey` | string | 直接使用 | 无 |
| `formNameZh` | `locales/zh-Hans/pokemon-form.json` | string | 见下方映射规则 | 回退 formKey/英文名 |

**formNameZh 映射规则（2026-06-19 修正）：**

1. 优先查找：`formMap[formKeyCamel]`（formKey 转 camelCase）
2. 回退查找：`formMap[formKey]`（原始键名）
3. **battleForm 展平**：`pokemon-form.json` 中包含 `battleForm` 子对象（内含 `primal`、`gigantamax` 等翻译键），加载时需将 `battleForm` 内容展平到顶层，否则 `formMap["primal"]` 等查找会失败
4. 最终兜底：`formName`（英文名）或 `formKey`（若两者皆空则用"普通"）
| `type1` | `PokemonSpeciesForm.type1` | enum | 映射为中文属性名 | 继承基础 |
| `type2` | `PokemonSpeciesForm.type2` | enum \| null | 映射为中文属性名 | 继承基础 |
| `baseStats` | `baseHp`, `baseAtk`, ... | number[] | 若与基础不同则记录 | 继承基础 |
| `ability1` | `PokemonSpeciesForm.ability1` | enum | 若与基础不同则记录 | 继承基础 |
| `ability2` | `PokemonSpeciesForm.ability2` | enum | 若与基础不同则记录 | 继承基础 |
| `abilityHidden` | `PokemonSpeciesForm.abilityHidden` | enum | 若与基础不同则记录 | 继承基础 |

---

### 3.7 生态区/地区 (Biome)

**来源文件：** `source/pokerogue/src/data/balance/biomes/*.ts` (35个文件)

| 目标字段 | 源码字段 | 类型 | 转换规则 | 缺失处理 |
|---------|---------|------|---------|---------|
| `id` | `BiomeId` 枚举值 | number | 直接使用 | 无 |
| `nameEn` | 导出变量名 | string | 如 `forestBiome` → "forest" | 无 |
| `nameZh` | `locales/zh-Hans/biomes.json` | string | key = camelCase(nameEn) | 回退 nameEn |
| `biomeLinks` | `biomeLinks` | number[] | 可跳转地区 ID | [] |

---

### 3.8 生态区遭遇记录 (Biome Encounter)

**来源文件：** `source/pokerogue/src/data/balance/biomes/*.ts` → `pokemonPool`

| 目标字段 | 源码字段 | 类型 | 转换规则 | 缺失处理 |
|---------|---------|------|---------|---------|
| `biomeId` | `BiomeId` | number | 直接使用 | 无 |
| `poolTier` | `BiomePoolTier` | enum | COMMON/UNCOMMON/RARE/SUPER_RARE/ULTRA_RARE/BOSS/BOSS_RARE/BOSS_SUPER_RARE/BOSS_ULTRA_RARE | 无 |
| `timeOfDay` | `TimeOfDay` | enum | DAWN/DAY/DUSK/NIGHT/ALL | 无 |
| `speciesId` | `SpeciesId` | number | 直接使用 | 无 |
| `isBoss` | poolTier 是否以 BOSS 开头 | boolean | 自动计算 | false |
| `rarity` | poolTier 映射 | string | 见下表 | 无 |

**稀有度映射：**

| BiomePoolTier | 稀有度(rarity) |
|--------------|---------------|
| COMMON | 普通 |
| UNCOMMON | 罕见 |
| RARE | 稀有 |
| SUPER_RARE | 非常稀有 |
| ULTRA_RARE | 极其稀有 |
| BOSS | Boss |
| BOSS_RARE | Boss：稀有 |
| BOSS_SUPER_RARE | Boss：非常稀有 |
| BOSS_ULTRA_RARE | Boss：极其稀有 |

**概率说明：**
- 源码中生态区数据只有**物种列表 + 稀有度分级**，没有具体百分比概率。
- 游戏内概率由运行时根据各 tier 的权重动态计算。
- **一期处理：** 展示稀有度分级，不展示具体百分比（源码未提供静态概率）。
- 若 PRD 要求必须展示概率，需要人工定义各 tier 的权重比例或从游戏逻辑中推导。

### 3.8 生态区遭遇记录 (Biome Encounter) — 更新版

**来源文件：** `source/pokerogue/src/data/balance/biomes/*.ts` → `pokemonPool`
**概率推导来源：** `source/pokerogue/src/field/arena.ts` → `generateNonBossBiomeTier()` / `generateBossBiomeTier()`

| 目标字段 | 源码字段 | 类型 | 转换规则 | 缺失处理 |
|---------|---------|------|---------|---------|
| `biomeId` | `BiomeId` | number | 直接使用 | 无 |
| `poolTier` | `BiomePoolTier` | enum | COMMON/UNCOMMON/RARE/SUPER_RARE/ULTRA_RARE/BOSS/BOSS_RARE/BOSS_SUPER_RARE/BOSS_ULTRA_RARE | 无 |
| `timeOfDay` | `TimeOfDay` | enum | DAWN/DAY/DUSK/NIGHT/ALL | 无 |
| `speciesId` | `SpeciesId` | number | 直接使用 | 无 |
| `isBoss` | poolTier 是否以 BOSS 开头 | boolean | 自动计算 | false |
| `rarity` | poolTier 映射 | string | 见下表 | 无 |
| `tierProbability` | 推导值 | number | 该 tier 的整体概率（%） | 无 |
| `individualProbability` | 推导值 | number | 该精灵在该 tier 内的均分概率（%） | 无 |

**非 Boss 遭遇池 Tier 概率：**

| BiomePoolTier | 数值范围 | Tier 概率 | 说明 |
|--------------|---------|----------|------|
| COMMON | 156-511 | **69.53%** | 356/512 |
| UNCOMMON | 32-155 | **24.22%** | 124/512 |
| RARE | 6-31 | **5.08%** | 26/512 |
| SUPER_RARE | 1-5 | **0.98%** | 5/512 |
| ULTRA_RARE | 0 | **0.20%** | 1/512 |

**Boss 遭遇池 Tier 概率：**

| BiomePoolTier | 数值范围 | Tier 概率 | 说明 |
|--------------|---------|----------|------|
| BOSS | 20-63 | **68.75%** | 44/64 |
| BOSS_RARE | 6-19 | **21.88%** | 14/64 |
| BOSS_SUPER_RARE | 1-5 | **7.81%** | 5/64 |
| BOSS_ULTRA_RARE | 0 | **1.56%** | 1/64 |

**单个精灵概率计算：**
```
individualProbability = tierProbability / 该 tier 该时间段的精灵数量
```

**示例（Forest 生态区白天）：**

| Tier | 精灵数量 | Tier 概率 | 单个精灵均分概率 |
|------|---------|----------|----------------|
| COMMON | 7只 | 69.53% | ~9.93% |
| UNCOMMON | 3只 | 24.22% | ~8.07% |
| RARE | 2只 | 5.08% | ~2.54% |
| SUPER_RARE | 0只 | 0.98% | - |
| ULTRA_RARE | 0只 | 0.20% | - |

**注意：**
- 概率是 **tier 级别**的，同一 tier 内所有精灵均分该 tier 概率
- 时间段（DAWN/DAY/DUSK/NIGHT/ALL）是**独立计算**的
- Boss 和非 Boss 是**独立池子**
- 实际游戏中还受 `luckValue` 影响，静态数据无法体现

---

### 3.9 进化 (Evolution)

**来源文件：** `source/pokerogue/src/data/balance/pokemon-evolutions.ts`

| 目标字段 | 源码字段 | 类型 | 转换规则 | 缺失处理 |
|---------|---------|------|---------|---------|
| `fromSpeciesId` | 进化前物种 | number | 直接使用 | 无 |
| `toSpeciesId` | 进化后物种 | number | 直接使用 | 无 |
| `condition` | `EvoCondKey` + 参数 | object | 见下表 | 无 |
| `evolutionItem` | `EvolutionItem` | enum | 映射为中文道具名 | null |

**进化条件类型：**

| EvoCondKey | 说明 |
|-----------|------|
| FRIENDSHIP | 亲密度 |
| TIME | 时间段 |
| MOVE | 学会特定技能 |
| MOVE_TYPE | 学会特定类型技能 |
| PARTY_TYPE | 队伍中有特定类型 |
| LEVEL | 等级 |
| ITEM | 使用道具 |
| GENDER | 性别 |

---

### 3.10 费用 (Cost)

**来源文件：** `source/pokerogue/src/data/balance/starters.ts`

| 目标字段 | 源码字段 | 类型 | 转换规则 | 缺失处理 |
|---------|---------|------|---------|---------|
| `speciesId` | `SpeciesId` | number | 直接使用 | 无 |
| `cost` | 费用值 | number | 直接使用 | null |

**注意：** 只有 `isStarterSelectable = true` 的精灵才有费用。非初始精灵费用为 null。

---

## 4. 中文映射规则

### 4.1 映射键生成规则

| 实体类型 | 键生成规则 | 示例 |
|---------|-----------|------|
| 精灵名 | camelCase(英文名) | "Pikachu" → "pikachu" |
| 技能名 | camelCase(英文名) | "Thunder Punch" → "thunderPunch" |
| 特性名 | camelCase(英文名) | "Static" → "static" |
| 形态名 | `{speciesCamelCase}{formKeyPascalCase}` | "pikachuCosplay", "pikachuPartner" |
| 地区名 | camelCase(英文名) | "Forest" → "forest" |
| 稀有度 | 直接使用英文键 | "common", "rare" |

### 4.2 映射覆盖率统计

按实体类型分别统计：
- 精灵 (pokemon)
- 形态 (pokemon-form)
- 属性 (type) — 需额外映射表
- 技能 (move)
- 特性 (ability)
- 地区 (biome)
- 稀有度 (rarity)
- 技能来源类型 (move-source)

---

## 5. 数据校验规则

### 5.1 必填字段校验

| 数据类型 | 必填字段 |
|---------|---------|
| 精灵 | id, nameEn, type1, baseTotal, baseHp, baseAtk, baseDef, baseSpatk, baseSpdef, baseSpd |
| 生态区 | id, nameEn |
| 遭遇记录 | biomeId, poolTier, timeOfDay, speciesId |
| 技能 | id, nameEn, type, category, pp |
| 特性 | id, nameEn |

### 5.2 关联校验

- 遭遇记录中的 `speciesId` 必须在精灵表中存在
- 技能记录中的 `moveId` 必须在技能表中存在
- 特性记录中的 `abilityId` 必须在特性表中存在
- 进化记录中的 `fromSpeciesId` 和 `toSpeciesId` 必须在精灵表中存在

### 5.3 值域校验

- 种族值各维度：0-255
- 概率字段：非负数
- 费用：正整数或 null
- 时间段：day/night/dusk/all
- 遭遇池类型：normal/boss

---

## 6. 缺失字段处理策略

| 场景 | 处理方式 |
|------|---------|
| 中文名缺失 | 回退英文名，标记为未映射 |
| 第二属性缺失 | null |
| 第二特性缺失 | null（源码中 ability2 === AbilityId.NONE 时） |
| 隐藏特性缺失 | null（源码中 abilityHidden === AbilityId.NONE 时） |
| 被动缺失 | null |
| 蛋招缺失 | 空数组 [] |
| 等级技能缺失 | 空数组 [] |
| 费用缺失（非初始精灵） | null |
| 形态缺失 | 空数组 [] |
| 进化信息缺失 | 空数组 [] |

---

## 7. 数据提取脚本方案

### 7.1 技术选型

- **语言：** TypeScript (Node.js)
- **AST 解析：** ts-morph 或 TypeScript Compiler API
- **输出：** JSON 文件

### 7.2 脚本列表

| 脚本 | 功能 | 输出文件 |
|------|------|---------|
| `extract-pokemon.mjs` | 提取精灵基础数据、形态、进化、技能、蛋招、费用、被动 | `pokemon.json` |
| `extract-biomes.mjs` | 提取生态区和遭遇记录 | `biomes.json` |
| `extract-species-ids.mjs` | 提取物种数字 ID 与内部 ID 映射 | `species-ids.json` |
| `build-name-maps.mjs` | 构建中文映射表（特性、技能、生态区） | `name-maps.json` |
| `rebuild-all.mjs` | 全量重建：依次调用以上脚本 + 生成道具清单数据 | `pokemon.json`, `biomes.json`, `name-maps.json`, `species-ids.json`, `items.json`, `data-report.json` |

**注意：** 脚本全部使用 `.mjs`（ES Modules），运行环境为 Node.js，直接通过字符串正则 + 对象遍历从本地 `source/` 目录提取数据，不依赖 ts-morph 或 AST 解析。旧版 `extract-pokemon.ts`、`extract-biomes.ts`、`extract-all.ts` 已于 2026-06-19 清理删除。

### 7.3 提取策略

由于源码使用大量枚举和类，实际采用**简化的直接提取策略：**

- **枚举提取：** 使用正则匹配提取 `SpeciesId`, `MoveId`, `AbilityId`, `BiomeId` 等枚举定义
- **对等文件遍历：** 对 `pokemon-species.ts` 等类文件，通过读取对应 balance 目录下各世代文件（如 `generation-01.ts` ~ `generation-09.ts`）中的物种定义，结合正则提取各字段
- **简单对象提取：** 对于 `speciesEggMoves`, `pokemonPool`, `init-modifier-pools` 等简单对象，直接正则匹配提取
- **不依赖 ts-morph 或 TypeScript Compiler API**，运行环境为纯 Node.js 无额外依赖

---

## 8. 风险与待确认事项

| 序号 | 问题 | 影响 | 状态 | 应对方案 |
|------|------|------|------|---------|
| 1 | 生态区无静态概率数据 | 无法展示具体百分比 | ✅ 已解决 | 通过 `arena.ts` 逻辑推导 tier 概率并计算个体均分概率 |
| 2 | 形态名中文映射（battleForm） | primal/gigantamax 回退英文 | ✅ 已解决 | 加载时展平 `battleForm` 子对象到顶层 |
| 3 | 被动能力数据来源 | 需运行时获取 | ✅ 已解决 | 从 `generation-*.ts` 物种定义的 `passiveAbility` 字段直接提取 |
| 4 | 形态属性/种族值前端联动 | 详情页种族值不随形态切换 | ✅ 已解决 | 新增 `selectedFormIndex` 状态，条形图读取当前选中形态的属性值 |
| 5 | 地区形态（Alola/Galar/Hisui/Paldea）的 ID 分配 | SpeciesId 可能 > 2000 | 持续关注 | Region 通过 `Math.floor(id / 2000)` 计算 |
| 6 | 道具动态图标（MINT/TM/BERRY 等） | atlas 无对应 key | ✅ 已解决 | 采用 representative icon + fallback 策略，缺失时显示占位态 |

---

## 9. 下一步行动

1. ✅ 完成字段映射表（本文件）
2. ✅ 编写数据提取脚本（`scripts/` 目录）
3. ✅ 提取 5 只精灵 + 2 个地区样本验证
4. ✅ 生成全量数据
5. ✅ 开始页面开发
6. ✅ 页面功能持续迭代（属性克制、道具清单、配招推荐等）
7. ✅ 代码结构优化（CSS 拆分、工具函数抽取）
