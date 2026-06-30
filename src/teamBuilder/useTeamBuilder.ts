import { useState, useCallback } from 'react'
import type { TeamSlot, SavedTeam } from './types'

const STORAGE_KEY = 'pokerogue_teams_v1'

function loadSavedTeams(): SavedTeam[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function saveSavedTeams(teams: SavedTeam[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teams))
  } catch { /* ignore */ }
}

export function useTeamBuilder() {
  const [slots, setSlots] = useState<(TeamSlot | null)[]>([null, null, null, null, null, null])
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>(loadSavedTeams)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [loadModalOpen, setLoadModalOpen] = useState(false)

  const addPokemon = useCallback((slotIndex: number, speciesId: string) => {
    setSlots(prev => {
      const next = [...prev]
      next[slotIndex] = { speciesId, formIndex: 0 }
      return next
    })
  }, [])

  const removePokemon = useCallback((slotIndex: number) => {
    setSlots(prev => {
      const next = [...prev]
      next[slotIndex] = null
      return next
    })
  }, [])

  const switchForm = useCallback((slotIndex: number, formIndex: number) => {
    setSlots(prev => {
      const slot = prev[slotIndex]
      if (!slot) return prev
      const next = [...prev]
      next[slotIndex] = { ...slot, formIndex }
      return next
    })
  }, [])

  const clearTeam = useCallback(() => {
    setSlots([null, null, null, null, null, null])
  }, [])

  const saveTeam = useCallback((name: string) => {
    const team: SavedTeam = {
      id: `team_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || '未命名队伍',
      slots: [...slots],
      createdAt: Date.now(),
    }
    const next = [...savedTeams, team]
    setSavedTeams(next)
    saveSavedTeams(next)
    setSaveModalOpen(false)
  }, [slots, savedTeams])

  const loadTeam = useCallback((team: SavedTeam) => {
    setSlots([...team.slots])
    setLoadModalOpen(false)
  }, [])

  const deleteSavedTeam = useCallback((id: string) => {
    const next = savedTeams.filter(t => t.id !== id)
    setSavedTeams(next)
    saveSavedTeams(next)
  }, [savedTeams])

  const filledCount = slots.filter(Boolean).length

  return {
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
  }
}
