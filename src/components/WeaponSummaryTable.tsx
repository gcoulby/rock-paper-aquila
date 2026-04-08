import type { WeaponResult } from '../types/roster'

interface Props {
  results: WeaponResult[]
  defenderName: string
  spikeMode?: boolean
}

function pct(v: number, decimals = 0): string {
  return (v * 100).toFixed(decimals) + '%'
}

export function WeaponSummaryTable({ results, defenderName: _defenderName, spikeMode = false }: Props) {
  const sorted = [...results].sort((a, b) => b.expectedDmg - a.expectedDmg)

  return (
    <div className="mb-5">
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/60">
              {['Weapon', 'Type', 'Att', 'Hit%', 'Wound%', 'Save fail%', 'Chain%', spikeMode ? 'Spike dmg' : 'Exp dmg'].map(h => (
                <th
                  key={h}
                  className="text-left font-medium text-gray-400 dark:text-gray-500 py-2 px-2.5 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ weapon: w, hitP, woundP, saveFailP, chainProb, expectedDmg }, i) => {
              const kws = w.keywords
                ? w.keywords.split(',').map(k => k.trim()).filter(k => k && k !== '-').slice(0, 2)
                : []
              return (
                <tr
                  key={i}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="py-2 px-2.5 text-gray-700 dark:text-gray-300">
                    {w.name}
                    {kws.length > 0 && (
                      <span className="ml-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                        {kws.join(', ')}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2.5 text-gray-400 dark:text-gray-500">{w.isRanged ? 'Ranged' : 'Melee'}</td>
                  <td className="py-2 px-2.5 text-gray-400 dark:text-gray-500">
                    {w.attacks}{w.count > 1 ? ` ×${w.count}` : ''}
                  </td>
                  <td className="py-2 px-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{pct(hitP)}</td>
                  <td className="py-2 px-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{pct(woundP)}</td>
                  <td className="py-2 px-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{pct(saveFailP)}</td>
                  <td className="py-2 px-2.5 text-right tabular-nums font-medium text-gray-700 dark:text-gray-200">{pct(chainProb, 1)}</td>
                  <td className="py-2 px-2.5 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                    {expectedDmg.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
