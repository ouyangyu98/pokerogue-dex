import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getPokemonMeta } from '../seo/generateMeta'
import { buildPokemonSchema, buildBreadcrumbList } from '../seo/schemaBuilders'
import { renderTypeBadge, renderStatBar, formatLevel, renderMoveCategoryBadge } from '../utils/render'
import { normalizeChainMap, buildEvolutionPaths } from '../utils/pokemon'
import { getCombinedDefenseBuckets } from '../typeMatchups'
import type { Pokemon } from '../types'

interface NameMaps {
  moveEffect: Record<string, string>
  abilityDescription: Record<string, string>
}

export default function PokemonDetailPage() {
  const { id } = useParams()
  const [pokemons, setPokemons] = useState<Pokemon[]>([])
  const [nameMaps, setNameMaps] = useState<NameMaps | null>(null)
  const [loading, setLoading] = useState(true)
  const [moveTab, setMoveTab] = useState<'level' | 'egg'>('level')

  useEffect(() => {
    Promise.all([
      fetch('/data/pokemon.json').then(r => r.json()),
      fetch('/data/name-maps.json').then(r => r.json()),
    ])
      .then(([pData, nmData]: [Pokemon[], NameMaps]) => {
        setPokemons(pData)
        setNameMaps(nmData)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const pokemon = useMemo(() => pokemons.find(p => p.id === id), [pokemons, id])
  const pokemonMap = useMemo(() => new Map(pokemons.map(p => [p.id, p])), [pokemons])
  const evolutionGraph = useMemo(() => normalizeChainMap(pokemons), [pokemons])

  if (loading) return <div className="loading">加载中...</div>
  if (!pokemon) return <div className="loading">未找到该宝可梦</div>

  const meta = getPokemonMeta(pokemon)
  const buckets = getCombinedDefenseBuckets(pokemon.type1, pokemon.type2)
  const evoPaths = buildEvolutionPaths(pokemon.id, pokemonMap, evolutionGraph.evolvesTo, evolutionGraph.evolvesFrom)

  const moveEffectMap = nameMaps?.moveEffect || {}
  const abilityDescMap = nameMaps?.abilityDescription || {}

  const hasLevelMoves = pokemon.levelMoves && pokemon.levelMoves.length > 0
  const hasEggMoves = pokemon.eggMoves && pokemon.eggMoves.length > 0
  const activeTab = moveTab === 'level' && hasLevelMoves ? 'level'
    : moveTab === 'egg' && hasEggMoves ? 'egg'
    : hasLevelMoves ? 'level'
    : 'egg'

  return (
    <div className="pokemon-detail-page">
      <SEOMeta
        title={meta.title}
        description={meta.description}
        path={`/pokemon/${pokemon.id}`}
        keywords={meta.keywords}
      />
      <JsonLd
        data={[
          ...buildPokemonSchema(pokemon),
          buildBreadcrumbList([
            { name: '首页', path: '/' },
            { name: '精灵图鉴', path: '/pokemon' },
            { name: pokemon.nameZh, path: `/pokemon/${pokemon.id}` },
          ]),
        ]}
      />

      <div className="detail-breadcrumb">
        <Link to="/pokemon" className="back-link">← 返回精灵图鉴</Link>
      </div>

      {/* === Hero === */}
      <section className="dp-hero">
        <div className="dp-hero-sprite">
          <span className="dp-hero-sprite-num">#{pokemon.numericId}</span>
        </div>
        <div className="dp-hero-main">
          <div className="dp-hero-title">
            <span className="dp-hero-name">{pokemon.nameZh}</span>
            <span className="dp-hero-en">{pokemon.nameEn}</span>
            <span className="dp-hero-num">#{pokemon.numericId}</span>
          </div>
          <div className="dp-hero-tags">
            {renderTypeBadge(pokemon.type1)}
            {pokemon.type2 && renderTypeBadge(pokemon.type2)}
            <span className="dp-tag-gen">第 {pokemon.generation} 世代</span>
            {pokemon.starterCost != null && <span className="dp-tag-cost">费用 {pokemon.starterCost}</span>}
            {pokemon.isFinalEvolution && <span className="dp-tag-final">最终形态</span>}
          </div>
        </div>
        <div className="dp-hero-info">
          <div className="dp-info-item"><span className="dp-info-label">捕捉率</span><span className="dp-info-value">{(pokemon.catchProbability * 100).toFixed(1)}%</span></div>
          <div className="dp-info-item"><span className="dp-info-label">捕获率</span><span className="dp-info-value">{pokemon.catchRate}</span></div>
          {pokemon.eggTier && <div className="dp-info-item"><span className="dp-info-label">蛋招层级</span><span className="dp-info-value">{pokemon.eggTier}</span></div>}
          <div className="dp-info-item"><span className="dp-info-label">最终形态</span><span className="dp-info-value">{pokemon.isFinalEvolution ? '是' : '否'}</span></div>
        </div>
      </section>

      {/* === 3-column grid === */}
      <div className="dp-layout">
        {/* Row 1: Stats | Abilities | Evo + Biomes */}
        <div className="dp-card">
          <h3 className="dp-card-title">种族值</h3>
          <div className="dp-stat-grid">
            {renderStatBar('HP', pokemon.baseHp, '#FF5959')}
            {renderStatBar('攻击', pokemon.baseAtk, '#F5AC78')}
            {renderStatBar('防御', pokemon.baseDef, '#FAE078')}
            {renderStatBar('特攻', pokemon.baseSpatk, '#9DB7F5')}
            {renderStatBar('特防', pokemon.baseSpdef, '#A7DB8D')}
            {renderStatBar('速度', pokemon.baseSpd, '#FA92B2')}
          </div>
          <div className="dp-stat-total">
            <span>总和</span>
            <span className="dp-stat-total-value">{pokemon.baseTotal}</span>
          </div>
        </div>

        <div className="dp-card">
          <h3 className="dp-card-title">特性与被动</h3>
          <div className="dp-ability-list">
            {pokemon.ability1 && pokemon.ability1 !== 'NONE' && (
              <div className="dp-ability-item">
                <span className="dp-ability-label">特性</span>
                <span className="dp-ability-name-wrap">
                  <span className="dp-ability-name" data-desc={abilityDescMap[pokemon.ability1] || ''}>
                    {pokemon.ability1Zh}
                    <span className="dp-ability-en">{pokemon.ability1}</span>
                  </span>
                </span>
              </div>
            )}
            {pokemon.ability2 && pokemon.ability2 !== 'NONE' && (
              <div className="dp-ability-item">
                <span className="dp-ability-label">特性</span>
                <span className="dp-ability-name-wrap">
                  <span className="dp-ability-name" data-desc={abilityDescMap[pokemon.ability2] || ''}>
                    {pokemon.ability2Zh}
                    <span className="dp-ability-en">{pokemon.ability2}</span>
                  </span>
                </span>
              </div>
            )}
            {pokemon.abilityHidden && pokemon.abilityHidden !== 'NONE' && (
              <div className="dp-ability-item">
                <span className="dp-ability-label">隐藏</span>
                <span className="dp-ability-name-wrap">
                  <span className="dp-ability-name" data-desc={abilityDescMap[pokemon.abilityHidden] || ''}>
                    {pokemon.abilityHiddenZh}
                    <span className="dp-ability-en">{pokemon.abilityHidden}</span>
                  </span>
                </span>
              </div>
            )}
            {pokemon.passive && pokemon.passive !== 'NONE' && (
              <div className="dp-ability-item">
                <span className="dp-ability-label">被动</span>
                <span className="dp-ability-name-wrap">
                  <span className="dp-ability-name" data-desc={abilityDescMap[pokemon.passive] || ''}>
                    {pokemon.passiveZh}
                    <span className="dp-ability-en">{pokemon.passive}</span>
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="dp-card">
          <h3 className="dp-card-title">进化链</h3>
          {evoPaths.length > 0 ? (
            <div className="dp-evo-chain">
              {evoPaths.map((path, pidx) => (
                <div key={pidx} className="dp-evo-path">
                  {path.map((node, nidx) => (
                    <span key={node.id} className="dp-evo-step">
                      {nidx > 0 && <span className="dp-evo-arrow">→</span>}
                      <Link
                        to={`/pokemon/${node.id}`}
                        className={`dp-evo-node ${node.id === pokemon.id ? 'dp-evo-current' : ''}`}
                      >
                        {node.nameZh}
                      </Link>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="dp-empty">无进化链</p>
          )}
          <h3 className="dp-card-title dp-mt">出现地区 <span className="dp-badge">{pokemon.biomes?.length || 0}处</span></h3>
          {pokemon.biomes && pokemon.biomes.length > 0 ? (
            <div className="dp-biome-list">
              {pokemon.biomes.map(b => (
                <Link key={b.id} to={`/biome/${b.id}`} className="dp-biome-tag">
                  {b.nameZh}
                  {b.rarities && b.rarities.length > 0 && <span className="dp-biome-rarity">{b.rarities.join('、')}</span>}
                </Link>
              ))}
            </div>
          ) : (
            <p className="dp-empty">暂无出现地区</p>
          )}
        </div>

        {/* Row 2: Moves (full width) */}
        <div className="dp-card dp-card-full">
          <div className="dp-card-title-row">
            <h3 className="dp-card-title" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>招式</h3>
            <div className="dp-tab-bar">
              <button
                className={activeTab === 'level' ? 'active' : ''}
                onClick={() => setMoveTab('level')}
                disabled={!hasLevelMoves}
              >等级技能</button>
              <button
                className={activeTab === 'egg' ? 'active' : ''}
                onClick={() => setMoveTab('egg')}
                disabled={!hasEggMoves}
              >蛋招</button>
            </div>
          </div>
          {activeTab === 'level' && hasLevelMoves ? (
            <div className="table-container">
              <table className="dp-moves-table">
                <thead>
                  <tr>
                    <th>等级</th><th>招式</th><th>属性</th><th>分类</th>
                    <th>威力</th><th>命中</th><th>详情</th>
                  </tr>
                </thead>
                <tbody>
                  {pokemon.levelMoves.map((move, idx) => (
                    <tr key={idx}>
                      <td>{formatLevel(move.level)}</td>
                      <td>{move.moveZh}</td>
                      <td>{move.type ? renderTypeBadge(move.type) : '-'}</td>
                      <td>{renderMoveCategoryBadge(move.category)}</td>
                      <td>{move.power ?? '-'}</td>
                      <td>{move.accuracy ?? '-'}</td>
                      <td className="dp-move-desc" title={moveEffectMap[move.moveId] || ''}>
                        {moveEffectMap[move.moveId] || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'egg' && hasEggMoves ? (
            <div className="table-container">
              <table className="dp-moves-table">
                <thead>
                  <tr>
                    <th>招式</th><th>属性</th><th>分类</th>
                    <th>威力</th><th>命中</th><th>详情</th>
                  </tr>
                </thead>
                <tbody>
                  {pokemon.eggMoves.map((move, idx) => (
                    <tr key={idx}>
                      <td>{move.moveZh}</td>
                      <td>{move.type ? renderTypeBadge(move.type) : '-'}</td>
                      <td>{renderMoveCategoryBadge(move.category)}</td>
                      <td>{move.power ?? '-'}</td>
                      <td>{move.accuracy ?? '-'}</td>
                      <td className="dp-move-desc" title={moveEffectMap[move.moveId] || ''}>
                        {moveEffectMap[move.moveId] || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="dp-empty">暂无招式数据</p>
          )}
        </div>

        {/* Row 3: Type Effectiveness (full width) */}
        <div className="dp-card dp-card-full">
          <h3 className="dp-card-title">属性克制关系</h3>
          <div className="dp-effect-grid">
            {buckets.immune.length > 0 && (
              <div className="dp-effect-group dp-effect-immune">
                <div className="dp-effect-head"><span>免疫</span><span>×0</span></div>
                <div className="dp-effect-badges">
                  {buckets.immune.map(item => renderTypeBadge(item.type))}
                </div>
              </div>
            )}
            {buckets.doubleResist.length > 0 && (
              <div className="dp-effect-group dp-effect-resist">
                <div className="dp-effect-head"><span>1/4 抗性</span><span>×0.25</span></div>
                <div className="dp-effect-badges">
                  {buckets.doubleResist.map(item => renderTypeBadge(item.type))}
                </div>
              </div>
            )}
            {buckets.resist.length > 0 && (
              <div className="dp-effect-group dp-effect-resist">
                <div className="dp-effect-head"><span>1/2 抗性</span><span>×0.5</span></div>
                <div className="dp-effect-badges">
                  {buckets.resist.map(item => renderTypeBadge(item.type))}
                </div>
              </div>
            )}
            {buckets.weak.length > 0 && (
              <div className="dp-effect-group dp-effect-weak">
                <div className="dp-effect-head"><span>2倍弱点</span><span>×2</span></div>
                <div className="dp-effect-badges">
                  {buckets.weak.map(item => renderTypeBadge(item.type))}
                </div>
              </div>
            )}
            {buckets.quadWeak.length > 0 && (
              <div className="dp-effect-group dp-effect-weak">
                <div className="dp-effect-head"><span>4倍弱点</span><span>×4</span></div>
                <div className="dp-effect-badges">
                  {buckets.quadWeak.map(item => renderTypeBadge(item.type))}
                </div>
              </div>
            )}
            {buckets.immune.length === 0 && buckets.doubleResist.length === 0 && buckets.resist.length === 0 && buckets.weak.length === 0 && buckets.quadWeak.length === 0 && (
              <p className="dp-empty">无明显克制关系</p>
            )}
          </div>
        </div>

        {/* Forms */}
        {pokemon.forms && pokemon.forms.length > 0 && (
          <div className="dp-card dp-card-full">
            <h3 className="dp-card-title">形态（{pokemon.forms.length} 种）</h3>
            <div className="form-grid">
              {pokemon.forms.map((form, idx) => (
                <div key={idx} className="form-card">
                  <div className="form-card-header">
                    <span className="form-name">{form.formNameZh}</span>
                    <span className="form-key">{form.formKey}</span>
                  </div>
                  <div className="form-types">
                    {renderTypeBadge(form.type1)}
                    {form.type2 && renderTypeBadge(form.type2)}
                  </div>
                  <div className="form-stats">
                    <span>HP {form.baseHp}</span>
                    <span>攻击 {form.baseAtk}</span>
                    <span>防御 {form.baseDef}</span>
                    <span>特攻 {form.baseSpatk}</span>
                    <span>特防 {form.baseSpdef}</span>
                    <span>速度 {form.baseSpd}</span>
                    <span>总和 {form.baseTotal}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Smogon Sets */}
        {pokemon.smogonSets && pokemon.smogonSets.length > 0 && (
          <div className="dp-card dp-card-full">
            <h3 className="dp-card-title">推荐配招（Smogon）</h3>
            {pokemon.smogonSets.map(set => (
              <div key={set.name} className="smogon-set">
                <h3>{set.name}</h3>
                <p>{set.description}</p>
                <ul>
                  {set.moves.map(moveId => (
                    <li key={moveId}>{moveId}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
