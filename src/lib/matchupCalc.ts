import type { Unit, WeaponResult } from '../types/roster'
import { calcWeaponVsTarget } from './diceEngine'

export interface MatchupEntry {
  opponent: Unit
  results: WeaponResult[]
  totalExpectedDmg: number
  totalHp: number
  threatRatio: number
}

export interface UnitMatchupSheet {
  unit: Unit
  matchups: MatchupEntry[]   // all matchups, sorted best → worst
  topN: MatchupEntry[]
  bottomN: MatchupEntry[]
}

// count = null means "all"
export function buildUnitMatchups(unit: Unit, opponents: Unit[], count: number | null): UnitMatchupSheet {
  const matchups: MatchupEntry[] = opponents.map(opp => {
    const results = unit.weapons.map(w => calcWeaponVsTarget(w, unit, opp))
    const totalExpectedDmg = results.reduce((s, r) => s + r.expectedDmg, 0)
    const totalHp = Math.max(opp.stats.W * (opp.modelCount || 1), 1)
    return {
      opponent: opp,
      results,
      totalExpectedDmg,
      totalHp,
      threatRatio: totalExpectedDmg / totalHp,
    }
  })

  matchups.sort((a, b) => b.threatRatio - a.threatRatio)

  const total = matchups.length

  let topN: MatchupEntry[]
  let bottomN: MatchupEntry[]

  if (count === null) {
    // "All" mode: split at midpoint so every unit appears exactly once.
    // Worst-to-best order in the avoid column (lowest threat first).
    const mid = Math.ceil(total / 2)
    topN = matchups.slice(0, mid)
    bottomN = matchups.slice(mid).reverse()
  } else {
    // Fixed count: cap at floor(total/2) so fight and avoid lists never overlap.
    const n = Math.min(count, Math.floor(total / 2))
    topN = matchups.slice(0, n)
    bottomN = matchups.slice(total - n).reverse()
  }

  return { unit, matchups, topN, bottomN }
}
