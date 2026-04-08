# Rock Paper Aquila — Claude Code Instructions

## Project overview

Build a Warhammer 40,000 10th Edition unit matchup calculator called **Rock Paper Aquila** (alt name: Rock Paper Chainsword). The user uploads two BattleScribe army roster files (`.ros` or `.rosz`), selects one unit from each army, and sees a detailed statistical breakdown of how those units match up against each other — including dice chain probabilities, damage distributions, radar charts, and an overall threat gauge.

A working reference implementation exists as `rock_paper_aquila.html` alongside this file. Use it as the source of truth for:
- The XML parsing logic
- The dice probability engine
- The weapon keyword handling
- The overall UX flow

Your job is to port this into a clean, fully componentised TypeScript + React + Tailwind 4 application.

---

## Tech stack

- **React 19** with TypeScript (strict mode)
- **Tailwind CSS v4** (use `@import "tailwindcss"` — no config file needed unless customising)
- **Vite** as the build tool
- **JSZip** for `.rosz` decompression
- **Recharts** for radar chart and damage distribution bar charts
- **No other UI libraries** — build components from scratch using Tailwind

Scaffold with:
```bash
npm create vite@latest rock-paper-aquila -- --template react-ts
cd rock-paper-aquila
npm install
npm install jszip recharts
npm install -D tailwindcss @tailwindcss/vite
```

Add to `vite.config.ts`:
```ts
import tailwindcss from '@tailwindcss/vite'
plugins: [react(), tailwindcss()]
```

Add to `src/index.css`:
```css
@import "tailwindcss";
```

---

## Project structure

```
src/
  types/
    roster.ts          # All shared types
  lib/
    parseRoster.ts     # XML parsing — .ros and .rosz → Army
    diceEngine.ts      # Probability calculations
    exportPdf.ts       # Army stat sheet PDF export
  components/
    UploadZone.tsx     # File drop/click upload for one army
    UnitList.tsx       # Scrollable list of units for one army
    UnitButton.tsx     # Single selectable unit row
    VsBanner.tsx       # Selected unit A vs unit B header
    StatGrid.tsx       # M/T/SV/W/OC comparison cards
    RadarChart.tsx     # Recharts radar comparing unit stats
    ThreatGauge.tsx    # Semicircular gauge (Recharts PieChart)
    WeaponSummaryTable.tsx  # All weapons with avg stats in one table
    WeaponBreakdown.tsx     # Per-weapon dice chain + dist chart
    DiceChainBars.tsx  # Hit/wound/save/FNP horizontal probability bars
    DistributionChart.tsx   # Recharts bar chart of damage distribution
    DirectionToggle.tsx     # Swap attacker/defender
    ArmyStatSheet.tsx  # Full army-vs-army export view
    ExportButton.tsx   # Triggers PDF generation
  App.tsx
  main.tsx
  index.css
```

---

## Types (`src/types/roster.ts`)

```ts
export interface UnitStats {
  M: string
  T: number
  SV: number
  W: number
  LD: string
  OC: number
  invuln: number | null
  fnp: number | null
}

export interface Weapon {
  name: string
  isRanged: boolean
  attacks: string          // raw string e.g. "D6", "2", "D3"
  attackVal: number        // expected value
  isDice: boolean
  diceN: number
  hitProb: number          // 0–1
  hitSkill: string         // e.g. "4+"
  S: number
  AP: number
  D: string                // raw damage string
  keywords: string
  count: number            // how many models carry this weapon
  // keyword flags
  torrent: boolean
  blast: boolean
  rapidFire: number        // 0 if not rapid fire, else X
  sustainedHits: number
  devastatingWounds: boolean
  twinLinked: boolean
  lethalHits: boolean
  antiKeyword: RegExpMatchArray | null
  heavyBonus: boolean
}

export interface Unit {
  name: string
  stats: UnitStats
  weapons: Weapon[]
  modelCount: number
  pts: number
}

export interface Army {
  name: string
  units: Unit[]
}

export interface WeaponResult {
  weapon: Weapon
  hitP: number
  woundP: number
  saveFailP: number
  fnpFailP: number
  chainProb: number
  expectedDmg: number
  dist: number[]           // probability distribution array indexed by damage dealt
  maxPossibleDmg: number
  baseAttacks: number
}
```

---

## Parsing logic (`src/lib/parseRoster.ts`)

This is the most important file. Port faithfully from the HTML reference.

```ts
import JSZip from 'jszip'
import type { Army, Unit, UnitStats, Weapon } from '../types/roster'

export async function loadRosterFile(file: File): Promise<Army> {
  const name = file.name.toLowerCase()
  let xmlText: string
  if (name.endsWith('.rosz')) {
    const zip = await JSZip.loadAsync(file)
    const rosFile = Object.values(zip.files).find(f => f.name.endsWith('.ros'))
    if (!rosFile) throw new Error('No .ros file found inside .rosz')
    xmlText = await rosFile.async('text')
  } else {
    xmlText = await file.text()
  }
  return parseRoster(xmlText)
}
```

Key parsing rules to replicate exactly:

**Unit filtering** — skip selections named `Battle Size`, `Detachment`, `Show/Hide Options`. Only process `type="unit"`, `type="model"`, or `type="upgrade"` at the top level of the force's selections.

**Stats** — read from `profile[typeName="Unit"]` > `characteristics`. Parse M, T, SV, W, LD, OC. T and SV are integers, W is integer, OC is integer.

**Invulnerable save** — check profile names containing "Invulnerable Save" and extract the number with `/\((\d+)\+\)/`. Also scan Abilities profile descriptions for `/(\d+)\+ invulnerable save/i`.

**Feel No Pain** — scan rule names AND ability descriptions for `/Feel No Pain (\d+)\+/i`.

**Weapons** — collect from:
1. Direct `profiles > profile[typeName="Ranged Weapons"]` and `[typeName="Melee Weapons"]` on the selection
2. Nested `selections > selection > profiles > profile[...]` (wargear sub-selections)

Deduplicate by weapon name. Carry the `number` attribute from the sub-selection as `weapon.count`.

**Model count** — sum `number` attribute across `selection[type="model"]` children. Default to 1.

**Hit probability**:
- If `hitSkill === "N/A"` or weapon has `torrent` keyword → `hitProb = 1.0`
- Otherwise parse the integer from the `+` skill string: `hitProb = (7 - n) / 6`

**Attack value**:
- `D6` → 3.5
- `D3` → 2.0
- `D6+N` → 3.5 + N (e.g. `D6+3` → 6.5)
- `D3+N` → 2.0 + N
- Otherwise `parseFloat`

**Weapon name cleaning** — strip enhancement/relic suffixes in parentheses from weapon names before display and deduplication. The BattleScribe XML sometimes appends the enhancement name, e.g. `"High-output burst cannon (Superior Craftmanship)"`. Strip anything matching ` \([^)]+\)$` for display purposes, but keep the full name internally for deduplication since the same base weapon may appear with different suffixes on different units.

---

---

## Dice engine (`src/lib/diceEngine.ts`)

Port the probability functions exactly. Key functions:

```ts
export function woundRoll(S: number, T: number): number {
  if (S >= T * 2) return 5 / 6
  if (S > T) return 4 / 6
  if (S === T) return 3 / 6
  if (S < T && S * 2 >= T) return 2 / 6
  return 1 / 6
}

export function saveFailProb(AP: number, SV: number, invuln: number | null): number {
  const modSV = SV - AP
  let effective = modSV
  if (invuln !== null && invuln < effective) effective = invuln
  if (effective > 6) return 1.0
  if (effective < 2) return 0
  return (effective - 1) / 6
}
```

**Keyword modifiers to apply** (in order):

1. **Sustained Hits X**: `hitPAdj = hitP + hitP * (1/6) * X`
2. **Twin-Linked**: `woundPAdj = woundP + (1 - woundP) * woundP`
3. **Lethal Hits**: `woundPAdj = (1/6) + (5/6) * woundP`
4. **Devastating Wounds**: `saveAdj = (1/6) * 1.0 + (5/6) * woundPAdj * saveFailP`
5. **FNP**: applied last — `fnpFailP = (7 - fnp) / 6` if present, else 1.0

**Chain probability**: `hitP * woundP * saveFailP * fnpFailP`

**Damage distribution** — iterative convolution:
```ts
const maxDmg = target.stats.W * (target.modelCount || 1)
const dist = new Array(maxDmg + 1).fill(0)
dist[0] = 1
const numAttacks = Math.round(baseAttacks)
for (let i = 0; i < numAttacks; i++) {
  const newDist = new Array(maxDmg + 1).fill(0)
  for (let d = 0; d <= maxDmg; d++) {
    if (!dist[d]) continue
    newDist[d] += dist[d] * (1 - chainProb)
    for (let v = 0; v < dmgValues.length; v++) {
      const dmg = dmgValues[v]
      const p = dmgProbs[v] * chainProb
      const newD = Math.min(d + dmg, maxDmg)
      newDist[newD] += dist[d] * p
    }
  }
  for (let d = 0; d <= maxDmg; d++) dist[d] = newDist[d]
}
```

Damage parsing: `D6` → values [1,2,3,4,5,6] each p=1/6. `D3` → [1,2,3] each p=1/3. Fixed → single value.

---

## Component specs

### `UploadZone`

Props: `{ side: 'A' | 'B', army: Army | null, onLoad: (army: Army) => void }`

- Drag and drop or click to open file picker
- Accept `.ros` and `.rosz`
- Show army name + unit count when loaded
- Green border + background tint when loaded, dashed border when empty
- Handle errors gracefully (show error message inline)

### `UnitList`

Props: `{ units: Unit[], selectedIndex: number | null, side: 'A' | 'B', onSelect: (index: number) => void }`

- Scrollable list, max height ~60vh
- Each unit shows name + pts cost
- Selected unit highlighted (green tint for A, blue tint for B)

### `VsBanner`

Props: `{ unitA: Unit, unitB: Unit }`

- Side-by-side unit names with key defensive stats of the defender
- Show T, SV, invuln (if any), FNP (if any)

### `StatGrid`

Props: `{ unitA: Unit, unitB: Unit }`

- Grid of cards showing M, T, SV, W, OC side by side
- Green for A value, blue for B value
- Add invuln card if either unit has it

### `RadarChart`

Props: `{ unitA: Unit, unitB: Unit }`

Uses Recharts `RadarChart`. Normalise these stats to 0–10:
- Move (max 14)
- Toughness (max 10)
- Save (inverted: 8 - SV, max 7)
- Wounds × model count (max 20)
- OC × model count (max 5)

Two datasets: attacker (green #1D9E75) and defender (blue #185FA5).

### `ThreatGauge`

Props: `{ totalExpectedDmg: number, totalHp: number }`

Recharts `PieChart` (doughnut style, 180° sweep). Threat ratio = `min(totalExpectedDmg / totalHp, 1)`.
Colour: red below 0.33, amber 0.33–0.66, green above 0.66.
Label below: "Poor threat" / "Low threat" / "Moderate threat" / "Good threat" / "High threat" with the raw numbers.

### `WeaponSummaryTable`

Props: `{ results: WeaponResult[], defenderName: string }`

Table columns: Weapon | Type | Attacks | Hit% | Wound% | Save fail% | Chain% | Exp dmg

- Keyword tags shown inline next to weapon name (small pills, max 2)
- Expected damage column highlighted green
- Rows sorted: highest expected damage first

### `WeaponBreakdown`

Props: `{ result: WeaponResult }`

One card per weapon. Contains:
- `DiceChainBars` (left column)
- `DistributionChart` (right column)
- Keyword pills along the top

### `DiceChainBars`

Props: `{ hitP: number, woundP: number, saveFailP: number, fnpFailP: number, chainProb: number, expectedDmg: number }`

Horizontal bar rows: To hit / To wound / Save fails / FNP fails (only if < 1.0). Each bar is a simple div with percentage width. Then chain% and expected damage as summary numbers below.

### `DistributionChart`

Props: `{ dist: number[], weaponName: string }`

Recharts `BarChart`. X-axis is damage dealt (0, 1, 2, ...). Y-axis is probability %. Cap display at 20 bars. Bar at 0 is grey (miss/no damage), rest are green.

### `DirectionToggle`

Props: `{ unitAName: string, unitBName: string, direction: 'AvsB' | 'BvsA', onChange: (dir: 'AvsB' | 'BvsA') => void }`

Two tab-style buttons showing which unit is attacking.

---

## App state (`App.tsx`)

```ts
const [armyA, setArmyA] = useState<Army | null>(null)
const [armyB, setArmyB] = useState<Army | null>(null)
const [selIdxA, setSelIdxA] = useState<number | null>(null)
const [selIdxB, setSelIdxB] = useState<number | null>(null)
const [direction, setDirection] = useState<'AvsB' | 'BvsA'>('AvsB')
```

Derive attacker/defender from direction. Compute all weapon results via `diceEngine` when both units are selected. Pass results down to display components.

Layout:
1. Two-column upload + unit list area at the top (or side panel on desktop)
2. Matchup area below (or main panel) — only visible when both units selected
3. Matchup area order: DirectionToggle → VsBanner → StatGrid → charts row (Radar + Gauge) → WeaponSummaryTable → per-weapon WeaponBreakdown cards

---

## Tailwind colour conventions

Use these consistently:
- Army A / attacker: `text-emerald-800`, `bg-emerald-50`, `border-emerald-500`
- Army B / defender: `text-blue-800`, `bg-blue-50`, `border-blue-500`
- Neutral cards: `bg-gray-50`, `border-gray-200`
- Danger/low threat: `text-red-600`
- Warning/mid threat: `text-amber-600`
- Success/high threat: `text-green-600`

---

## Army stat sheet export

When both armies are loaded (no unit selection required), an **Export stat sheet** button is visible. Clicking it generates a PDF showing every unit from army A matched against every unit from army B, and vice versa.

### Layout (matches the reference PDF `Rock_Paper_Aquila___WH40K_Matchup_Calculator.pdf`)

Header: army A name vs army B name, date, unit count.

Per unit from army A, a card showing:
- Unit name, pts, model count, full stat line (M / T / SV / W / LD / OC / invuln / FNP)
- **Fight These** — top 3 units from army B ranked by threat%, each with a weapon breakdown table
- **Avoid These** — bottom 3 units from army B ranked by threat%, each with a weapon breakdown table
- **All Matchups** — compact two-column list of every army B unit ranked by threat%

Then a divider, and the same structure repeated for army B vs army A.

### Threat% definition

```ts
threatPct = totalExpectedDmg / (target.stats.W * target.modelCount) * 100
```

Can exceed 100% — means the attacker is expected to deal more than the target's full HP pool. Display as e.g. `423.6%` alongside the raw `21.2 / 5 HP`.

### PDF generation

Use `jsPDF` and `jspdf-autotable`:

```bash
npm install jspdf jspdf-autotable
```

Build the PDF entirely in JS — do not use `html2canvas` or DOM screenshots. Construct everything programmatically using jsPDF's text and `autoTable` APIs.

Font sizes: title 16pt bold, unit heading 12pt bold, stat line 9pt, table headers 8pt bold, table rows 8pt.

Colour the Exp Dmg column values green. Colour threat% red/amber/green using the same thresholds as the gauge (below 33% → red, 33–66% → amber, above 66% → green).

The export function lives in `src/lib/exportPdf.ts` and takes `{ armyA: Army, armyB: Army }`. It is called from `ExportButton.tsx`.

### `ExportButton` component

Props: `{ armyA: Army | null, armyB: Army | null }`

Disabled until both armies are loaded. Shows a spinner during generation. On completion, triggers a browser download of `rock-paper-aquila-{armyAName}-vs-{armyBName}.pdf`.

---

## Specific implementation notes

**Do not use `any` types.** Everything should be strictly typed.

**The parsing and dice engine are the most critical parts.** If anything is ambiguous, refer to the HTML reference file. The probability calculations must match exactly.

**Recharts gotcha**: wrap every chart in a `<ResponsiveContainer width="100%" height={200}>` (or appropriate height). Recharts needs explicit heights.

**JSZip**: import as `import JSZip from 'jszip'` — it's a default export.

**Weapon deduplication**: when extracting weapons from nested selections, check `weapons.find(w => w.name === newWeapon.name)` before pushing. Same weapon profile can appear on multiple models.

**Model count edge case**: if no `selection[type="model"]` children exist, default to 1. Some single-model units (characters) have no model sub-selections.

**Known limitations** (document these in a `LIMITATIONS.md` or README comment — do not hack around them unless asked):
- Rapid Fire attack doubling at half range requires knowing the in-game distance (not in the roster). Show the base attack count; note that RF weapons may fire more at close range.
- Blast weapon attack scaling (add 1 per 5 models in target unit) cannot be calculated without knowing the target unit size mid-combat. Use base attacks.
- Army-wide rules (e.g. Orks' Waaagh!, Tau's For the Greater Good) are not automatically applied. These would need a "buffs active" toggle layer added later.
- Sustained Hits from detachment rules (not weapon keywords) are not parsed from the detachment selection.

---

## File to preserve

Keep `rock_paper_aquila.html` in the project root as a reference. Do not delete it.

---

## Running the app

```bash
npm run dev
```

The app runs at `http://localhost:5173`. No backend required — everything runs client-side.