import { createPortal } from 'react-dom'
import type { Army, Unit, WeaponResult } from '../types/roster'
import { buildUnitMatchups, type MatchupEntry, type UnitMatchupSheet } from '../lib/matchupCalc'

export interface PrintOptions {
  armies: 'A' | 'B' | 'both'
  fullStats: boolean
  matchupCount: number | null // null = all
}

interface Props {
  armyA: Army
  armyB: Army
  options: PrintOptions
}

function pct(v: number, d = 0) {
  return (v * 100).toFixed(d) + '%'
}

function statLine(u: Unit): string {
  const parts = [`M${u.stats.M}`, `T${u.stats.T}`, `SV${u.stats.SV}+`, `W${u.stats.W}`, `LD${u.stats.LD}`, `OC${u.stats.OC}`]
  if (u.stats.invuln) parts.push(`Inv${u.stats.invuln}++`)
  if (u.stats.fnp) parts.push(`FNP${u.stats.fnp}+`)
  return parts.join('  ·  ')
}

// ── Weapon breakdown table (compact, for full-stats mode) ──────────────────
function WeaponTable({ results }: { results: WeaponResult[] }) {
  const sorted = [...results].sort((a, b) => b.expectedDmg - a.expectedDmg)
  return (
    <table className="mt-1.5 w-full text-[9px] border-collapse">
      <thead>
        <tr className="border-gray-300 border-b">
          <th className="py-0.5 pr-2 font-medium text-gray-500 text-left">Weapon</th>
          <th className="px-1 py-0.5 font-medium text-gray-500 text-right whitespace-nowrap">Att</th>
          <th className="px-1 py-0.5 font-medium text-gray-500 text-right">Hit%</th>
          <th className="px-1 py-0.5 font-medium text-gray-500 text-right">Wound%</th>
          <th className="px-1 py-0.5 font-medium text-gray-500 text-right">Save%</th>
          <th className="px-1 py-0.5 font-medium text-gray-500 text-right">Chain%</th>
          <th className="py-0.5 pl-1 font-medium text-gray-500 text-right">Exp Dmg</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((r, i) => (
          <tr key={i} className="border-gray-100 border-b">
            <td className="py-0.5 pr-2 text-gray-700">{r.weapon.name}</td>
            <td className="px-1 py-0.5 tabular-nums text-gray-500 text-right">
              {r.weapon.attacks}
              {r.weapon.count > 1 ? `×${r.weapon.count}` : ''}
            </td>
            <td className="px-1 py-0.5 tabular-nums text-right">{pct(r.hitP)}</td>
            <td className="px-1 py-0.5 tabular-nums text-right">{pct(r.woundP)}</td>
            <td className="px-1 py-0.5 tabular-nums text-right">{pct(r.saveFailP)}</td>
            <td className="px-1 py-0.5 font-medium tabular-nums text-right">{pct(r.chainProb, 1)}</td>
            <td className="py-0.5 pl-1 font-semibold tabular-nums text-emerald-700 text-right">{r.expectedDmg.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Single matchup row (name + dmg/hp + ratio bar) ────────────────────────
function MatchupRow({ entry, fullStats, tone }: { entry: MatchupEntry; fullStats: boolean; tone: 'fight' | 'avoid' }) {
  const bar = Math.min(entry.threatRatio, 1)
  const barColor = tone === 'fight' ? '#16a34a' : '#dc2626'

  return (
    <div className="mb-2 last:mb-0">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-semibold text-[11px] text-gray-800">{entry.opponent.name}</span>
        {/* <span className="text-[9px] text-gray-400">
          {entry.opponent.modelCount} model{entry.opponent.modelCount > 1 ? 's' : ''} · {entry.opponent.pts}pts
        </span> */}
        <span className="ml-auto tabular-nums text-[10px] text-gray-600">
          {entry.totalExpectedDmg.toFixed(1)} / {entry.totalHp} HP
        </span>
        <span className="min-w-[36px] font-semibold tabular-nums text-[10px] text-right" style={{ color: barColor }}>
          {pct(entry.threatRatio, 1)}
        </span>
      </div>
      {/* Thin threat bar */}
      <div className="bg-gray-100 mt-0.5 rounded-full h-1.5 overflow-hidden">
        <div className="rounded-full h-full transition-all" style={{ width: `${bar * 100}%`, backgroundColor: barColor, opacity: 0.6 }} />
      </div>
      {fullStats && <WeaponTable results={entry.results} />}
    </div>
  )
}

// ── Unit card ─────────────────────────────────────────────────────────────
function UnitCard({ sheet, fullStats, opponentArmyName }: { sheet: UnitMatchupSheet; fullStats: boolean; opponentArmyName: string }) {
  const { unit, topN, bottomN } = sheet

  return (
    <div className="mb-6 border border-gray-300 rounded-lg overflow-hidden break-inside-avoid">
      {/* Unit header */}
      <div className="bg-gray-100 px-3 py-2 border-gray-300 border-b">
        <div className="flex justify-between items-baseline">
          <span className="font-bold text-gray-900 text-sm">{unit.name}</span>
          <span className="text-[10px] text-gray-500">
            {unit.pts}pts · {unit.modelCount} model{unit.modelCount > 1 ? 's' : ''}
          </span>
        </div>
        <div className="mt-0.5 font-mono text-[9px] text-gray-500 tracking-wide">{statLine(unit)}</div>
      </div>

      {/* Fight/Avoid columns */}
      <div className="gap-0 grid grid-cols-2">
        {/* Fight These */}
        <div className="px-3 py-2 border-gray-200 border-r">
          <div className="flex items-center gap-1 mb-2">
            <span className="font-bold text-[9px] text-green-700 uppercase tracking-widest">▲ Fight These</span>
            <span className="ml-1 text-[8px] text-gray-400">vs {opponentArmyName}</span>
          </div>
          {topN.length === 0 && <p className="text-[9px] text-gray-400 italic">No opponents</p>}
          {topN.map((entry: MatchupEntry, i: number) => (
            <MatchupRow key={i} entry={entry} fullStats={fullStats} tone="fight" />
          ))}
        </div>

        {/* Avoid These */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-1 mb-2">
            <span className="font-bold text-[9px] text-red-700 uppercase tracking-widest">▼ Avoid These</span>
            <span className="ml-1 text-[8px] text-gray-400">vs {opponentArmyName}</span>
          </div>
          {bottomN.length === 0 && <p className="text-[9px] text-gray-400 italic">No opponents</p>}
          {bottomN.map((entry: MatchupEntry, i: number) => (
            <MatchupRow key={i} entry={entry} fullStats={fullStats} tone="avoid" />
          ))}
        </div>
      </div>

      {/* Full stats: all remaining matchups if enabled */}
      {fullStats && sheet.matchups.length > 6 && (
        <div className="px-3 py-2 border-gray-200 border-t">
          <div className="mb-2 font-bold text-[9px] text-gray-500 uppercase tracking-widest">All matchups</div>
          <div className="gap-x-4 gap-y-1 grid grid-cols-2">
            {sheet.matchups.map((entry, i) => (
              <div key={i} className="flex items-center gap-1 text-[9px]">
                <span
                  className="inline-block flex-shrink-0 rounded-full w-1.5 h-1.5"
                  style={{
                    backgroundColor: entry.threatRatio >= 0.5 ? '#16a34a' : entry.threatRatio >= 0.25 ? '#d97706' : '#dc2626',
                  }}
                />
                <span className="text-gray-700 truncate">{entry.opponent.name}</span>
                <span className="ml-auto tabular-nums text-gray-500 shrink-0">{pct(entry.threatRatio, 1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Army section ──────────────────────────────────────────────────────────
function ArmySection({ army, opponents, fullStats, matchupCount }: { army: Army; opponents: Army; fullStats: boolean; matchupCount: number | null }) {
  const sheets = army.units.map((u) => buildUnitMatchups(u, opponents.units, matchupCount))

  return (
    <div>
      <div className="flex justify-between items-center mb-4 pb-1 border-gray-800 border-b-2">
        <h2 className="font-bold text-gray-900 text-base">{army.name}</h2>
        <span className="text-[10px] text-gray-500">
          vs {opponents.name} · {army.units.length} units
        </span>
      </div>
      {sheets.map((sheet, i) => (
        <UnitCard key={i} sheet={sheet} fullStats={fullStats} opponentArmyName={opponents.name} />
      ))}
    </div>
  )
}

// ── Root print sheet — portals into #print-root so @media print can show it
// independently of the main #root being hidden. ────────────────────────────
export function PrintSheet({ armyA, armyB, options }: Props) {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const content = (
    <div className="bg-white text-gray-900" style={{ fontFamily: 'system-ui, sans-serif', padding: '0' }}>
      {/* Page header */}
      <div className="flex justify-between items-center mb-5 pb-2 border-gray-900 border-b-2">
        <div>
          <h1 className="font-black text-gray-900 text-xl tracking-tight">Rock Paper Aquila</h1>
          <p className="text-[10px] text-gray-500">WH40K 10th Edition — matchup stat sheet</p>
        </div>
        <div className="text-[10px] text-gray-400 text-right">
          <div>
            {armyA.name} vs {armyB.name}
          </div>
          <div>{date}</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mb-4 text-[9px] text-gray-500">
        <span>
          <span className="font-semibold text-green-700">▲ Fight These</span> — highest expected damage ratio (best targets)
        </span>
        <span>
          <span className="font-semibold text-red-700">▼ Avoid These</span> — lowest expected damage ratio (worst matchups)
        </span>
        <span>Threat% = expected damage ÷ total HP</span>
      </div>

      {/* Army A */}
      {(options.armies === 'A' || options.armies === 'both') && (
        <div className={options.armies === 'both' ? 'mb-8' : ''}>
          <ArmySection army={armyA} opponents={armyB} fullStats={options.fullStats} matchupCount={options.matchupCount} />
        </div>
      )}

      {/* Army B */}
      {(options.armies === 'B' || options.armies === 'both') && (
        <ArmySection army={armyB} opponents={armyA} fullStats={options.fullStats} matchupCount={options.matchupCount} />
      )}
    </div>
  )

  // Portal into #print-root so the app's display:none doesn't affect us during print
  const target = document.getElementById('print-root')
  if (!target) return null
  return createPortal(content, target)
}
