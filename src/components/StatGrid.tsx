import type { Unit } from '../types/roster'

interface Props {
  unitA: Unit
  unitB: Unit
}

function StatCard({ label, valA, valB }: { label: string; valA: string; valB: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-2.5 text-center border border-gray-200 dark:border-gray-700">
      <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</div>
      <div className="flex justify-center gap-1.5 items-baseline">
        <span className="text-base font-medium text-emerald-700 dark:text-emerald-400">{valA}</span>
        <span className="text-xs text-gray-300 dark:text-gray-600">/</span>
        <span className="text-base font-medium text-blue-700 dark:text-blue-400">{valB}</span>
      </div>
    </div>
  )
}

export function StatGrid({ unitA, unitB }: Props) {
  const stats: Array<{ label: string; a: string; b: string }> = [
    { label: 'M', a: unitA.stats.M, b: unitB.stats.M },
    { label: 'T', a: String(unitA.stats.T), b: String(unitB.stats.T) },
    { label: 'SV', a: `${unitA.stats.SV}+`, b: `${unitB.stats.SV}+` },
    { label: 'W', a: String(unitA.stats.W), b: String(unitB.stats.W) },
    { label: 'OC', a: String(unitA.stats.OC), b: String(unitB.stats.OC) },
  ]

  const showInvuln = unitA.stats.invuln !== null || unitB.stats.invuln !== null

  return (
    <div className={`grid gap-2 mb-5 ${showInvuln ? 'grid-cols-6' : 'grid-cols-5'}`}>
      {stats.map(s => (
        <StatCard key={s.label} label={s.label} valA={s.a} valB={s.b} />
      ))}
      {showInvuln && (
        <StatCard
          label="Invuln"
          valA={unitA.stats.invuln ? `${unitA.stats.invuln}++` : '—'}
          valB={unitB.stats.invuln ? `${unitB.stats.invuln}++` : '—'}
        />
      )}
    </div>
  )
}
