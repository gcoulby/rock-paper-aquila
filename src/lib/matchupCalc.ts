import type { Army, Unit, WeaponResult } from '../types/roster'
import { calcWeaponVsTarget, calcKillProbability } from './diceEngine'

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
    const mid = Math.ceil(total / 2)
    topN = matchups.slice(0, mid)
    bottomN = matchups.slice(mid).reverse()
  } else {
    const n = Math.min(count, Math.floor(total / 2))
    topN = matchups.slice(0, n)
    bottomN = matchups.slice(total - n).reverse()
  }

  return { unit, matchups, topN, bottomN }
}

export interface CounterEntry {
  attacker: Unit
  totalExpectedDmg: number
  totalHp: number
  threatRatio: number
  killProb: number  // P(total damage >= totalHp)
}

export interface EnemyCounters {
  enemy: Unit
  top3: CounterEntry[]
}

// For each enemy unit, find the top 3 attackers from your army, sorted by kill probability
export function buildCountersMatrix(yourArmy: Army, enemyArmy: Army): EnemyCounters[] {
  return enemyArmy.units.map(enemy => {
    const totalHp = Math.max(enemy.stats.W * (enemy.modelCount || 1), 1)
    const entries: CounterEntry[] = yourArmy.units.map(attacker => {
      const results = attacker.weapons.map(w => calcWeaponVsTarget(w, attacker, enemy))
      const totalExpectedDmg = results.reduce((s, r) => s + r.expectedDmg, 0)
      const killProb = calcKillProbability(results)
      return {
        attacker,
        totalExpectedDmg,
        totalHp,
        threatRatio: totalExpectedDmg / totalHp,
        killProb,
      }
    })
    // Sort by kill probability first; break ties with expected damage
    entries.sort((a, b) => b.killProb - a.killProb || b.totalExpectedDmg - a.totalExpectedDmg)
    return { enemy, top3: entries.slice(0, 3) }
  })
}
