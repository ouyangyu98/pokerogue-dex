import { useEffect, useMemo, useState } from 'react'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getEventListMeta } from '../seo/generateMeta'
import { buildCollectionPage, buildWebSite } from '../seo/schemaBuilders'
import type { MysteryEncounter } from '../types'

const tierOrder = ['COMMON', 'GREAT', 'ULTRA', 'ROGUE', 'MASTER']

function waveLabel(event: MysteryEncounter) {
  if (event.waveMin == null) return '波次不限'
  if (event.waveMin === event.waveMax) return `第 ${event.waveMin} 波`
  return `第 ${event.waveMin}-${event.waveMax} 波`
}

export default function EventListPage() {
  const [events, setEvents] = useState<MysteryEncounter[]>([])
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState('')
  const meta = getEventListMeta(events.length)

  useEffect(() => {
    fetch('/data/mystery-encounters.json')
      .then(response => response.json())
      .then((data: MysteryEncounter[]) => setEvents(data))
      .catch(() => {})
  }, [])

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return events.filter(event => {
      if (tier && event.tier !== tier) return false
      if (!keyword) return true
      const searchableText = [
        event.id,
        event.nameZh,
        event.description,
        event.query,
        event.tierLabel,
        ...event.eventConditions,
        ...event.biomes.flatMap(biome => [biome.id, biome.nameZh]),
        ...event.options.flatMap(option => [
          option.label,
          option.tooltip,
          option.effectSummary,
          option.disabledTooltip,
          option.selectedText,
          ...option.conditions,
        ]),
      ].join(' ').toLowerCase()
      return searchableText.includes(keyword)
    })
  }, [events, search, tier])

  return (
    <div className="page event-list-page">
      <SEOMeta title={meta.title} description={meta.description} path="/events" keywords={meta.keywords} />
      <JsonLd
        data={[
          buildCollectionPage('PokeRogue 神秘事件表', '/events', events.length, events.slice(0, 12).map(event => event.nameZh)),
          buildWebSite(),
        ]}
      />
      <h1>事件表</h1>
      <p>收录 PokeRogue 神秘事件的触发条件、出现地区和官方中文选项提示。</p>

      <div className="event-list-toolbar">
        <input
          className="search-input"
          type="search"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="搜索事件、内部 ID、选项、效果或触发条件..."
          aria-label="搜索事件、内部 ID、选项、效果或触发条件"
        />
        <select
          className="event-tier-select"
          value={tier}
          onChange={event => setTier(event.target.value)}
          aria-label="按事件稀有度筛选"
        >
          <option value="">全部稀有度</option>
          {tierOrder.map(value => {
            const matchingEvent = events.find(event => event.tier === value)
            return matchingEvent ? <option key={value} value={value}>{matchingEvent.tierLabel}</option> : null
          })}
        </select>
        {(search || tier) && (
          <button type="button" className="reset-btn" onClick={() => { setSearch(''); setTier('') }}>
            清除筛选
          </button>
        )}
      </div>

      <div className="event-list-count">显示 {filteredEvents.length} / {events.length} 个事件</div>
      <div className="event-list">
        {filteredEvents.map(event => (
          <details className="event-entry" key={event.id}>
            <summary>
              <span className="event-entry-main">
                <span className="event-entry-title">{event.nameZh}</span>
                <span className={`event-tier-badge tier-${event.tier.toLowerCase()}`}>{event.tierLabel}</span>
                <span className="event-entry-id">{event.id}</span>
              </span>
              <span className="event-entry-meta">{waveLabel(event)} · {event.biomes.length} 个地区 · {event.options.length} 个选项</span>
            </summary>
            <div className="event-entry-content">
              <p className="event-description">{event.description}</p>
              <dl className="event-info-grid">
                <div>
                  <dt>出现波次</dt>
                  <dd>{waveLabel(event)}</dd>
                </div>
                <div>
                  <dt>逃跑</dt>
                  <dd>{event.fleeAllowed ? '允许' : '不允许'}</dd>
                </div>
                <div>
                  <dt>捕捉</dt>
                  <dd>{event.catchAllowed ? '允许' : '不允许'}</dd>
                </div>
                <div>
                  <dt>出现地区</dt>
                  <dd>{event.biomes.length > 0 ? event.biomes.map(biome => biome.nameZh).join('、') : '当前未启用或未配置地区'}</dd>
                </div>
                {event.eventConditions.length > 0 && (
                  <div className="event-info-wide">
                    <dt>触发条件</dt>
                    <dd>{event.eventConditions.join('；')}</dd>
                  </div>
                )}
              </dl>

              <section className="event-options" aria-label={`${event.nameZh}的选项`}>
                <h2>{event.query || '可选操作'}</h2>
                {event.options.map(option => (
                  <article className="event-option" key={option.index}>
                    <div className="event-option-heading">
                      <span className="event-option-number">{option.index}</span>
                      <h3>{option.label}</h3>
                    </div>
                    <p className="event-option-effect">{option.effectSummary || '官方提示未提供具体效果说明。'}</p>
                    {option.disabledTooltip && <p className="event-option-disabled">不可用时：{option.disabledTooltip}</p>}
                    {option.conditions.length > 0 && <p className="event-option-condition">选项条件：{option.conditions.join('；')}</p>}
                  </article>
                ))}
              </section>
            </div>
          </details>
        ))}
        {events.length > 0 && filteredEvents.length === 0 && (
          <div className="event-empty-state">没有找到匹配的事件或选项。</div>
        )}
      </div>
    </div>
  )
}
