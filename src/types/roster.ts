export interface UnitStats {
  M: string
  T: number
  SV: number
  W: number
  LD: string
  OC: number
  invuln: number | null
  fnp: number | null
}

export interface Weapon {
  name: string
  isRanged: boolean
  attacks: string
  attackVal: number
  isDice: boolean
  diceN: number
  hitProb: number
  hitSkill: string
  S: number
  AP: number
  D: string
  keywords: string
  count: number
  torrent: boolean
  blast: boolean
  rapidFire: number
  sustainedHits: number
  devastatingWounds: boolean
  twinLinked: boolean
  lethalHits: boolean
  antiKeyword: RegExpMatchArray | null
  heavyBonus: boolean
}

export interface Unit {
  name: string
  stats: UnitStats
  weapons: Weapon[]
  modelCount: number
  pts: number
}

export interface Army {
  name: string
  units: Unit[]
}

export interface WeaponResult {
  weapon: Weapon
  hitP: number
  woundP: number
  saveFailP: number
  fnpFailP: number
  chainProb: number
  expectedDmg: number
  dist: number[]
  maxPossibleDmg: number
  baseAttacks: number
}
