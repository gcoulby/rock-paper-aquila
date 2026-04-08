import type { Unit } from '../types/roster'

interface Props {
  unit: Unit
  selected: boolean
  side: 'A' | 'B'
  onClick: () => void
}

export function UnitButton({ unit, selected, side, onClick }: Props) {
  const selectedStyle =
    side === 'A'
      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
      : 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300'
  const defaultStyle =
    'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-800'

  return (
    <button
      className={`w-full text-left rounded-lg px-3 py-2 text-sm border transition-all ${selected ? selectedStyle : defaultStyle}`}
      onClick={onClick}
    >
      <div className="font-medium truncate">{unit.name}</div>
      <div className="text-xs opacity-50 mt-0.5">
        {unit.pts}pts · {unit.modelCount} model{unit.modelCount > 1 ? 's' : ''}
      </div>
    </button>
  )
}
