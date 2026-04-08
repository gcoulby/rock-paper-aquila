import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  dist: number[]
  weaponName: string
}

export function DistributionChart({ dist }: Props) {
  const capped = dist.slice(0, 21)
  const data = capped.map((prob, i) => ({
    dmg: i,
    prob: parseFloat((prob * 100).toFixed(1)),
  }))

  return (
    <div>
      <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1.5">Damage distribution</div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <XAxis dataKey="dmg" tick={{ fontSize: 10, fill: 'var(--chart-text)' }} interval={0} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--chart-text)' }} unit="%" />
          <Tooltip
            formatter={(v) => [`${v}%`, 'Prob']}
            labelFormatter={(l) => `${l} dmg`}
            contentStyle={{
              fontSize: 11,
              background: 'var(--tooltip-bg)',
              borderColor: 'var(--tooltip-border)',
              color: 'var(--tooltip-text)',
            }}
          />
          <Bar dataKey="prob" radius={[2, 2, 0, 0]}>
            {data.map((_entry, i) => (
              <Cell key={i} fill={i === 0 ? 'var(--gauge-track)' : '#1D9E75'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
