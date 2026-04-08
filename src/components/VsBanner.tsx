import type { Unit } from '../types/roster'

interface Props {
  unitA: Unit
  unitB: Unit
}

export function VsBanner({ unitA, unitB }: Props) {
  const defSub = (u: Unit) => {
    const parts = [`T${u.stats.T}`, `${u.stats.SV}+ SV`]
    if (u.stats.invuln) parts.push(`${u.stats.invuln}++ inv`)
    if (u.stats.fnp) parts.push(`FNP ${u.stats.fnp}+`)
    return parts.join(' · ')
  }

  return (
    <div className="flex items-center gap-4 mb-5 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{unitA.name}</div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {unitA.modelCount} model{unitA.modelCount > 1 ? 's' : ''} · {unitA.pts}pts
        </div>
      </div>
      <div className="text-lg font-medium text-gray-300 dark:text-gray-600 px-2">vs</div>
      <div className="flex-1 text-right">
        <div className="text-sm font-medium text-blue-700 dark:text-blue-400">{unitB.name}</div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {unitB.modelCount} model{unitB.modelCount > 1 ? 's' : ''} · {unitB.pts}pts · {defSub(unitB)}
        </div>
      </div>
    </div>
  )
}
