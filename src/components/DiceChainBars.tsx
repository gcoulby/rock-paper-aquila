interface Props {
  hitP: number
  woundP: number
  saveFailP: number
  fnpFailP: number
  chainProb: number
  expectedDmg: number
  spikeMode?: boolean
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-[11px] text-gray-400 dark:text-gray-500 w-22.5 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-sm h-3 overflow-hidden">
        <div
          className="h-3 rounded-sm transition-all duration-300"
          style={{ width: `${(value * 100).toFixed(0)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] text-gray-400 dark:text-gray-500 w-9 text-right tabular-nums">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  )
}

export function DiceChainBars({ hitP, woundP, saveFailP, fnpFailP, chainProb, expectedDmg, spikeMode = false }: Props) {
  return (
    <div>
      <ProbBar label="To hit" value={hitP} color="#1D9E75" />
      <ProbBar label="To wound" value={woundP} color="#0F6E56" />
      <ProbBar label="Save fails" value={saveFailP} color="#185FA5" />
      {fnpFailP < 1 && (
        <ProbBar label="FNP fails" value={fnpFailP} color="#BA7517" />
      )}
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="text-[11px] text-gray-400 dark:text-gray-500">Chain probability</div>
        <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{(chainProb * 100).toFixed(1)}%</div>
        <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
          {spikeMode ? 'Spike damage' : 'Expected damage'}
        </div>
        <div className={`text-lg font-semibold ${spikeMode ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {expectedDmg.toFixed(2)}
        </div>
      </div>
    </div>
  )
}
