import { useMemo, useState } from 'react'
import { buildSingleTypeMatchupRows, getCombinedDefenseBuckets, type CombinedDefenseBuckets, type MatchupTypeKey, typeColors, typeNames } from '../typeMatchups'

type Perspective = 'attack' | 'defense'
type HighlightVariant = 'focus' | 'dim'

const COMMON_TYPE_COMBOS: Array<{
  label: string
  type1: MatchupTypeKey
  type2: MatchupTypeKey
  note: string
}> = [
  { label: '水+地', type1: 'WATER', type2: 'GROUND', note: '常见抗电联防组合' },
  { label: '钢+妖精', type1: 'STEEL', type2: 'FAIRY', note: '高抗性核心组合' },
  { label: '火+钢', type1: 'FIRE', type2: 'STEEL', note: '耐性丰富但怕地面' },
  { label: '恶+飞行', type1: 'DARK', type2: 'FLYING', note: '常见进攻联防思路' },
  { label: '龙+地', type1: 'DRAGON', type2: 'GROUND', note: '高压制输出组合' },
  { label: '水+妖精', type1: 'WATER', type2: 'FAIRY', note: '攻守均衡的泛用组合' },
]

function isSameCombo(
  comboType1: MatchupTypeKey,
  comboType2: MatchupTypeKey,
  targetType1: MatchupTypeKey,
  targetType2: MatchupTypeKey,
) {
  return (
    (comboType1 === targetType1 && comboType2 === targetType2)
    || (comboType1 === targetType2 && comboType2 === targetType1)
  )
}

function renderTypeBadge(type: MatchupTypeKey, active = false) {
  return (
    <span
      className={`type-badge type-overview-badge ${active ? 'type-overview-badge-active' : ''}`}
      style={{ backgroundColor: typeColors[type] || '#888' }}
    >
      {typeNames[type] || type}
    </span>
  )
}

function renderBadgeGroup(
  types: MatchupTypeKey[],
  selectedType: MatchupTypeKey | null,
  onTypeSelect: (type: MatchupTypeKey) => void,
  variant: HighlightVariant,
) {
  if (types.length === 0) {
    return <span className="type-matchup-empty">—</span>
  }

  return (
    <div className="type-matchup-badge-group">
      {types.map(type => {
        const isActive = selectedType === type
        const shouldDim = Boolean(selectedType) && !isActive && variant === 'dim'
        return (
          <button
            key={type}
            type="button"
            className={`type-overview-badge-btn ${isActive ? 'is-active' : ''} ${shouldDim ? 'is-dim' : ''}`}
            onClick={() => onTypeSelect(type)}
            title={`聚焦 ${typeNames[type]}`}
          >
            {renderTypeBadge(type, isActive)}
          </button>
        )
      })}
    </div>
  )
}

function renderBucketGroup(
  title: string,
  items: CombinedDefenseBuckets[keyof CombinedDefenseBuckets],
  selectedType: MatchupTypeKey | null,
  onTypeSelect: (type: MatchupTypeKey) => void,
) {
  return (
    <div className="type-combo-bucket-card">
      <div className="type-combo-bucket-title">{title}</div>
      {items.length > 0 ? (
        <div className="type-matchup-badge-group">
          {items.map(item => {
            const isActive = selectedType === item.type
            return (
              <button
                key={`${title}-${item.type}`}
                type="button"
                className={`type-overview-badge-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => onTypeSelect(item.type)}
                title={`聚焦 ${typeNames[item.type]}`}
              >
                {renderTypeBadge(item.type, isActive)}
                <span className="type-combo-multiplier">{item.multiplier === 0 ? '0倍' : `${item.multiplier}倍`}</span>
              </button>
            )}
          )}
        </div>
      ) : (
        <span className="type-matchup-empty">—</span>
      )}
    </div>
  )
}

export default function TypeMatchupPage() {
  const [perspective, setPerspective] = useState<Perspective>('attack')
  const [selectedType, setSelectedType] = useState<MatchupTypeKey | null>(null)
  const [comboType1, setComboType1] = useState<MatchupTypeKey>('WATER')
  const [comboType2, setComboType2] = useState<MatchupTypeKey>('GROUND')
  const rows = useMemo(() => buildSingleTypeMatchupRows(), [])

  const selectedRow = useMemo(
    () => rows.find(row => row.type === selectedType) || null,
    [rows, selectedType],
  )

  const combinedBuckets = useMemo(
    () => getCombinedDefenseBuckets(comboType1, comboType2),
    [comboType1, comboType2],
  )

  const activePreset = useMemo(
    () => COMMON_TYPE_COMBOS.find(combo => isSameCombo(comboType1, comboType2, combo.type1, combo.type2)) || null,
    [comboType1, comboType2],
  )

  const handleTypeSelect = (type: MatchupTypeKey) => {
    setSelectedType(current => (current === type ? null : type))
  }

  const handlePresetSelect = (type1: MatchupTypeKey, type2: MatchupTypeKey) => {
    setComboType1(type1)
    setComboType2(type2)
  }

  return (
    <div className="type-overview-page">
      <div className="type-overview-header">
        <h2>属性克制关系</h2>
        <p>支持从攻击 / 防御两个视角查看 18 种属性的基础克制关系总览。</p>
      </div>

      <div className="type-overview-summary">
        <div className="type-overview-summary-item">
          <span className="type-overview-summary-label">数据来源</span>
          <span className="type-overview-summary-value">官方本地源码属性克制表 + 官方中文本地化</span>
        </div>
        <div className="type-overview-summary-item">
          <span className="type-overview-summary-label">当前范围</span>
          <span className="type-overview-summary-value">已支持单属性总览 + 双属性防御组合倍率分析</span>
        </div>
      </div>

      <div className="type-combo-section">
        <div className="type-combo-header">
          <div>
            <span className="type-overview-summary-label">双属性组合分析</span>
            <h3>{typeNames[comboType1]} + {typeNames[comboType2]}</h3>
          </div>
          <p>查看双属性组合在防御端的 4 倍、2 倍、1/2、1/4 与免疫分组。</p>
        </div>

        <div className="type-combo-controls">
          <div className="type-combo-select-group">
            <label>属性 1</label>
            <select value={comboType1} onChange={e => setComboType1(e.target.value as MatchupTypeKey)}>
              {rows.map(row => (
                <option key={`combo-type1-${row.type}`} value={row.type}>{row.nameZh}</option>
              ))}
            </select>
          </div>
          <div className="type-combo-plus">+</div>
          <div className="type-combo-select-group">
            <label>属性 2</label>
            <select value={comboType2} onChange={e => setComboType2(e.target.value as MatchupTypeKey)}>
              {rows.map(row => (
                <option key={`combo-type2-${row.type}`} value={row.type}>{row.nameZh}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="type-combo-presets">
          <div className="type-combo-presets-header">
            <span className="type-overview-summary-label">常用组合</span>
            <span className="type-combo-presets-hint">一键切换到常见联防 / 输出组合</span>
          </div>
          <div className="type-combo-preset-list">
            {COMMON_TYPE_COMBOS.map(combo => {
              const isActive = isSameCombo(comboType1, comboType2, combo.type1, combo.type2)
              return (
                <button
                  key={combo.label}
                  type="button"
                  className={`type-combo-preset-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() => handlePresetSelect(combo.type1, combo.type2)}
                  title={combo.note}
                >
                  <span className="type-combo-preset-label">{combo.label}</span>
                  <span className="type-combo-preset-note">{combo.note}</span>
                </button>
              )
            })}
          </div>
          {activePreset && (
            <div className="type-combo-active-note">
              当前快捷组合：<strong>{activePreset.label}</strong> · {activePreset.note}
            </div>
          )}
        </div>

        <div className="type-combo-grid">
          {renderBucketGroup('4倍弱点', combinedBuckets.quadWeak, selectedType, handleTypeSelect)}
          {renderBucketGroup('2倍弱点', combinedBuckets.weak, selectedType, handleTypeSelect)}
          {renderBucketGroup('1/2抗性', combinedBuckets.resist, selectedType, handleTypeSelect)}
          {renderBucketGroup('1/4抗性', combinedBuckets.doubleResist, selectedType, handleTypeSelect)}
          {renderBucketGroup('免疫', combinedBuckets.immune, selectedType, handleTypeSelect)}
        </div>
      </div>

      <div className="type-overview-toolbar">
        <div className="type-overview-switcher" role="tablist" aria-label="属性克制视角切换">
          <button
            type="button"
            className={perspective === 'attack' ? 'active' : ''}
            onClick={() => setPerspective('attack')}
          >
            攻击视角
          </button>
          <button
            type="button"
            className={perspective === 'defense' ? 'active' : ''}
            onClick={() => setPerspective('defense')}
          >
            防御视角
          </button>
        </div>

        <div className="type-overview-selection-panel">
          <span className="type-overview-selection-label">当前聚焦</span>
          {selectedRow ? (
            <div className="type-overview-selection-main">
              {renderTypeBadge(selectedRow.type, true)}
              <button type="button" className="type-overview-clear-btn" onClick={() => setSelectedType(null)}>
                清除聚焦
              </button>
            </div>
          ) : (
            <span className="type-overview-selection-placeholder">点击任意属性 badge 可聚焦查看</span>
          )}
        </div>
      </div>

      <div className="type-overview-table-wrap table-container">
        <table className="type-overview-table">
          <thead>
            <tr>
              <th>属性</th>
              {perspective === 'attack' ? (
                <>
                  <th>克制（2倍）</th>
                  <th>被抵抗（1/2）</th>
                  <th>无效（0倍）</th>
                </>
              ) : (
                <>
                  <th>弱点（2倍）</th>
                  <th>抗性（1/2）</th>
                  <th>免疫（0倍）</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const isSelectedRow = row.type === selectedType
              const shouldDimRow = Boolean(selectedType) && !isSelectedRow
              return (
                <tr key={row.type} className={`${isSelectedRow ? 'type-overview-row-active' : ''} ${shouldDimRow ? 'type-overview-row-dim' : ''}`}>
                  <td className="type-overview-type-cell type-overview-type-cell-sticky">
                    <button type="button" className="type-overview-row-type-btn" onClick={() => handleTypeSelect(row.type)}>
                      <div className="type-overview-type-main">{renderTypeBadge(row.type, isSelectedRow)}</div>
                      <div className="name-en">{row.type}</div>
                    </button>
                  </td>
                  {perspective === 'attack' ? (
                    <>
                      <td>{renderBadgeGroup(row.attack.strongAgainst, selectedType, handleTypeSelect, 'dim')}</td>
                      <td>{renderBadgeGroup(row.attack.resistedBy, selectedType, handleTypeSelect, 'dim')}</td>
                      <td>{renderBadgeGroup(row.attack.noEffectAgainst, selectedType, handleTypeSelect, 'dim')}</td>
                    </>
                  ) : (
                    <>
                      <td>{renderBadgeGroup(row.defense.weakTo, selectedType, handleTypeSelect, 'dim')}</td>
                      <td>{renderBadgeGroup(row.defense.resistantTo, selectedType, handleTypeSelect, 'dim')}</td>
                      <td>{renderBadgeGroup(row.defense.immuneTo, selectedType, handleTypeSelect, 'dim')}</td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedRow && (
        <div className="type-overview-focus-card">
          <div className="type-overview-focus-header">
            <div>
              <span className="type-overview-summary-label">聚焦详情</span>
              <h3>{typeNames[selectedRow.type]} · {perspective === 'attack' ? '攻击视角' : '防御视角'}</h3>
            </div>
            {renderTypeBadge(selectedRow.type, true)}
          </div>
          <div className="type-overview-focus-grid">
            {perspective === 'attack' ? (
              <>
                <div className="type-overview-focus-item">
                  <span className="type-overview-focus-label">克制（2倍）</span>
                  {renderBadgeGroup(selectedRow.attack.strongAgainst, selectedType, handleTypeSelect, 'focus')}
                </div>
                <div className="type-overview-focus-item">
                  <span className="type-overview-focus-label">被抵抗（1/2）</span>
                  {renderBadgeGroup(selectedRow.attack.resistedBy, selectedType, handleTypeSelect, 'focus')}
                </div>
                <div className="type-overview-focus-item">
                  <span className="type-overview-focus-label">无效（0倍）</span>
                  {renderBadgeGroup(selectedRow.attack.noEffectAgainst, selectedType, handleTypeSelect, 'focus')}
                </div>
              </>
            ) : (
              <>
                <div className="type-overview-focus-item">
                  <span className="type-overview-focus-label">弱点（2倍）</span>
                  {renderBadgeGroup(selectedRow.defense.weakTo, selectedType, handleTypeSelect, 'focus')}
                </div>
                <div className="type-overview-focus-item">
                  <span className="type-overview-focus-label">抗性（1/2）</span>
                  {renderBadgeGroup(selectedRow.defense.resistantTo, selectedType, handleTypeSelect, 'focus')}
                </div>
                <div className="type-overview-focus-item">
                  <span className="type-overview-focus-label">免疫（0倍）</span>
                  {renderBadgeGroup(selectedRow.defense.immuneTo, selectedType, handleTypeSelect, 'focus')}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="type-overview-notes">
        <div className="type-overview-note-card">
          <h3>倍率说明</h3>
          <ul>
            <li><strong>2倍：</strong> 克制 / 弱点</li>
            <li><strong>1/2：</strong> 被抵抗 / 抗性</li>
            <li><strong>0倍：</strong> 无效 / 免疫</li>
          </ul>
        </div>
        <div className="type-overview-note-card">
          <h3>说明</h3>
          <ul>
            <li>该页面用于全属性总览，不替代精灵详情页中的个体克制摘要。</li>
            <li>当前已支持双属性防御组合分析与常用组合快捷切换；商店道具已改为顶部独立导航入口。</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
