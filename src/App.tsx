import { useState, useEffect } from 'react'
import type { Army, Unit, WeaponResult } from './types/roster'
import { calcWeaponVsTarget } from './lib/diceEngine'
import { UploadZone } from './components/UploadZone'
import { UnitList } from './components/UnitList'
import { DirectionToggle } from './components/DirectionToggle'
import { VsBanner } from './components/VsBanner'
import { StatGrid } from './components/StatGrid'
import { RadarChartViz } from './components/RadarChart'
import { ThreatGauge } from './components/ThreatGauge'
import { WeaponSummaryTable } from './components/WeaponSummaryTable'
import { WeaponBreakdown } from './components/WeaponBreakdown'
import { ExportModal } from './components/ExportModal'

function computeResults(attacker: Unit, defender: Unit): WeaponResult[] {
  return attacker.weapons.map((w) => calcWeaponVsTarget(w, attacker, defender))
}

export default function App() {
  const [armyA, setArmyA] = useState<Army | null>(null)
  const [armyB, setArmyB] = useState<Army | null>(null)
  const [selIdxA, setSelIdxA] = useState<number | null>(null)
  const [selIdxB, setSelIdxB] = useState<number | null>(null)
  const [direction, setDirection] = useState<'AvsB' | 'BvsA'>('AvsB')
  const [darkMode, setDarkMode] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const unitA = armyA && selIdxA !== null ? armyA.units[selIdxA] : null
  const unitB = armyB && selIdxB !== null ? armyB.units[selIdxB] : null
  const attacker = direction === 'AvsB' ? unitA : unitB
  const defender = direction === 'AvsB' ? unitB : unitA
  const results: WeaponResult[] = attacker && defender ? computeResults(attacker, defender) : []
  const totalExpectedDmg = results.reduce((s, r) => s + r.expectedDmg, 0)
  const totalHp = defender ? (defender.stats.W || 1) * (defender.modelCount || 1) : 1
  const bothSelected = unitA !== null && unitB !== null

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 transition-colors">
      <div className="mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <img src="./logo.png" alt="Rock Paper Aquila" className="w-10 h-10 object-contain" />
            <div>
              <div className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight">Rock Paper Aquila</div>
              <div className="text-gray-400 dark:text-gray-500 text-xs">WH40K 10th Edition matchup calculator</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {armyA && armyB && (
              <button
                onClick={() => setExportOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 px-3 py-1.5 border border-emerald-300 dark:border-emerald-800 rounded-lg font-medium text-emerald-700 dark:text-emerald-400 text-sm transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print Stat Sheet
              </button>
            )}
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 border border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 text-sm transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707m12.728 0-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z" />
                  </svg>
                  Light
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  Dark
                </>
              )}
            </button>
          </div>
        </div>

        {/* Upload + unit selection */}
        <div className="gap-4 grid grid-cols-2 mb-6">
          <div>
            <UploadZone
              side="A"
              army={armyA}
              onLoad={(a) => {
                setArmyA(a)
                setSelIdxA(null)
              }}
            />
            {armyA && <UnitList units={armyA.units} selectedIndex={selIdxA} side="A" onSelect={setSelIdxA} />}
          </div>
          <div>
            <UploadZone
              side="B"
              army={armyB}
              onLoad={(a) => {
                setArmyB(a)
                setSelIdxB(null)
              }}
            />
            {armyB && <UnitList units={armyB.units} selectedIndex={selIdxB} side="B" onSelect={setSelIdxB} />}
          </div>
        </div>

        {/* Placeholder */}
        {!bothSelected && (
          <div className="py-16 text-gray-400 dark:text-gray-600 text-sm text-center">
            {!armyA && !armyB ? 'Upload two army lists to begin' : 'Select a unit from each army to compare'}
          </div>
        )}

        {/* Matchup area */}
        {bothSelected && attacker && defender && (
          <div>
            <DirectionToggle unitAName={unitA!.name} unitBName={unitB!.name} direction={direction} onChange={setDirection} />
            <VsBanner unitA={attacker} unitB={defender} />
            <StatGrid unitA={attacker} unitB={defender} />

            <div className="gap-4 grid grid-cols-2 mb-5">
              <div className="bg-white dark:bg-gray-900/50 p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                <div className="mb-2 font-medium text-gray-400 dark:text-gray-500 text-xs">Stat comparison</div>
                <RadarChartViz unitA={attacker} unitB={defender} />
              </div>
              <div className="bg-white dark:bg-gray-900/50 p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                <div className="mb-2 font-medium text-gray-400 dark:text-gray-500 text-xs">Overall threat gauge</div>
                <ThreatGauge totalExpectedDmg={totalExpectedDmg} totalHp={totalHp} />
              </div>
            </div>

            {results.length > 0 && (
              <>
                <WeaponSummaryTable results={results} defenderName={defender.name} />
                <div className="mb-3 font-medium text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide">
                  Per-weapon probability distributions
                </div>
                {[...results]
                  .sort((a, b) => b.expectedDmg - a.expectedDmg)
                  .map((r, i) => (
                    <WeaponBreakdown key={i} result={r} />
                  ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Export modal + print sheet (hidden until print) */}
      {exportOpen && armyA && armyB && <ExportModal armyA={armyA} armyB={armyB} onClose={() => setExportOpen(false)} />}
    </div>
  )
}
