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
import '../styles/features/team-builder.css'

const REMOTE_ASSET_BASE = 'https://raw.githubusercontent.com/pagefaultgames/pokerogue-assets/beta'

export default function TeamBuilderPage() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)
  const [iconAtlases, setIconAtlases] = useState<Record<string, TextureAtlas>>({})

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
        <h2>配队分析器</h2>
        <div className="team-builder-actions">
          <span className="team-count">{filledCount}/6</span>
          <button className="tb-btn" onClick={() => setLoadModalOpen(true)}>
            加载队伍
          </button>
          <button
            className="tb-btn"
            onClick={() => setSaveModalOpen(true)}
            disabled={filledCount === 0}
          >
            保存队伍
          </button>
          <button className="tb-btn secondary" onClick={clearTeam} disabled={filledCount === 0}>
            清空
          </button>
        </div>
      </div>

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
          <div className="analysis-grid">
            <CoverageAnalysis coverage={analysis.coverage} />
            <DefenseOverview defense={analysis.defense} />
            <RoleDistribution roles={analysis.roles} />
          </div>
          <TeamDataTable details={analysis.pokemonDetails} />
          <GapSuggestions gaps={analysis.gaps} />
        </div>
      ) : (
        <div className="team-empty-hint">
          点击上方空位添加精灵，即可查看队伍分析。
        </div>
      )}

      {/* 保存队伍弹窗 */}
      <SaveTeamModal
        open={saveModalOpen}
        onSave={saveTeam}
        onClose={() => setSaveModalOpen(false)}
      />

      {/* 加载队伍弹窗 */}
      <LoadTeamModal
        open={loadModalOpen}
        teams={savedTeams}
        onLoad={loadTeam}
        onDelete={deleteSavedTeam}
        onClose={() => setLoadModalOpen(false)}
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
  teams: Array<{ id: string; name: string; createdAt: number }>
  onLoad: (team: any) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
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
                  <button
                    className="tb-btn small secondary"
                    onClick={() => onDelete(team.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
