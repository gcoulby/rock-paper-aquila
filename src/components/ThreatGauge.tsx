import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface Props {
  totalExpectedDmg: number
  totalHp: number
}

function getThreatLabel(ratio: number): string {
  if (ratio < 0.2) return 'Poor threat'
  if (ratio < 0.4) return 'Low threat'
  if (ratio < 0.6) return 'Moderate threat'
  if (ratio < 0.8) return 'Good threat'
  return 'High threat'
}

function getThreatColor(ratio: number): string {
  if (ratio < 0.33) return '#E24B4A'
  if (ratio < 0.66) return '#EF9F27'
  return '#639922'
}

// Two overlaid Pie arcs: background track (full 180°) + value arc (ratio × 180°).
// This gives a full sweep from 0 → 100% across the entire semicircle.
export function ThreatGauge({ totalExpectedDmg, totalHp }: Props) {
  const ratio = Math.min(totalExpectedDmg / Math.max(totalHp, 1), 1)
  const color = getThreatColor(ratio)
  const label = getThreatLabel(ratio)

  const trackData = [{ value: 1 }]
  const valueData = [{ value: ratio }, { value: 1 - ratio }]

  const commonProps = {
    cx: '50%',
    cy: '100%',
    startAngle: 180,
    endAngle: 0,
    innerRadius: '55%',
    outerRadius: '80%',
    dataKey: 'value' as const,
    strokeWidth: 0,
    isAnimationActive: true,
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={120}>
        <PieChart>
          {/* Background track — always full grey semicircle */}
          <Pie {...commonProps} data={trackData}>
            <Cell fill="var(--gauge-track)" />
          </Pie>
          {/* Value arc — spans ratio × 180° */}
          <Pie {...commonProps} data={valueData}>
            <Cell fill={color} />
            <Cell fill="transparent" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center text-sm mt-1 font-medium" style={{ color }}>
        {label}
      </div>
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-0.5">
        {totalExpectedDmg.toFixed(1)} expected dmg / {totalHp} HP
      </div>
    </div>
  )
}
