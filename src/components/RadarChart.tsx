import {
  RadarChart as ReRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Unit } from '../types/roster'

interface Props {
  unitA: Unit
  unitB: Unit
}

const MAX_M = 14
const MAX_T = 10
const MAX_SV = 7
const MAX_W = 20
const MAX_OC = 5

function norm(v: number, max: number): number {
  return Math.min(v, max) / max * 10
}

type StatKey = 'Move' | 'Toughness' | 'Save' | 'Wounds' | 'OC'

const axes: StatKey[] = ['Move', 'Toughness', 'Save', 'Wounds', 'OC']

function formatRaw(key: StatKey, v: number): string {
  if (key === 'Move') return `${v}"`
  if (key === 'Save') return `${v}+`
  return String(v)
}

interface ChartEntry {
  stat: StatKey
  A: number
  B: number
  rawA: number
  rawB: number
}

interface TooltipItem {
  dataKey?: string | number
  name?: string | number
  payload?: ChartEntry
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipItem[] }) {
  if (!active || !payload?.length) return null
  const entry = payload[0]?.payload
  if (!entry) return null
  const nameA = payload.find(p => p.dataKey === 'A')?.name ?? 'A'
  const nameB = payload.find(p => p.dataKey === 'B')?.name ?? 'B'
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-md"
      style={{
        background: 'var(--tooltip-bg)',
        borderColor: 'var(--tooltip-border)',
        color: 'var(--tooltip-text)',
      }}
    >
      <div className="font-semibold mb-1">{entry.stat}</div>
      <div className="flex flex-col gap-0.5">
        <span style={{ color: '#1D9E75' }}>
          {nameA}: {formatRaw(entry.stat, entry.rawA)}
        </span>
        <span style={{ color: '#185FA5' }}>
          {nameB}: {formatRaw(entry.stat, entry.rawB)}
        </span>
      </div>
    </div>
  )
}

export function RadarChartViz({ unitA, unitB }: Props) {
  const rawA: Record<StatKey, number> = {
    Move: parseInt(unitA.stats.M) || 6,
    Toughness: unitA.stats.T,
    Save: unitA.stats.SV,
    Wounds: unitA.stats.W * unitA.modelCount,
    OC: unitA.stats.OC * unitA.modelCount,
  }
  const rawB: Record<StatKey, number> = {
    Move: parseInt(unitB.stats.M) || 6,
    Toughness: unitB.stats.T,
    Save: unitB.stats.SV,
    Wounds: unitB.stats.W * unitB.modelCount,
    OC: unitB.stats.OC * unitB.modelCount,
  }

  const chartData: ChartEntry[] = axes.map(key => ({
    stat: key,
    A: norm(rawA[key], key === 'Save' ? MAX_SV : key === 'Move' ? MAX_M : key === 'Toughness' ? MAX_T : key === 'Wounds' ? MAX_W : MAX_OC),
    B: norm(rawB[key], key === 'Save' ? MAX_SV : key === 'Move' ? MAX_M : key === 'Toughness' ? MAX_T : key === 'Wounds' ? MAX_W : MAX_OC),
    rawA: rawA[key],
    rawB: rawB[key],
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <ReRadarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="var(--chart-grid)" />
          <PolarAngleAxis dataKey="stat" tick={{ fontSize: 11, fill: 'var(--chart-text)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name={unitA.name}
            dataKey="A"
            stroke="#1D9E75"
            fill="#1D9E75"
            fillOpacity={0.15}
          />
          <Radar
            name={unitB.name}
            dataKey="B"
            stroke="#185FA5"
            fill="#185FA5"
            fillOpacity={0.15}
          />
        </ReRadarChart>
      </ResponsiveContainer>
      <div className="flex gap-3 mt-2 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#1D9E75]" />
          <span className="text-gray-400 dark:text-gray-500">
            {unitA.name.split(' ').slice(0, 2).join(' ')}
          </span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#185FA5]" />
          <span className="text-gray-400 dark:text-gray-500">
            {unitB.name.split(' ').slice(0, 2).join(' ')}
          </span>
        </span>
      </div>
    </div>
  )
}
