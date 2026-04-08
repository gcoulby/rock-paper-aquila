interface Props {
  unitAName: string
  unitBName: string
  direction: 'AvsB' | 'BvsA'
  onChange: (dir: 'AvsB' | 'BvsA') => void
}

export function DirectionToggle({ unitAName, unitBName, direction, onChange }: Props) {
  const shortA = unitAName.split(' ').slice(0, 2).join(' ')
  const shortB = unitBName.split(' ').slice(0, 2).join(' ')

  const active = 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-800 dark:text-blue-300 font-medium'
  const inactive = 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'

  return (
    <div className="flex gap-1.5 mb-4">
      <button
        className={`px-3.5 py-1.5 rounded-lg border text-sm transition-colors ${direction === 'AvsB' ? active : inactive}`}
        onClick={() => onChange('AvsB')}
      >
        Attacker: {shortA}
      </button>
      <button
        className={`px-3.5 py-1.5 rounded-lg border text-sm transition-colors ${direction === 'BvsA' ? active : inactive}`}
        onClick={() => onChange('BvsA')}
      >
        Attacker: {shortB}
      </button>
    </div>
  )
}
