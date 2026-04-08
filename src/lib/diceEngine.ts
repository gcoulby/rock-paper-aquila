import type { Unit, Weapon, WeaponResult } from '../types/roster'

export function woundRoll(S: number, T: number): number {
  if (S >= T * 2) return 5 / 6
  if (S > T) return 4 / 6
  if (S === T) return 3 / 6
  if (S < T && S * 2 >= T) return 2 / 6
  return 1 / 6
}

export function saveFailProb(AP: number, SV: number, invuln: number | null): number {
  const modSV = SV - AP
  let effective = modSV
  if (invuln !== null && invuln < effective) effective = invuln
  if (effective > 6) return 1.0
  if (effective < 2) return 0
  return (effective - 1) / 6
}

interface DamageInfo {
  avg: number
  values: number[]
  probs: number[]
}

function parseDamage(D: string): DamageInfo {
  if (!D || D === '-') return { avg: 1, values: [1], probs: [1] }
  if (D === 'D6') return { avg: 3.5, values: [1, 2, 3, 4, 5, 6], probs: [1/6, 1/6, 1/6, 1/6, 1/6, 1/6] }
  if (D === 'D3') return { avg: 2, values: [1, 2, 3], probs: [1/3, 1/3, 1/3] }
  // Handle compound dice like D6+3 or D3+1
  const mBonus = D.match(/^(D6|D3)\+(\d+)$/i)
  if (mBonus) {
    const isD6 = mBonus[1].toUpperCase() === 'D6'
    const bonus = parseInt(mBonus[2])
    const base = isD6 ? [1, 2, 3, 4, 5, 6] : [1, 2, 3]
    const values = base.map(v => v + bonus)
    const probs = isD6 ? Array(6).fill(1 / 6) as number[] : Array(3).fill(1 / 3) as number[]
    const avg = values.reduce((s, v, i) => s + v * probs[i], 0)
    return { avg, values, probs }
  }
  const v = parseFloat(D) || 1
  return { avg: v, values: [v], probs: [1] }
}

// Returns the maximum possible value for a dice expression (for spike mode)
function maxDiceVal(expr: string): number {
  if (!expr || expr === '-') return 1
  if (expr === 'D6') return 6
  if (expr === 'D3') return 3
  const m = expr.match(/^(D6|D3)\+(\d+)$/i)
  if (m) return (m[1].toUpperCase() === 'D6' ? 6 : 3) + parseInt(m[2])
  return parseFloat(expr) || 1
}

function spikeDamageInfo(D: string): DamageInfo {
  const max = maxDiceVal(D)
  return { avg: max, values: [max], probs: [1] }
}

// Convolve two probability distributions, capping at maxDmg (overkill accumulates there)
export function convolveDists(a: number[], b: number[], maxDmg: number): number[] {
  const result = new Array(maxDmg + 1).fill(0) as number[]
  for (let i = 0; i <= maxDmg; i++) {
    if (!a[i]) continue
    for (let j = 0; j < b.length; j++) {
      result[Math.min(i + j, maxDmg)] += a[i] * b[j]
    }
  }
  return result
}

// Kill probability = P(combined damage from all weapon results >= totalHp)
export function calcKillProbability(results: WeaponResult[]): number {
  if (results.length === 0) return 0
  const maxDmg = results[0].maxPossibleDmg
  let combined = new Array(maxDmg + 1).fill(0) as number[]
  combined[0] = 1
  for (const r of results) {
    combined = convolveDists(combined, r.dist, maxDmg)
  }
  return combined[maxDmg]
}

export function calcWeaponVsTarget(weapon: Weapon, attacker: Unit, target: Unit, spike = false): WeaponResult {
  const numModels = attacker.modelCount || 1
  const spikeMaxAttacks = maxDiceVal(weapon.attacks)
  const baseAttacks = spike
    ? spikeMaxAttacks * (weapon.count || 1) * numModels
    : weapon.attackVal * (weapon.count || 1) * numModels
  const dmgInfo = spike ? spikeDamageInfo(weapon.D) : parseDamage(weapon.D)
  const woundP = woundRoll(weapon.S, target.stats.T)
  const saveFailP = saveFailProb(weapon.AP, target.stats.SV, target.stats.invuln)
  const fnpFailP = target.stats.fnp ? (7 - target.stats.fnp) / 6 : 1

  let hitP = weapon.hitProb
  if (weapon.sustainedHits > 0) hitP += hitP * (1 / 6) * weapon.sustainedHits

  let woundPAdj = woundP
  if (weapon.twinLinked) woundPAdj = woundP + (1 - woundP) * woundP
  if (weapon.lethalHits) woundPAdj = (1 / 6) + (5 / 6) * woundP

  let saveAdjusted = saveFailP
  if (weapon.devastatingWounds) {
    const critWound = 1 / 6
    const normalWound = (5 / 6) * woundPAdj
    saveAdjusted = critWound * 1.0 + normalWound * saveFailP
  }

  const chainProb = hitP * woundPAdj * saveAdjusted * fnpFailP
  const expectedDmg = baseAttacks * chainProb * dmgInfo.avg

  const maxDmg = Math.ceil(target.stats.W * (target.modelCount || 1))
  const dist = new Array(maxDmg + 1).fill(0) as number[]
  dist[0] = 1

  const attacksForDist = Math.round(baseAttacks)
  for (let i = 0; i < attacksForDist; i++) {
    const newDist = new Array(maxDmg + 1).fill(0) as number[]
    for (let d = 0; d <= maxDmg; d++) {
      if (!dist[d]) continue
      newDist[d] += dist[d] * (1 - chainProb)
      for (let v = 0; v < dmgInfo.values.length; v++) {
        const dmg = dmgInfo.values[v]
        const p = dmgInfo.probs[v] * chainProb
        const newD = Math.min(d + dmg, maxDmg)
        newDist[newD] += dist[d] * p
      }
    }
    for (let d = 0; d <= maxDmg; d++) dist[d] = newDist[d]
  }

  return {
    weapon,
    hitP,
    woundP: woundPAdj,
    saveFailP: saveAdjusted,
    fnpFailP,
    chainProb,
    expectedDmg,
    dist,
    maxPossibleDmg: maxDmg,
    baseAttacks,
  }
}
