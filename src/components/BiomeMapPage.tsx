import { useState, useMemo, useCallback } from 'react'
import '../styles/biome-map.css'

// ===== 生态区数据 =====
interface BiomeNode {
  id: string
  nameZh: string
  nameEn: string
  x: number
  y: number
  color: string
  type: string
}

interface BiomeLink {
  from: string
  to: string
  weight?: number
}

// 生态区节点数据（手动布局，基于游戏内地理位置）
const biomeNodes: BiomeNode[] = [
  // 0步 - 起点
  { id: 'TOWN', nameZh: '城镇', nameEn: 'town', x: 400, y: 50, color: '#fbbf24', type: 'normal' },

  // 1步
  { id: 'PLAINS', nameZh: '平原', nameEn: 'plains', x: 400, y: 130, color: '#a3e635', type: 'grass' },

  // 2步
  { id: 'GRASS', nameZh: '草地', nameEn: 'grass', x: 280, y: 210, color: '#4ade80', type: 'grass' },
  { id: 'LAKE', nameZh: '湖泊', nameEn: 'lake', x: 400, y: 210, color: '#60a5fa', type: 'water' },
  { id: 'METROPOLIS', nameZh: '城市', nameEn: 'metropolis', x: 520, y: 210, color: '#a78bfa', type: 'city' },

  // 3步
  { id: 'TALL_GRASS', nameZh: '高草丛', nameEn: 'tall_grass', x: 200, y: 290, color: '#22c55e', type: 'grass' },
  { id: 'BEACH', nameZh: '沙滩', nameEn: 'beach', x: 320, y: 290, color: '#fde047', type: 'sand' },
  { id: 'SWAMP', nameZh: '沼泽', nameEn: 'swamp', x: 440, y: 290, color: '#84cc16', type: 'poison' },
  { id: 'SLUM', nameZh: '陋巷', nameEn: 'slum', x: 560, y: 290, color: '#78716c', type: 'dark' },
  { id: 'CONSTRUCTION_SITE', nameZh: '工地', nameEn: 'construction_site', x: 680, y: 290, color: '#fb923c', type: 'ground' },

  // 4步
  { id: 'FOREST', nameZh: '森林', nameEn: 'forest', x: 120, y: 370, color: '#16a34a', type: 'grass' },
  { id: 'SEA', nameZh: '海洋', nameEn: 'sea', x: 240, y: 370, color: '#3b82f6', type: 'water' },
  { id: 'GRAVEYARD', nameZh: '墓地', nameEn: 'graveyard', x: 360, y: 370, color: '#71717a', type: 'ghost' },
  { id: 'CAVE', nameZh: '洞窟', nameEn: 'cave', x: 480, y: 370, color: '#57534e', type: 'rock' },
  { id: 'DOJO', nameZh: '道场', nameEn: 'dojo', x: 600, y: 370, color: '#dc2626', type: 'fighting' },
  { id: 'POWER_PLANT', nameZh: '发电厂', nameEn: 'power_plant', x: 720, y: 370, color: '#facc15', type: 'electric' },

  // 5步
  { id: 'JUNGLE', nameZh: '丛林', nameEn: 'jungle', x: 80, y: 450, color: '#15803d', type: 'grass' },
  { id: 'ISLAND', nameZh: '岛屿', nameEn: 'island', x: 200, y: 450, color: '#06b6d4', type: 'water' },
  { id: 'ABYSS', nameZh: '幽谷深渊', nameEn: 'abyss', x: 320, y: 450, color: '#312e81', type: 'dark' },
  { id: 'SEABED', nameZh: '海底', nameEn: 'seabed', x: 440, y: 450, color: '#1e40af', type: 'water' },
  { id: 'LABORATORY', nameZh: '研究所', nameEn: 'laboratory', x: 560, y: 450, color: '#c084fc', type: 'psychic' },
  { id: 'FACTORY', nameZh: '工厂', nameEn: 'factory', x: 680, y: 450, color: '#9ca3af', type: 'steel' },
  { id: 'MEADOW', nameZh: '花丛', nameEn: 'meadow', x: 800, y: 450, color: '#f472b6', type: 'fairy' },

  // 6步
  { id: 'TEMPLE', nameZh: '神殿', nameEn: 'temple', x: 80, y: 530, color: '#b45309', type: 'ground' },
  { id: 'VOLCANO', nameZh: '火山', nameEn: 'volcano', x: 200, y: 530, color: '#ef4444', type: 'fire' },
  { id: 'ICE_CAVE', nameZh: '寒冰洞窟', nameEn: 'ice_cave', x: 320, y: 530, color: '#67e8f9', type: 'ice' },
  { id: 'SNOWY_FOREST', nameZh: '冰雪森林', nameEn: 'snowy_forest', x: 440, y: 530, color: '#a5f3fc', type: 'ice' },
  { id: 'MOUNTAIN', nameZh: '山脉', nameEn: 'mountain', x: 560, y: 530, color: '#92400e', type: 'rock' },
  { id: 'RUINS', nameZh: '遗迹', nameEn: 'ruins', x: 680, y: 530, color: '#d6d3d1', type: 'rock' },
  { id: 'FAIRY_CAVE', nameZh: '妖精洞窟', nameEn: 'fairy_cave', x: 800, y: 530, color: '#f9a8d4', type: 'fairy' },

  // 7步
  { id: 'DESERT', nameZh: '沙漠', nameEn: 'desert', x: 200, y: 610, color: '#d97706', type: 'ground' },
  { id: 'BADLANDS', nameZh: '不毛之地', nameEn: 'badlands', x: 320, y: 610, color: '#b91c1c', type: 'ground' },
  { id: 'SPACE', nameZh: '太空', nameEn: 'space', x: 560, y: 610, color: '#1e1b4b', type: 'psychic' },
  { id: 'WASTELAND', nameZh: '荒地', nameEn: 'wasteland', x: 680, y: 610, color: '#7c2d12', type: 'poison' },

  // 终点
  { id: 'END', nameZh: '终点', nameEn: 'end', x: 400, y: 690, color: '#000000', type: 'normal' },
]

// 连接关系（基于源码提取，weight = 概率分母，undefined = 100%）
const biomeLinks: BiomeLink[] = [
  { from: 'TOWN', to: 'PLAINS' },
  { from: 'PLAINS', to: 'GRASS' },
  { from: 'PLAINS', to: 'LAKE' },
  { from: 'PLAINS', to: 'METROPOLIS' },
  { from: 'GRASS', to: 'TALL_GRASS' },
  { from: 'LAKE', to: 'BEACH' },
  { from: 'LAKE', to: 'SWAMP' },
  { from: 'LAKE', to: 'CONSTRUCTION_SITE' },
  { from: 'METROPOLIS', to: 'SLUM' },
  { from: 'TALL_GRASS', to: 'FOREST' },
  { from: 'TALL_GRASS', to: 'CAVE' },
  { from: 'BEACH', to: 'SEA' },
  { from: 'BEACH', to: 'ISLAND', weight: 2 },
  { from: 'SWAMP', to: 'GRAVEYARD' },
  { from: 'SWAMP', to: 'TALL_GRASS' },
  { from: 'SLUM', to: 'CONSTRUCTION_SITE' },
  { from: 'SLUM', to: 'SWAMP', weight: 2 },
  { from: 'CONSTRUCTION_SITE', to: 'POWER_PLANT' },
  { from: 'CONSTRUCTION_SITE', to: 'DOJO', weight: 2 },
  { from: 'FOREST', to: 'JUNGLE' },
  { from: 'FOREST', to: 'MEADOW' },
  { from: 'SEA', to: 'SEABED' },
  { from: 'SEA', to: 'ICE_CAVE' },
  { from: 'GRAVEYARD', to: 'ABYSS' },
  { from: 'CAVE', to: 'BADLANDS' },
  { from: 'CAVE', to: 'LAKE' },
  { from: 'CAVE', to: 'LABORATORY', weight: 2 },
  { from: 'DOJO', to: 'PLAINS' },
  { from: 'DOJO', to: 'JUNGLE', weight: 2 },
  { from: 'DOJO', to: 'TEMPLE', weight: 2 },
  { from: 'POWER_PLANT', to: 'FACTORY' },
  { from: 'JUNGLE', to: 'TEMPLE' },
  { from: 'ISLAND', to: 'SEA' },
  { from: 'ABYSS', to: 'CAVE' },
  { from: 'ABYSS', to: 'SPACE', weight: 2 },
  { from: 'ABYSS', to: 'WASTELAND', weight: 2 },
  { from: 'SEABED', to: 'CAVE' },
  { from: 'SEABED', to: 'VOLCANO', weight: 3 },
  { from: 'LABORATORY', to: 'CONSTRUCTION_SITE' },
  { from: 'FACTORY', to: 'PLAINS' },
  { from: 'FACTORY', to: 'LABORATORY', weight: 2 },
  { from: 'MEADOW', to: 'PLAINS' },
  { from: 'MEADOW', to: 'FAIRY_CAVE' },
  { from: 'TEMPLE', to: 'DESERT' },
  { from: 'TEMPLE', to: 'SWAMP', weight: 2 },
  { from: 'TEMPLE', to: 'RUINS', weight: 2 },
  { from: 'VOLCANO', to: 'BEACH' },
  { from: 'VOLCANO', to: 'ICE_CAVE', weight: 3 },
  { from: 'ICE_CAVE', to: 'SNOWY_FOREST' },
  { from: 'SNOWY_FOREST', to: 'FOREST' },
  { from: 'SNOWY_FOREST', to: 'MOUNTAIN', weight: 2 },
  { from: 'SNOWY_FOREST', to: 'LAKE', weight: 2 },
  { from: 'MOUNTAIN', to: 'VOLCANO' },
  { from: 'MOUNTAIN', to: 'WASTELAND', weight: 2 },
  { from: 'MOUNTAIN', to: 'SPACE', weight: 3 },
  { from: 'RUINS', to: 'MOUNTAIN' },
  { from: 'RUINS', to: 'FOREST', weight: 2 },
  { from: 'FAIRY_CAVE', to: 'ICE_CAVE' },
  { from: 'FAIRY_CAVE', to: 'SPACE', weight: 2 },
  { from: 'DESERT', to: 'RUINS' },
  { from: 'DESERT', to: 'CONSTRUCTION_SITE', weight: 2 },
  { from: 'BADLANDS', to: 'DESERT' },
  { from: 'BADLANDS', to: 'MOUNTAIN' },
  { from: 'SPACE', to: 'RUINS' },
  { from: 'WASTELAND', to: 'BADLANDS' },
]

// BFS 找最短路径
function findShortestPath(start: string, end: string): string[] | null {
  if (start === end) return [start]

  const adj = new Map<string, string[]>()
  for (const link of biomeLinks) {
    if (!adj.has(link.from)) adj.set(link.from, [])
    adj.get(link.from)!.push(link.to)
  }

  const queue: [string, string[]][] = [[start, [start]]]
  const visited = new Set<string>([start])

  while (queue.length > 0) {
    const [current, path] = queue.shift()!
    const neighbors = adj.get(current) || []

    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue
      const newPath = [...path, neighbor]
      if (neighbor === end) return newPath
      visited.add(neighbor)
      queue.push([neighbor, newPath])
    }
  }

  return null
}

export default function BiomeMapPage() {
  const [startId, setStartId] = useState<string>('')
  const [endId, setEndId] = useState<string>('')
  const [path, setPath] = useState<string[] | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const nodeMap = useMemo(() => {
    const map = new Map<string, BiomeNode>()
    for (const node of biomeNodes) {
      map.set(node.id, node)
    }
    return map
  }, [])

  const pathSet = useMemo(() => new Set(path || []), [path])
  const pathLinks = useMemo(() => {
    if (!path || path.length < 2) return new Set<string>()
    const links = new Set<string>()
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i]
      const b = path[i + 1]
      links.add(`${a}-${b}`)
      links.add(`${b}-${a}`)
    }
    return links
  }, [path])

  const handleCalculate = useCallback(() => {
    if (!startId || !endId) return
    const result = findShortestPath(startId, endId)
    setPath(result)
  }, [startId, endId])

  const handleNodeClick = useCallback((nodeId: string) => {
    if (!startId) {
      setStartId(nodeId)
    } else if (!endId) {
      setEndId(nodeId)
    } else {
      setStartId(nodeId)
      setEndId('')
      setPath(null)
    }
  }, [startId, endId])

  const getNodeRadius = (nodeId: string) => {
    if (nodeId === startId) return 22
    if (nodeId === endId) return 22
    return 18
  }

  const getNodeStroke = (nodeId: string) => {
    if (nodeId === startId) return '#22c55e'
    if (nodeId === endId) return '#ef4444'
    if (pathSet.has(nodeId)) return '#f59e0b'
    return '#fff'
  }

  const getNodeStrokeWidth = (nodeId: string) => {
    if (nodeId === startId || nodeId === endId) return 4
    if (pathSet.has(nodeId)) return 3
    return 2
  }

  return (
    <div className="biome-map-page">
      <div className="biome-map-header">
        <h2>地区导航</h2>
        <p>选择起点和终点，查看最短路线</p>
      </div>

      <div className="biome-map-controls">
        <div className="biome-map-selectors">
          <div className="biome-map-select-group">
            <label>起点</label>
            <select value={startId} onChange={e => setStartId(e.target.value)}>
              <option value="">请选择起点</option>
              {biomeNodes.map(node => (
                <option key={node.id} value={node.id}>{node.nameZh}</option>
              ))}
            </select>
          </div>
          <div className="biome-map-arrow">→</div>
          <div className="biome-map-select-group">
            <label>终点</label>
            <select value={endId} onChange={e => setEndId(e.target.value)}>
              <option value="">请选择终点</option>
              {biomeNodes.map(node => (
                <option key={node.id} value={node.id}>{node.nameZh}</option>
              ))}
            </select>
          </div>
          <button
            className="biome-map-calc-btn"
            onClick={handleCalculate}
            disabled={!startId || !endId}
          >
            计算路线
          </button>
        </div>

        {path && (
          <div className="biome-map-result">
            <div className="biome-map-result-title">
              路线结果（{path.length - 1} 步）
            </div>
            <div className="biome-map-result-path">
              {path.map((nodeId, i) => {
                const link = i < path.length - 1
                  ? biomeLinks.find(l => l.from === nodeId && l.to === path[i + 1])
                  : null
                const prob = link?.weight ? `${Math.round(100 / link.weight)}%` : '100%'
                return (
                  <span key={nodeId}>
                    <span className="biome-map-result-node">
                      {nodeMap.get(nodeId)?.nameZh}
                      {link && <span className="biome-map-result-prob">（{prob}）</span>}
                    </span>
                    {i < path.length - 1 && <span className="biome-map-result-arrow"> → </span>}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {path === null && startId && endId && (
          <div className="biome-map-result biome-map-result-none">
            无法到达：{nodeMap.get(startId)?.nameZh} → {nodeMap.get(endId)?.nameZh}
          </div>
        )}
      </div>

      <div className="biome-map-container">
        <svg viewBox="0 0 900 750" className="biome-map-svg">
          {/* 连接线 */}
          {biomeLinks.map((link, i) => {
            const fromNode = nodeMap.get(link.from)
            const toNode = nodeMap.get(link.to)
            if (!fromNode || !toNode) return null

            const isPathLink = pathLinks.has(`${link.from}-${link.to}`)
            const isHovered = hoveredNode === link.from || hoveredNode === link.to

            return (
              <line
                key={i}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={isPathLink ? '#f59e0b' : isHovered ? '#94a3b8' : '#cbd5e1'}
                strokeWidth={isPathLink ? 3 : isHovered ? 2 : 1}
                opacity={isPathLink ? 1 : 0.6}
              />
            )
          })}

          {/* 节点 */}
          {biomeNodes.map(node => (
            <g
              key={node.id}
              className="biome-map-node"
              onClick={() => handleNodeClick(node.id)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={getNodeRadius(node.id)}
                fill={node.color}
                stroke={getNodeStroke(node.id)}
                strokeWidth={getNodeStrokeWidth(node.id)}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              />
              <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                fill="#fff"
                fontSize="12"
                fontWeight="bold"
                style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {node.nameZh}
              </text>
              {node.id === startId && (
                <text x={node.x} y={node.y - 28} textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="bold">
                  起点
                </text>
              )}
              {node.id === endId && (
                <text x={node.x} y={node.y - 28} textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">
                  终点
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      <div className="biome-map-legend">
        <div className="biome-map-legend-item">
          <span className="biome-map-legend-dot" style={{ background: '#22c55e' }}></span>
          <span>起点</span>
        </div>
        <div className="biome-map-legend-item">
          <span className="biome-map-legend-dot" style={{ background: '#ef4444' }}></span>
          <span>终点</span>
        </div>
        <div className="biome-map-legend-item">
          <span className="biome-map-legend-dot" style={{ background: '#f59e0b' }}></span>
          <span>路线</span>
        </div>
        <div className="biome-map-legend-item">
          <span className="biome-map-legend-arrow">→</span>
          <span>单向通行</span>
        </div>
      </div>
    </div>
  )
}
