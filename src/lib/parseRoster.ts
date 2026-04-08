import JSZip from 'jszip'
import type { Army, Unit, UnitStats, Weapon } from '../types/roster'

export async function loadRosterFile(file: File): Promise<Army> {
  const name = file.name.toLowerCase()
  let xmlText: string
  if (name.endsWith('.rosz')) {
    const zip = await JSZip.loadAsync(file)
    const rosFile = Object.values(zip.files).find(f => f.name.endsWith('.ros'))
    if (!rosFile) throw new Error('No .ros file found inside .rosz')
    xmlText = await rosFile.async('text')
  } else {
    xmlText = await file.text()
  }
  return parseRoster(xmlText)
}

function parseRoster(xml: string): Army {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const rosterName = doc.querySelector('roster')?.getAttribute('name') ?? 'Army'
  const units: Unit[] = []
  const force = doc.querySelector('force')
  if (!force) return { name: rosterName, units: [] }

  const selections = force.querySelectorAll(':scope > selections > selection')
  for (const sel of selections) {
    const type = sel.getAttribute('type')
    const selName = sel.getAttribute('name')
    if (
      ['upgrade', 'unit', 'model'].includes(type ?? '') &&
      !['Battle Size', 'Detachment', 'Show/Hide Options'].includes(selName ?? '')
    ) {
      const unit = extractUnit(sel)
      if (unit) units.push(unit)
    }
  }
  return { name: rosterName, units }
}

function extractUnit(sel: Element): Unit | null {
  const name = sel.getAttribute('name') ?? 'Unknown'
  const unitProfile = sel.querySelector('profiles > profile[typeName="Unit"]')
  if (!unitProfile && !sel.querySelector('profiles > profile[typeName="Abilities"]')) return null

  const stats: UnitStats = { M: '?', T: 4, SV: 5, W: 1, LD: '7+', OC: 1, invuln: null, fnp: null }

  const allProfiles = sel.querySelectorAll('profiles > profile')
  for (const p of allProfiles) {
    if (p.getAttribute('typeName') === 'Unit') {
      const chars = p.querySelectorAll('characteristic')
      for (const c of chars) {
        const cname = c.getAttribute('name')
        const val = c.textContent?.trim() ?? ''
        if (cname === 'M') stats.M = val
        else if (cname === 'T') stats.T = parseInt(val) || 4
        else if (cname === 'SV') stats.SV = parseInt(val) || 5
        else if (cname === 'W') stats.W = parseInt(val) || 1
        else if (cname === 'LD') stats.LD = val
        else if (cname === 'OC') stats.OC = parseInt(val) || 1
      }
      break
    }
  }

  // rules for FNP
  const rules = [...sel.querySelectorAll('rules > rule')].map(r => r.getAttribute('name') ?? '')
  for (const r of rules) {
    const m = r.match(/Feel No Pain (\d+)\+/i)
    if (m) stats.fnp = parseInt(m[1])
  }

  // profiles for invuln / FNP from abilities
  for (const p of allProfiles) {
    const n = p.getAttribute('name') ?? ''
    if (n.includes('Invulnerable Save')) {
      const m = n.match(/\((\d+)\+\)/)
      if (m) stats.invuln = parseInt(m[1])
    }
    if (p.getAttribute('typeName') === 'Abilities') {
      const desc = p.querySelector('characteristic[name="Description"]')?.textContent ?? ''
      const fm = desc.match(/Feel No Pain (\d+)\+/i)
      if (fm) stats.fnp = parseInt(fm[1])
      const im = desc.match(/(\d+)\+ invulnerable save/i)
      if (im) stats.invuln = parseInt(im[1])
    }
  }

  const weapons: Weapon[] = []

  // direct weapon profiles
  const directWeaponProfiles = sel.querySelectorAll(
    'profiles > profile[typeName="Ranged Weapons"], profiles > profile[typeName="Melee Weapons"]'
  )
  for (const wp of directWeaponProfiles) {
    const w = parseWeapon(wp)
    if (w && !weapons.find(x => x.name === w.name)) weapons.push(w)
  }

  // sub-selection weapons
  const subSels = sel.querySelectorAll('selections > selection')
  for (const ss of subSels) {
    const wps = ss.querySelectorAll(
      'profiles > profile[typeName="Ranged Weapons"], profiles > profile[typeName="Melee Weapons"]'
    )
    for (const wp of wps) {
      const w = parseWeapon(wp)
      if (w && !weapons.find(x => x.name === w.name)) {
        const ssType = ss.getAttribute('type')
        // For type="model" sub-selections the weapon is per-model; modelCount already handles
        // the multiplication so treat count as 1. For type="upgrade" / other, number represents
        // total of this weapon across the unit.
        const num = ssType === 'model' ? 1 : (parseInt(ss.getAttribute('number') ?? '1') || 1)
        w.count = num
        weapons.push(w)
      }
    }
    // sub-selection rules for FNP
    const subRules = [...ss.querySelectorAll('rules > rule')].map(r => r.getAttribute('name') ?? '')
    for (const r of subRules) {
      const m = r.match(/Feel No Pain (\d+)\+/i)
      if (m && !stats.fnp) stats.fnp = parseInt(m[1])
    }
  }

  // model count
  const modelSels = sel.querySelectorAll(':scope > selections > selection[type="model"]')
  let modelCount = 0
  for (const ms of modelSels) {
    modelCount += parseInt(ms.getAttribute('number') ?? '1') || 1
  }
  if (modelCount === 0) modelCount = 1

  const pts = parseInt(sel.querySelector('costs > cost[name="pts"]')?.getAttribute('value') ?? '0') || 0

  return { name, stats, weapons, modelCount, pts }
}

function parseWeapon(wp: Element): Weapon | null {
  const name = wp.getAttribute('name')
  if (!name) return null
  const typeName = wp.getAttribute('typeName')
  const isRanged = typeName === 'Ranged Weapons'

  const chars: Record<string, string> = {}
  for (const c of wp.querySelectorAll('characteristic')) {
    const cname = c.getAttribute('name')
    if (cname) chars[cname] = c.textContent?.trim() ?? ''
  }

  const kw = (chars['Keywords'] ?? '').toLowerCase()
  const attacks = chars['A'] ?? '1'
  let attackVal: number
  let isDice = false
  let diceN = 6

  if (attacks === 'D6') { attackVal = 3.5; isDice = true; diceN = 6 }
  else if (attacks === 'D3') { attackVal = 2; isDice = true; diceN = 3 }
  else {
    // Handle compound dice like D6+1 or D3+2
    const mBonus = attacks.match(/^(D6|D3)\+(\d+)$/i)
    if (mBonus) {
      const base = mBonus[1].toUpperCase() === 'D6' ? 3.5 : 2
      attackVal = base + parseInt(mBonus[2])
      isDice = true
      diceN = mBonus[1].toUpperCase() === 'D6' ? 6 : 3
    } else {
      attackVal = parseFloat(attacks) || 1
    }
  }

  const hitSkill = isRanged ? (chars['BS'] ?? '4+') : (chars['WS'] ?? '4+')
  let hitProb: number
  if (hitSkill === 'N/A' || kw.includes('torrent')) {
    hitProb = 1.0
  } else {
    const n = parseInt(hitSkill) || 4
    hitProb = (7 - n) / 6
  }

  return {
    name,
    isRanged,
    attacks,
    attackVal,
    isDice,
    diceN,
    hitProb,
    hitSkill,
    S: parseInt(chars['S'] ?? '4') || 4,
    AP: parseInt(chars['AP'] ?? '0') || 0,
    D: chars['D'] ?? '1',
    keywords: chars['Keywords'] ?? '',
    count: 1,
    torrent: kw.includes('torrent'),
    blast: kw.includes('blast'),
    rapidFire: kw.includes('rapid fire')
      ? (parseInt(kw.match(/rapid fire (\d+)/)?.[1] ?? '1') || 1)
      : 0,
    sustainedHits: kw.includes('sustained hits')
      ? (parseInt(kw.match(/sustained hits (\d+)/)?.[1] ?? '1') || 1)
      : 0,
    devastatingWounds: kw.includes('devastating wounds'),
    twinLinked: kw.includes('twin-linked'),
    lethalHits: kw.includes('lethal hits'),
    antiKeyword: kw.match(/anti-(\w+) (\d+)\+/),
    heavyBonus: kw.includes('heavy'),
  }
}
