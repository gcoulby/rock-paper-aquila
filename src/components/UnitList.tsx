import type { Unit } from '../types/roster'
import { UnitButton } from './UnitButton'

interface Props {
  units: Unit[]
  selectedIndex: number | null
  side: 'A' | 'B'
  onSelect: (index: number) => void
}

export function UnitList({ units, selectedIndex, side, onSelect }: Props) {
  if (units.length === 0) return null
  return (
    <div className="flex flex-col gap-1 mt-2 overflow-y-auto max-h-[60vh]">
      {units.map((unit, i) => (
        <UnitButton
          key={i}
          unit={unit}
          selected={selectedIndex === i}
          side={side}
          onClick={() => onSelect(i)}
        />
      ))}
    </div>
  )
}
