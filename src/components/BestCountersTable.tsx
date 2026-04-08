import type { Army } from '../types/roster'
import { buildCountersMatrix, type CounterEntry } from '../lib/matchupCalc'

interface Props {
  yourArmy: Army
  enemyArmy: Army
  yourSide: 'A' | 'B'
}

function killLabel(prob: number): { label: string; colour: string } {
  if (prob >= 0.9) return { label: '90%+ kill', colour: 'text-emerald-600 dark:text-emerald-400' }
  if (prob >= 0.66) return { label: 'Likely kill', colour: 'text-green-600 dark:text-green-400' }
  if (prob >= 0.33) return { label: 'Coin flip', colour: 'text-amber-600 dark:text-amber-400' }
  if (prob >= 0.1) return { label: 'Low chance', colour: 'text-orange-500 dark:text-orange-400' }
  return { label: 'Poor threat', colour: 'text-red-500 dark:text-red-400' }
}

function CounterCell({ entry }: { entry: CounterEntry | undefined }) {
  if (!entry) {
    return (
      <td className="py-2.5 px-3 text-gray-300 dark:text-gray-600 text-xs border-l border-gray-100 dark:border-gray-800">
        —
      </td>
    )
  }
  const killPct = Math.round(entry.killProb * 100)
  const expPct = Math.round(entry.threatRatio * 100)
  const { label, colour } = killLabel(entry.killProb)

  return (
    <td className="py-2.5 px-3 border-l border-gray-100 dark:border-gray-800">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-200 leading-tight truncate max-w-40">
        {entry.attacker.name}
      </div>
      <div className={`text-[10px] font-semibold ${colour}`}>
        {killPct}% kill · {label}
      </div>
      <div className="text-[10px] text-gray-400 dark:text-gray-500">
        {expPct}% avg dmg
      </div>
    </td>
  )
}

export function BestCountersTable({ yourArmy, enemyArmy, yourSide }: Props) {
  const matrix = buildCountersMatrix(yourArmy, enemyArmy)

  const accentBorder = yourSide === 'A' ? 'border-emerald-500' : 'border-blue-500'
  const rankBadge = (i: number) => {
    if (i === 0) return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
    if (i === 1) return 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
    return 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-500'
  }

  return (
    <div className="mb-5">
      <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
        Best counters — {yourArmy.name} attacking {enemyArmy.name}
      </div>
      <div className={`overflow-x-auto rounded-xl border-2 ${accentBorder}/30 border`}>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/60">
              <th className="text-left font-medium text-gray-400 dark:text-gray-500 py-2 px-3 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                Enemy unit
              </th>
              {['1st', '2nd', '3rd'].map((n, i) => (
                <th
                  key={n}
                  className="text-left font-medium text-gray-400 dark:text-gray-500 py-2 px-3 border-b border-l border-gray-200 dark:border-gray-700 whitespace-nowrap"
                >
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold mr-1 ${rankBadge(i)}`}>
                    {i + 1}
                  </span>
                  Best attacker
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map(({ enemy, top3 }, i) => (
              <tr
                key={i}
                className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <td className="py-2.5 px-3">
                  <div className="font-medium text-gray-700 dark:text-gray-200 text-xs">{enemy.name}</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">
                    T{enemy.stats.T} · {enemy.stats.W * (enemy.modelCount || 1)} HP
                    {enemy.stats.invuln ? ` · ${enemy.stats.invuln}++` : ''}
                    {enemy.stats.fnp ? ` · ${enemy.stats.fnp}+++ FNP` : ''}
                  </div>
                </td>
                {[0, 1, 2].map(rank => (
                  <CounterCell key={rank} entry={top3[rank]} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
