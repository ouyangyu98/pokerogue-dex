import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CSSProperties } from 'react'
import type { TypeMatchupItem } from '../types'
import { SelectFilter } from './filterControls'

interface AtlasFrame {
  filename: string
  frame: {
    x: number
    y: number
    w: number
    h: number
  }
  sourceSize: {
    w: number
    h: number
  }
  spriteSourceSize: {
    x: number
    y: number
    w: number
    h: number
  }
}

interface RawTextureAtlas {
  textures?: Array<{
    image: string
    size: {
      w: number
      h: number
    }
    frames: AtlasFrame[]
  }>
}

interface TextureAtlas {
  imageUrl: string
  width: number
  height: number
  frames: Record<string, AtlasFrame>
}

const REMOTE_ASSET_BASE = 'https://raw.githubusercontent.com/pagefaultgames/pokerogue-assets/beta'
const DEFAULT_ITEM_SOURCE_SIZE = { w: 48, h: 48 }

function normalizeFrameName(filename: string) {
  return filename.replace(/\.png$/i, '')
}

function buildTextureAtlas(raw: RawTextureAtlas, imageBaseUrl: string): TextureAtlas | null {
  const texture = raw.textures?.[0]
  if (!texture || !Array.isArray(texture.frames)) return null

  return {
    imageUrl: `${imageBaseUrl}/${texture.image}`,
    width: texture.size.w,
    height: texture.size.h,
    frames: Object.fromEntries(texture.frames.map(frame => [normalizeFrameName(frame.filename), frame])),
  }
}

function getAtlasSpriteStyle(atlas: TextureAtlas, frame: AtlasFrame, sourceSize: { w: number; h: number }, pixelSize: number): CSSProperties {
  const scale = pixelSize / Math.max(sourceSize.w, sourceSize.h)
  return {
    width: `${Math.round(frame.frame.w * scale)}px`,
    height: `${Math.round(frame.frame.h * scale)}px`,
    backgroundImage: `url(${atlas.imageUrl})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: `${Math.round(-frame.frame.x * scale)}px ${Math.round(-frame.frame.y * scale)}px`,
    backgroundSize: `${Math.round(atlas.width * scale)}px ${Math.round(atlas.height * scale)}px`,
    imageRendering: 'pixelated',
    flex: '0 0 auto',
  }
}

const tierBadgeClassMap: Record<string, string> = {
  COMMON: 'is-common',
  GREAT: 'is-great',
  ULTRA: 'is-ultra',
  ROGUE: 'is-rogue',
  MASTER: 'is-master',
  LUXURY: 'is-luxury',
}

const ALL_TIERS = ['MASTER', 'ROGUE', 'ULTRA', 'GREAT', 'COMMON']

export default function ItemList() {
  const navigate = useNavigate()
  const [items, setItems] = useState<TypeMatchupItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [itemsError, setItemsError] = useState<string | null>(null)
  const [itemAtlas, setItemAtlas] = useState<TextureAtlas | null>(null)
  const [itemAtlasReady, setItemAtlasReady] = useState(false)
  const [selectedTier, setSelectedTier] = useState('')

  useEffect(() => {
    let cancelled = false

    fetch(`${REMOTE_ASSET_BASE}/images/items.json`)
      .then(async response => {
        if (!response.ok) {
          throw new Error('道具图集元数据加载失败')
        }
        return response.json()
      })
      .then((raw: RawTextureAtlas) => {
        if (cancelled) return
        setItemAtlas(buildTextureAtlas(raw, `${REMOTE_ASSET_BASE}/images`))
      })
      .catch(error => {
        if (cancelled) return
        console.error('Failed to load item atlas:', error)
        setItemAtlas(null)
      })
      .finally(() => {
        if (!cancelled) {
          setItemAtlasReady(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    fetch('/data/items.json')
      .then(async response => {
        if (!response.ok) {
          throw new Error('道具数据加载失败')
        }
        return response.json()
      })
      .then((data: TypeMatchupItem[]) => {
        if (cancelled) return
        setItems(Array.isArray(data) ? data : [])
        setItemsError(null)
      })
      .catch(err => {
        if (cancelled) return
        console.error('Failed to load items:', err)
        setItems([])
        setItemsError('暂时无法加载道具清单')
      })
      .finally(() => {
        if (!cancelled) {
          setItemsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const filteredItems = useMemo(() => {
    if (!selectedTier) return items
    return items.filter(item => item.tier === selectedTier)
  }, [items, selectedTier])

  const groupedItems = useMemo(() => {
    const groups = new Map<string, { tier: string; tierLabel: string; items: TypeMatchupItem[] }>()

    filteredItems.forEach(item => {
      if (!groups.has(item.tier)) {
        groups.set(item.tier, {
          tier: item.tier,
          tierLabel: item.tierLabel,
          items: [],
        })
      }
      groups.get(item.tier)?.items.push(item)
    })

    return Array.from(groups.values()).sort((a, b) => {
      const aOrder = a.items[0]?.sortOrder || 0
      const bOrder = b.items[0]?.sortOrder || 0
      return bOrder - aOrder
    })
  }, [filteredItems])

  const tierFilterOptions = useMemo(() => {
    return [
      { value: '', label: '全部稀有度' },
      ...ALL_TIERS.map(tier => {
        const labelMap: Record<string, string> = {
          MASTER: '大师',
          ROGUE: '肉鸽',
          ULTRA: '超级',
          GREAT: '高级',
          COMMON: '普通',
        }
        const count = items.filter(i => i.tier === tier).length
        return { value: tier, label: `${labelMap[tier] || tier}（${count}）` }
      }),
    ]
  }, [items])

  function renderItemSprite(item: TypeMatchupItem) {
    if (!itemAtlasReady) {
      return <span className="item-sprite-placeholder">图标加载中</span>
    }

    if (!itemAtlas) {
      return <span className="item-sprite-placeholder is-missing">图集不可用</span>
    }

    const primaryFrame = item.iconKey ? itemAtlas.frames[item.iconKey] : null
    const fallbackFrame = item.fallbackIconKey ? itemAtlas.frames[item.fallbackIconKey] : null
    const frame = primaryFrame || fallbackFrame

    if (!frame) {
      return <span className="item-sprite-placeholder is-missing">暂无图标</span>
    }

    const sourceSize = frame.sourceSize || DEFAULT_ITEM_SOURCE_SIZE
    return (
      <span
        className="item-sprite"
        style={getAtlasSpriteStyle(itemAtlas, frame, sourceSize, 44)}
        title={item.nameZh}
        aria-label={`${item.nameZh} 图标`}
      />
    )
  }

  return (
    <div className="item-list-page">
      <div className="item-list-header">
        <h2>商店道具清单</h2>
        <p>整理玩家商店道具池，按稀有度从高到低展示中文名、内部 ID 与用途介绍。</p>
      </div>

      <div className="item-list-card">
        <div className="item-list-card-head">
          <div>
            <span className="type-overview-summary-label">独立清单页</span>
            <h3>按稀有度分组浏览</h3>
          </div>
          <span className="type-item-rail-count">{filteredItems.length} 项</span>
        </div>
        <p className="type-item-rail-desc">
          这里单独展示商店道具，方便从顶部导航直接进入查看，不再占用属性克制页主体空间。
        </p>

        <div className="item-list-toolbar">
          <SelectFilter
            label="稀有度筛选"
            emptyLabel="全部稀有度"
            value={selectedTier}
            options={tierFilterOptions}
            onChange={setSelectedTier}
            minWidth={160}
          />
        </div>

        {itemsLoading ? (
          <div className="type-item-rail-state">道具清单加载中...</div>
        ) : itemsError ? (
          <div className="type-item-rail-state is-error">{itemsError}</div>
        ) : (
          <div className="item-list-groups">
            {groupedItems.map(group => (
              <section key={group.tier} className="type-item-tier-group">
                <div className="type-item-tier-header">
                  <span className={`type-item-tier-badge ${tierBadgeClassMap[group.tier] || ''}`}>
                    {group.tierLabel}
                  </span>
                  <span className="type-item-tier-count">{group.items.length} 项</span>
                </div>
                <div className="item-list-table">
                  <div className="item-list-table-head">
                    <div className="item-list-th item-list-col-icon">图标</div>
                    <div className="item-list-th item-list-col-name">中文名</div>
                    <div className="item-list-th item-list-col-id">内部 ID</div>
                    <div className="item-list-th item-list-col-tier">稀有度</div>
                    <div className="item-list-th item-list-col-desc">用途说明</div>
                  </div>
                  {group.items.map(item => (
                    <div key={item.id} className="item-list-tr" onClick={() => navigate(`/item/${item.id}`)} style={{ cursor: 'pointer' }}>
                      <div className="item-list-td item-list-col-icon">
                        <div className="item-list-sprite-wrap">{renderItemSprite(item)}</div>
                      </div>
                      <div className="item-list-td item-list-col-name">
                        <strong>{item.nameZh}</strong>
                      </div>
                      <div className="item-list-td item-list-col-id">
                        <code>{item.id}</code>
                      </div>
                      <div className="item-list-td item-list-col-tier">
                        <span className={`type-item-tier-badge ${tierBadgeClassMap[item.tier] || ''}`}>
                          {item.tierLabel}
                        </span>
                      </div>
                      <div className="item-list-td item-list-col-desc">
                        <span className="item-list-desc-text">{item.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
            {groupedItems.length === 0 && (
              <div className="type-item-rail-state">暂无匹配道具</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
