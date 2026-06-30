import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

interface BiomeEncounter {
  speciesId: string
  poolTier: string
  timeOfDay: string
  isBoss: boolean
  rarity: string
  tierProbability: number
  individualProbability: number
}

interface Biome {
  id: string
  nameEn: string
  nameZh: string
  biomeLinks: string[]
  encounters: BiomeEncounter[]
}

const timeNames: Record<string, string> = {
  DAWN: '黎明', DAY: '白天', DUSK: '黄昏', NIGHT: '夜晚', ALL: '全天',
}

const tierOrder = ['COMMON', 'UNCOMMON', 'RARE', 'SUPER_RARE', 'ULTRA_RARE', 'BOSS', 'BOSS_RARE', 'BOSS_SUPER_RARE', 'BOSS_ULTRA_RARE']

export default function BiomeList() {
  const navigate = useNavigate()
  const [biomes, setBiomes] = useState<Biome[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBiome, setSelectedBiome] = useState<Biome | null>(null)
  const [timeFilter, setTimeFilter] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [bossFilter, setBossFilter] = useState<'all' | 'boss' | 'normal'>('all')

  useEffect(() => {
    fetch('/data/biomes.json')
      .then(r => r.json())
      .then((data: Biome[]) => {
        setBiomes(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load biome data:', err)
        setLoading(false)
      })
  }, [])

  const filteredEncounters = useMemo(() => {
    if (!selectedBiome) return []
    return selectedBiome.encounters.filter(e => {
      const matchTime = !timeFilter || e.timeOfDay === timeFilter
      const matchTier = !tierFilter || e.poolTier === tierFilter
      const matchBoss = bossFilter === 'all' ||
        (bossFilter === 'boss' && e.isBoss) ||
        (bossFilter === 'normal' && !e.isBoss)
      return matchTime && matchTier && matchBoss
    }).sort((a, b) => {
      const ia = tierOrder.indexOf(a.poolTier)
      const ib = tierOrder.indexOf(b.poolTier)
      if (ia !== ib) return ia - ib
      return a.individualProbability - b.individualProbability
    })
  }, [selectedBiome, timeFilter, tierFilter, bossFilter])

  const allTiers = useMemo(() => {
    const tiers = new Set<string>()
    biomes.forEach(b => b.encounters.forEach(e => tiers.add(e.poolTier)))
    return Array.from(tiers).sort((a, b) => tierOrder.indexOf(a) - tierOrder.indexOf(b))
  }, [biomes])

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div className="biome-list">
      {!selectedBiome ? (
        <div className="biome-grid">
          <h2>生态区列表</h2>
          <div className="grid">
            {biomes.map(biome => (
              <div
                key={biome.id}
                className="biome-card"
                onClick={() => navigate(`/biome/${biome.id}`)}
              >
                <h3>{biome.nameZh}</h3>
                <p className="biome-id">{biome.id}</p>
                <p className="encounter-count">{biome.encounters.length} 条遭遇记录</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="biome-detail">
          <button className="back-btn" onClick={() => setSelectedBiome(null)}>← 返回列表</button>
          <h2>{selectedBiome.nameZh} <span className="sub">{selectedBiome.id}</span></h2>

          {selectedBiome.biomeLinks.length > 0 && (
            <div className="biome-links">
              <label>连接生态区：</label>
              {selectedBiome.biomeLinks.map(link => (
                <span key={link} className="link-tag">{link}</span>
              ))}
            </div>
          )}

          <div className="encounter-filters">
            <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
              <option value="">全部时间段</option>
              <option value="DAWN">黎明</option>
              <option value="DAY">白天</option>
              <option value="DUSK">黄昏</option>
              <option value="NIGHT">夜晚</option>
              <option value="ALL">全天</option>
            </select>
            <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
              <option value="">全部稀有度</option>
              {allTiers.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select value={bossFilter} onChange={e => setBossFilter(e.target.value as any)}>
              <option value="all">全部</option>
              <option value="normal">普通遭遇</option>
              <option value="boss">Boss</option>
            </select>
            <span className="result-count">共 {filteredEncounters.length} 条</span>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>精灵ID</th>
                  <th>稀有度</th>
                  <th>时间段</th>
                  <th>类型</th>
                  <th>Tier概率</th>
                  <th>个体概率</th>
                </tr>
              </thead>
              <tbody>
                {filteredEncounters.map((e, idx) => (
                  <tr key={idx} className={e.isBoss ? 'boss-row' : ''}>
                    <td>{e.speciesId}</td>
                    <td>{e.rarity}</td>
                    <td>{timeNames[e.timeOfDay] || e.timeOfDay}</td>
                    <td>{e.isBoss ? 'Boss' : '普通'}</td>
                    <td>{e.tierProbability}%</td>
                    <td>{e.individualProbability}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
