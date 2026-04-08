import type { WeaponResult } from '../types/roster'
import { DiceChainBars } from './DiceChainBars'
import { DistributionChart } from './DistributionChart'

interface Props {
  result: WeaponResult
  spikeMode?: boolean
}

export function WeaponBreakdown({ result, spikeMode = false }: Props) {
  const { weapon: w, hitP, woundP, saveFailP, fnpFailP, chainProb, expectedDmg, dist } = result
  const kws = w.keywords
    ? w.keywords.split(',').map(k => k.trim()).filter(k => k && k !== '-')
    : []

  return (
    <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{w.name}</span>
        <div className="flex gap-1 flex-wrap">
          {kws.map(k => (
            <span
              key={k}
              className="text-[10px] text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5"
            >
              {k}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[200px_1fr] gap-4 p-3 items-start bg-white dark:bg-gray-900/30">
        <DiceChainBars
          hitP={hitP}
          woundP={woundP}
          saveFailP={saveFailP}
          fnpFailP={fnpFailP}
          chainProb={chainProb}
          expectedDmg={expectedDmg}
          spikeMode={spikeMode}
        />
        <DistributionChart dist={dist} weaponName={w.name} />
      </div>
    </div>
  )
}
