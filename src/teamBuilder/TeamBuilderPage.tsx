import { useState, useEffect } from 'react'
import type { Pokemon } from '../types'
import type { TextureAtlas } from '../utils/atlas'
import { buildTextureAtlas } from '../utils/atlas'
import { useTeamBuilder } from './useTeamBuilder'
import { useTeamAnalysis } from './useTeamAnalysis'
import TeamSlots from './TeamSlots'
import CoverageAnalysis from './CoverageAnalysis'
import DefenseOverview from './DefenseOverview'
import RoleDistribution from './RoleDistribution'
import TeamDataTable from './TeamDataTable'
import GapSuggestions from './GapSuggestions'
import Modal from '../components/Modal'
import type { SavedTeam } from './types'
import '../styles/features/team-builder.css'

const REMOTE_ASSET_BASE = 'https://raw.githubusercontent.com/pagefaultgames/pokerogue-assets/beta'

export default function TeamBuilderPage() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)
  const [iconAtlases, setIconAtlases] = useState<Record<string, TextureAtlas>>({})
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const {
    slots,
    filledCount,
    savedTeams,
    saveModalOpen,
    loadModalOpen,
    setSaveModalOpen,
    setLoadModalOpen,
    addPokemon,
    removePokemon,
    switchForm,
    clearTeam,
    saveTeam,
    loadTeam,
    deleteSavedTeam,
  } = useTeamBuilder()

  const analysis = useTeamAnalysis(slots, pokemons)

  useEffect(() => {
    if (!notice) return undefined
    const timeoutId = window.setTimeout(() => setNotice(''), 3200)
    return () => window.clearTimeout(timeoutId)
  }, [notice])

  const handleSaveTeam = (name: string) => {
    saveTeam(name)
    setNotice(`已保存队伍“${name.trim() || '未命名队伍'}”`)
  }

  const handleLoadTeam = (team: SavedTeam) => {
    loadTeam(team)
    setNotice(`已加载队伍“${team.name}”`)
  }

  const handleDeleteSavedTeam = (id: string) => {
    deleteSavedTeam(id)
    setNotice('已删除保存的队伍')
  }

  const handleClearTeam = () => {
    clearTeam()
    setClearConfirmOpen(false)
    setNotice('已清空当前队伍，已保存的队伍不会受影响')
  }

  // 加载精灵数据
  useEffect(() => {
    fetch('/data/pokemon.json')
      .then(r => r.json())
      .then((data: Pokemon[]) => {
        setPokemons(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load pokemon data:', err)
        setLoading(false)
      })
  }, [])

  // 加载图标图集
  useEffect(() => {
    if (pokemons.length === 0) return
    const generations = Array.from(new Set(pokemons.map(p => p.generation))).sort((a, b) => a - b)

    let cancelled = false
    Promise.all(
      generations.map(async generation => {
        const atlasKey = `pokemon_icons_${generation}`
        const response = await fetch(`${REMOTE_ASSET_BASE}/images/${atlasKey}.json`)
        if (!response.ok) return null
        const raw = await response.json()
        const atlas = buildTextureAtlas(raw, `${REMOTE_ASSET_BASE}/images`)
        return atlas ? [atlasKey, atlas] as const : null
      })
    )
      .then(entries => {
        if (cancelled) return
        const next = Object.fromEntries(entries.filter(Boolean) as Array<readonly [string, TextureAtlas]>)
        setIconAtlases(next)
      })
      .catch(err => console.error('Failed to load icon atlases:', err))

    return () => { cancelled = true }
  }, [pokemons])

  if (loading) {
    return <div className="team-builder-page"><div className="loading">加载数据中...</div></div>
  }

  return (
    <div className="team-builder-page">
      <div className="team-builder-header">
        <div>
          <h2>配队分析器</h2>
          <p>组合最多 6 名精灵，实时查看可学招式池打击面、共同弱点与职能缺口。</p>
        </div>
        <div className="team-builder-actions">
          <span className="team-count" aria-label={`当前已选 ${filledCount} 名精灵`}>
            <strong>{filledCount}</strong><span>/6</span>
          </span>
          <button
            className="tb-btn"
            onClick={() => setLoadModalOpen(true)}
            disabled={savedTeams.length === 0}
            title={savedTeams.length === 0 ? '暂无保存的队伍' : `已保存 ${savedTeams.length} 支队伍`}
          >
            加载{savedTeams.length > 0 ? ` (${savedTeams.length})` : ''}
          </button>
          <button
            className="tb-btn"
            onClick={() => setSaveModalOpen(true)}
            disabled={filledCount === 0}
          >
            保存队伍
          </button>
          <button className="tb-btn secondary" onClick={() => setClearConfirmOpen(true)} disabled={filledCount === 0}>
            清空
          </button>
        </div>
      </div>

      {notice && <div className="team-notice" role="status">{notice}</div>}

      <TeamSlots
        slots={slots}
        pokemons={pokemons}
        iconAtlases={iconAtlases}
        onAddPokemon={addPokemon}
        onRemovePokemon={removePokemon}
        onSwitchForm={switchForm}
      />

      {analysis ? (
        <div className="team-analysis">
          <div className="team-analysis-progress">
            <strong>已基于 {filledCount} 名精灵完成当前分析。</strong>
            {filledCount < 6
              ? <span>继续补充 {6 - filledCount} 名精灵，能更完整地判断共同弱点与职能缺口。</span>
              : <span>队伍已满，可优先根据下方缺口建议调整成员或形态。</span>}
          </div>
          <GapSuggestions gaps={analysis.gaps} />
          <div className="analysis-grid">
            <CoverageAnalysis coverage={analysis.coverage} />
            <DefenseOverview defense={analysis.defense} />
            <RoleDistribution roles={analysis.roles} />
          </div>
          <TeamDataTable details={analysis.pokemonDetails} />
        </div>
      ) : (
        <div className="team-empty-hint">
          <strong>点击任一空位添加精灵。</strong>
          <span>从第一名成员开始，打击面、弱点和职能分析会立即出现。</span>
        </div>
      )}

      {/* 保存队伍弹窗 */}
      <SaveTeamModal
        open={saveModalOpen}
        onSave={handleSaveTeam}
        onClose={() => setSaveModalOpen(false)}
      />

      {/* 加载队伍弹窗 */}
      <LoadTeamModal
        open={loadModalOpen}
        teams={savedTeams}
        onLoad={handleLoadTeam}
        onDelete={handleDeleteSavedTeam}
        onClose={() => setLoadModalOpen(false)}
      />

      <ConfirmClearModal
        open={clearConfirmOpen}
        onConfirm={handleClearTeam}
        onClose={() => setClearConfirmOpen(false)}
      />
    </div>
  )
}

function SaveTeamModal({
  open,
  onSave,
  onClose,
}: {
  open: boolean
  onSave: (name: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) setName('')
  }, [open])

  const footer = (
    <>
      <button className="tb-btn secondary" onClick={onClose}>取消</button>
      <button
        className="tb-btn"
        onClick={() => onSave(name)}
        disabled={!name.trim()}
      >
        保存
      </button>
    </>
  )

  return (
    <Modal open={open} onClose={onClose} title="保存队伍" size="small" footer={footer}>
      <div className="modal-body">
        <input
          type="text"
          placeholder="输入队伍名称"
          value={name}
          onChange={e => setName(e.target.value)}
          className="picker-search"
          autoFocus
          onKeyDown={e => {
            if (e.key === 'Enter' && name.trim()) {
              onSave(name)
            }
          }}
        />
      </div>
    </Modal>
  )
}

function LoadTeamModal({
  open,
  teams,
  onLoad,
  onDelete,
  onClose,
}: {
  open: boolean
  teams: SavedTeam[]
  onLoad: (team: SavedTeam) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) setPendingDeleteId(null)
  }, [open])

  return (
    <Modal open={open} onClose={onClose} title="加载队伍" size="small">
      <div className="modal-body">
        {teams.length === 0 ? (
          <div className="analysis-empty">暂无保存的队伍</div>
        ) : (
          <div className="saved-team-list">
            {teams.map(team => (
              <div key={team.id} className="saved-team-item">
                <div className="saved-team-info">
                  <div className="saved-team-name">{team.name}</div>
                  <div className="saved-team-time">
                    {new Date(team.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div className="saved-team-actions">
                  <button className="tb-btn small" onClick={() => onLoad(team)}>加载</button>
                  {pendingDeleteId === team.id ? (
                    <>
                      <button className="tb-btn small danger" onClick={() => {
                        onDelete(team.id)
                        setPendingDeleteId(null)
                      }}>
                        确认删除
                      </button>
                      <button className="tb-btn small secondary" onClick={() => setPendingDeleteId(null)}>
                        取消
                      </button>
                    </>
                  ) : (
                    <button
                      className="tb-btn small secondary"
                      onClick={() => setPendingDeleteId(team.id)}
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

function ConfirmClearModal({
  open,
  onConfirm,
  onClose,
}: {
  open: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const footer = (
    <>
      <button className="tb-btn secondary" onClick={onClose}>取消</button>
      <button className="tb-btn danger" onClick={onConfirm}>清空当前队伍</button>
    </>
  )

  return (
    <Modal open={open} onClose={onClose} title="清空当前队伍？" size="small" footer={footer}>
      <div className="modal-body">
        当前 6 个位置都会被清空，但已经保存的队伍不会受影响。
      </div>
    </Modal>
  )
}
