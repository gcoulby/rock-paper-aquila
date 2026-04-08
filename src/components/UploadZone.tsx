import { useRef, useState } from 'react'
import type { Army } from '../types/roster'
import { loadRosterFile } from '../lib/parseRoster'

interface Props {
  side: 'A' | 'B'
  army: Army | null
  onLoad: (army: Army) => void
}

export function UploadZone({ side, army, onLoad }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const label = side === 'A' ? 'Army A' : 'Army B'

  const borderColor = army
    ? 'border-emerald-500'
    : dragging
    ? 'border-gray-400 dark:border-gray-500'
    : 'border-gray-300 dark:border-gray-600'
  const bg = army
    ? 'bg-emerald-50 dark:bg-emerald-950/30'
    : 'bg-white dark:bg-gray-800/50'

  async function handleFile(file: File) {
    setError(null)
    try {
      const loaded = await loadRosterFile(file)
      onLoad(loaded)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse roster')
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
        {label}
      </div>
      <div
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${borderColor} ${bg}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {army ? (
          <>
            <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{army.name}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">{army.units.length} units loaded</div>
          </>
        ) : (
          <div className="text-sm text-gray-400 dark:text-gray-500">Drop .ros / .rosz or click to browse</div>
        )}
        <input ref={inputRef} type="file" accept=".ros,.rosz" className="hidden" onChange={onChange} />
      </div>
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  )
}
