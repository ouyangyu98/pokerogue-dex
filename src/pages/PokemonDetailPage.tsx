import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getPokemonMeta } from '../seo/generateMeta'
import { buildPokemonSchema, buildBreadcrumbList } from '../seo/schemaBuilders'
import { renderTypeBadge, renderStatBar } from '../utils/render'
import { normalizeChainMap, buildEvolutionPaths } from '../utils/pokemon'
import { getCombinedDefenseMatchups } from '../typeMatchups'
import type { Pokemon } from '../types'

export default function PokemonDetailPage() {
  const { id } = useParams()
  const [pokemons, setPokemons] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/pokemon.json')
      .then(r => r.json())
      .then((data: Pokemon[]) => {
        setPokemons(data)
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
  const matchups = getCombinedDefenseMatchups(pokemon.type1, pokemon.type2)
  const evoPaths = buildEvolutionPaths(pokemon.id, pokemonMap, evolutionGraph.evolvesTo, evolutionGraph.evolvesFrom)
  const typeZh = [pokemon.type1, pokemon.type2]
    .filter(Boolean)
    .map(t => t)
    .join('/')

  return (
    <div className="pokemon-detail-page detail-page">
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

      <Link to="/pokemon" className="back-link">← 返回精灵图鉴</Link>

      <div className="detail-hero">
        <div className="detail-hero-copy">
          <h1>
            {pokemon.nameZh} <span className="sub">{pokemon.nameEn}</span>
          </h1>
          <p className="lead">
            {pokemon.nameZh}（{pokemon.nameEn}）是{typeZh}属性宝可梦，全国图鉴编号 #{pokemon.numericId}，第 {pokemon.generation} 世代登场，种族值总和 {pokemon.baseTotal}。
            {pokemon.isFinalEvolution ? '已是最终形态。' : '还可以进化。'}
          </p>
          <div className="detail-hero-meta">
            <span>#{pokemon.numericId}</span>
            <span>{pokemon.id}</span>
            <span>第 {pokemon.generation} 世代</span>
          </div>
          <div className="detail-hero-types">
            {renderTypeBadge(pokemon.type1)}
            {pokemon.type2 && renderTypeBadge(pokemon.type2)}
          </div>
        </div>
      </div>

      <section className="detail-section">
        <h2>种族值</h2>
        {renderStatBar('HP', pokemon.baseHp, '#FF5959')}
        {renderStatBar('攻击', pokemon.baseAtk, '#F5AC78')}
        {renderStatBar('防御', pokemon.baseDef, '#FAE078')}
        {renderStatBar('特攻', pokemon.baseSpatk, '#9DB7F5')}
        {renderStatBar('特防', pokemon.baseSpdef, '#A7DB8D')}
        {renderStatBar('速度', pokemon.baseSpd, '#FA92B2')}
        {renderStatBar('总计', pokemon.baseTotal, '#888', 720)}
      </section>

      <section className="detail-section">
        <h2>特性与被动</h2>
        <ul>
          <li><strong>特性 1：</strong> {pokemon.ability1Zh}（{pokemon.ability1}）</li>
          {pokemon.ability2 && pokemon.ability2 !== 'NONE' && (
            <li><strong>特性 2：</strong> {pokemon.ability2Zh}（{pokemon.ability2}）</li>
          )}
          {pokemon.abilityHidden && pokemon.abilityHidden !== 'NONE' && (
            <li><strong>隐藏特性：</strong> {pokemon.abilityHiddenZh}（{pokemon.abilityHidden}）</li>
          )}
          {pokemon.passive && pokemon.passive !== 'NONE' && (
            <li><strong>被动：</strong> {pokemon.passiveZh}（{pokemon.passive}）</li>
          )}
        </ul>
      </section>

      <section className="detail-section">
        <h2>出现地区</h2>
        {(pokemon.biomes || []).length > 0 ? (
          <ul className="tag-list">
            {pokemon.biomes.map(b => (
              <li key={b.id}>
                <Link to={`/biome/${b.id}`}>{b.nameZh}</Link>
                {b.rarities && b.rarities.length > 0 && <span className="tag">{b.rarities.join('、')}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p>暂无出现地区数据。</p>
        )}
      </section>

      {evoPaths.length > 0 && (
        <section className="detail-section">
          <h2>进化链</h2>
          {evoPaths.map((path, idx) => (
            <div key={idx} className="evo-path-row">
              {path.map((node, nidx) => (
                <span key={node.id}>
                  {nidx > 0 && <span className="evo-arrow"> → </span>}
                  <Link to={`/pokemon/${node.id}`}>{node.nameZh}</Link>
                </span>
              ))}
            </div>
          ))}
        </section>
      )}

      <section className="detail-section">
        <h2>克制 / 被克制</h2>
        <div className="type-matchup-grid">
          <div>
            <h3>抗性</h3>
            {matchups.effective.length > 0 ? matchups.effective.map(item => (
              <div key={item.type}>{renderTypeBadge(item.type)} ×{item.multiplier}</div>
            )) : <p>无明显抗性</p>}
          </div>
          <div>
            <h3>弱点</h3>
            {matchups.weak.length > 0 ? matchups.weak.map(item => (
              <div key={item.type}>{renderTypeBadge(item.type)} ×{item.multiplier}</div>
            )) : <p>无明显弱点</p>}
          </div>
        </div>
      </section>

      {pokemon.smogonSets && pokemon.smogonSets.length > 0 && (
        <section className="detail-section">
          <h2>推荐配招（Smogon）</h2>
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
        </section>
      )}
    </div>
  )
}
