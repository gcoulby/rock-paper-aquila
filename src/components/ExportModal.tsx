import { useState, useEffect } from 'react'
import type { Army } from '../types/roster'
import { PrintSheet, type PrintOptions } from './PrintSheet'

interface Props {
  armyA: Army
  armyB: Army
  onClose: () => void
}

export function ExportModal({ armyA, armyB, onClose }: Props) {
  const [options, setOptions] = useState<PrintOptions>({ armies: 'both', fullStats: false, matchupCount: 3 })
  const [printing, setPrinting] = useState(false)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handlePrint() {
    setPrinting(true)
    // Give React one frame to render the sheet before printing
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print()
        setPrinting(false)
      })
    })
  }

  const armyOptions: Array<{ value: PrintOptions['armies']; label: string; sub: string }> = [
    { value: 'A', label: armyA.name, sub: `${armyA.units.length} units → vs ${armyB.name}` },
    { value: 'B', label: armyB.name, sub: `${armyB.units.length} units → vs ${armyA.name}` },
    { value: 'both', label: 'Both armies', sub: `${armyA.units.length + armyB.units.length} units total` },
  ]

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">Print Stat Sheet</div>
              <div className="text-xs text-gray-400 mt-0.5">Fight these · Avoid these</div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="px-5 py-4 space-y-5">
            {/* Army selection */}
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Print stat sheet for
              </div>
              <div className="space-y-1.5">
                {armyOptions.map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      options.armies === opt.value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="armies"
                      value={opt.value}
                      checked={options.armies === opt.value}
                      onChange={() => setOptions(o => ({ ...o, armies: opt.value }))}
                      className="accent-emerald-600"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{opt.label}</div>
                      <div className="text-xs text-gray-400">{opt.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Top / bottom count */}
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Matchups shown per unit
              </div>
              <div className="flex gap-1.5">
                {([1, 3, 5, null] as const).map(n => {
                  const label = n === null ? 'All' : String(n)
                  const active = options.matchupCount === n
                  return (
                    <button
                      key={label}
                      onClick={() => setOptions(o => ({ ...o, matchupCount: n }))}
                      className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                        active
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                Top <em>N</em> fight targets and bottom <em>N</em> avoid targets per unit card.
              </p>
            </div>

            {/* Full stats toggle */}
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Detail level
              </div>
              <label className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                options.fullStats
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}>
                <input
                  type="checkbox"
                  checked={options.fullStats}
                  onChange={e => setOptions(o => ({ ...o, fullStats: e.target.checked }))}
                  className="mt-0.5 accent-emerald-600"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Include full weapon breakdown
                  </div>
                  <div className="text-xs text-gray-400">
                    Adds per-weapon hit / wound / save / chain% tables for each highlighted matchup.
                    Produces a longer printout.
                  </div>
                </div>
              </label>
            </div>

            {/* Preview summary */}
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">What you'll get: </span>
              One card per unit showing{' '}
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {options.matchupCount === null ? 'all' : `top ${options.matchupCount}`}
              </span>{' '}
              <span className="text-green-700 dark:text-green-500 font-medium">(fight)</span>
              {' '}and{' '}
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {options.matchupCount === null ? 'all' : `bottom ${options.matchupCount}`}
              </span>{' '}
              <span className="text-red-600 dark:text-red-400 font-medium">(avoid)</span>{' '}
              matchups ranked by threat ratio.
              {options.fullStats && ' Full weapon stats included.'}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              {printing ? 'Preparing…' : 'Print'}
            </button>
          </div>
        </div>
      </div>

      {/* Print content portals into #print-root — visible only during @media print */}
      <PrintSheet armyA={armyA} armyB={armyB} options={options} />
    </>
  )
}
