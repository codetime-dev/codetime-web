// Deterministic fake-data generators for the public demo dashboard.
//
// The generators are seeded so the same calendar / chart shape appears across
// requests; this keeps the demo visually stable and lets us showcase a
// realistic-looking developer profile without depending on the upstream API.
//
// Design goals (vs. v1 which produced a flat, uniformly-random trend):
//   - autocorrelated daily totals — momentum carries between days
//   - slow seasonal drift over ~90-day cycles + a 14-day "energy" envelope
//   - workspace epochs: each project has phases of intense focus + dormancy
//   - language allocation follows workspaces (server work → python/go,
//     web work → typescript/vue), with some incidental scripting
//   - explicit binge days, sick days, vacation runs

import seedrandom from 'seedrandom'

const SEED = 'codetime-demo-v2'
const DAY_MS = 24 * 60 * 60 * 1000

type Rng = () => number

type LangMix = Partial<Record<string, number>>

type WorkspaceProfile = {
  name: string
  // affinity score 0..1 controlling the weekly chance of being touched
  weight: number
  // per-workspace language mix (sum normalised at use)
  languages: LangMix
}

const WORKSPACE_PROFILES: WorkspaceProfile[] = [
  {
    name: 'codetime-web-v3',
    weight: 1,
    languages: { typescript: 0.45, vue: 0.35, typescriptreact: 0.1, markdown: 0.1 },
  },
  {
    name: 'codetime-server-v3',
    weight: 0.85,
    languages: { python: 0.55, go: 0.2, markdown: 0.1, typescript: 0.15 },
  },
  {
    name: 'observable-plot-playground',
    weight: 0.55,
    languages: { typescript: 0.55, typescriptreact: 0.25, markdown: 0.2 },
  },
  {
    name: 'nuxt-experiments',
    weight: 0.42,
    languages: { vue: 0.5, typescript: 0.35, markdown: 0.15 },
  },
  {
    name: 'roku-ui',
    weight: 0.34,
    languages: { vue: 0.4, typescript: 0.45, markdown: 0.15 },
  },
  {
    name: 'site-of-mine',
    weight: 0.24,
    languages: { typescript: 0.35, vue: 0.3, markdown: 0.2, rust: 0.15 },
  },
]

const PLATFORMS: { by: string, weight: number }[] = [
  { by: 'darwin', weight: 1 },
  { by: 'linux', weight: 0.42 },
  { by: 'windows', weight: 0.18 },
]

const EDITORS: { by: string, weight: number }[] = [
  { by: 'vscode', weight: 1 },
  { by: 'cursor', weight: 0.32 },
  { by: 'jetbrains', weight: 0.18 },
]

// ---------------------------------------------------------------------------
// Calendar helpers
// ---------------------------------------------------------------------------

function isWesternHoliday(date: Date): boolean {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth() + 1
  const d = date.getUTCDate()

  if (
    (m === 1 && d === 1)
    || (m === 7 && d === 4)
    || (m === 12 && d === 25)
    || (m === 12 && d === 26)
  ) {
    return true
  }

  if (m === 11) {
    const firstDay = new Date(Date.UTC(y, 10, 1)).getUTCDay()
    const offset = (11 - firstDay) % 7
    const thanksgiving = 1 + offset + 7 * 3
    if (d === thanksgiving) {
      return true
    }
  }

  if (m === 9) {
    const firstDay = new Date(Date.UTC(y, 8, 1)).getUTCDay()
    const laborDay = 1 + ((8 - firstDay) % 7)
    if (d === laborDay) {
      return true
    }
  }

  return false
}

function utcDayStart(offsetDays: number): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - offsetDays)
  return d
}

// Box–Muller transform — gives us gaussian noise from the uniform RNG. Used
// for the "energy" envelope so day-to-day totals cluster naturally instead
// of bouncing across the full range.
function gauss(rng: Rng): number {
  const u = 1 - rng()
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

// ---------------------------------------------------------------------------
// Daily total signal
// ---------------------------------------------------------------------------
//
// Generates a per-day "intensity" in [0, ~1.4] using a slow seasonal carrier
// plus an AR(1) "energy" envelope. The signal is built ONCE per generator
// run and cached against the seed so per-bucket allocators can sample
// consistent totals.

type DayState = {
  date: Date
  // 0 on rest days, otherwise minutes of coding for that day
  totalMinutes: number
  // raw intensity 0..~1.4 used downstream to bias bucket weighting
  intensity: number
  // weekday number for downstream weekday/weekend logic
  dow: number
  // multiplicative factor applied to the workspace cluster (1.0 = baseline)
  focusBoost: number
}

let cachedTimeline: DayState[] | null = null
let cachedTimelineLimit = 0

function buildTimeline(limit: number): DayState[] {
  if (cachedTimeline && cachedTimelineLimit >= limit) {
    return cachedTimeline.slice(0, limit)
  }

  const rng = seedrandom(`${SEED}:timeline`)
  // Pre-roll the RNG a few times — seedrandom's first draws cluster slightly.
  for (let i = 0; i < 16; i++) {
    rng()
  }

  const span = Math.max(limit, 365)
  const states: DayState[] = []

  // AR(1) energy: today = ρ·yesterday + σ·gauss. ρ near 0.78 gives 3–5 day
  // runs of "high" or "low" energy without locking into long monotone trends.
  const rho = 0.78
  const sigma = 0.55
  let energy = 0

  // A handful of multi-day events tucked into the year — vacation runs,
  // crunch sprints, conference weeks. Indexed by `offsetDays` (0 = today).
  const events: { from: number, to: number, factor: number }[] = [
    { from: 18, to: 31, factor: 1.35 }, // crunch — 2 weeks ago
    { from: 64, to: 73, factor: 0.05 }, // vacation
    { from: 120, to: 124, factor: 0.2 }, // conference week
    { from: 178, to: 188, factor: 1.4 }, // launch sprint
    { from: 245, to: 252, factor: 0.1 }, // sick + travel
    { from: 305, to: 312, factor: 1.25 }, // hackathon
  ]

  function eventFactor(offset: number): number {
    for (const ev of events) {
      if (offset >= ev.from && offset <= ev.to) {
        return ev.factor
      }
    }
    return 1
  }

  for (let i = span - 1; i >= 0; i--) {
    energy = rho * energy + sigma * gauss(rng)
    const date = utcDayStart(i)
    const dow = date.getUTCDay()

    // Slow seasonal drift — one full sine over ~110 days, amplitude 0.18.
    const seasonal = 1 + 0.18 * Math.sin((span - i) / 110 * 2 * Math.PI)

    // Weekend dampener — typical engineer codes ~30% as much on weekends.
    const weekendFactor = (dow === 0 || dow === 6) ? 0.35 : 1

    const holiday = isWesternHoliday(date) ? 0.05 : 1
    const event = eventFactor(i)

    // Map energy (gaussian ~N(0, ~σ/√(1-ρ²))) to a multiplicative envelope.
    const envelope = Math.max(0, 1 + energy * 0.32)

    let intensity = seasonal * weekendFactor * envelope * holiday * event

    // Occasional zero days for personal life. ~3% chance, decoupled from
    // the slow events above.
    if (rng() < 0.03 && event === 1) {
      intensity = 0
    }

    // Light noise so neighbouring days aren't identical even when energy
    // and seasonal carriers happen to coincide.
    intensity *= 0.9 + rng() * 0.2

    // Convert intensity to minutes — target weekday median ~380 min (~6h20).
    let totalMinutes = Math.round(intensity * 380)

    // Rare binge: a productive day extends into a 12–14h session.
    if (rng() < 0.025 && intensity > 0.6) {
      totalMinutes = Math.min(840, Math.round(totalMinutes * 1.8 + 120))
    }

    // Per-day focus boost used when allocating across workspaces — lets
    // a single workspace dominate a streak.
    const focusBoost = 0.7 + rng() * 1.1

    states.push({ date, totalMinutes, intensity, dow, focusBoost })
  }

  cachedTimeline = states.toReversed() // newest-first internally
  cachedTimelineLimit = span
  return cachedTimeline.slice(0, limit)
}

// ---------------------------------------------------------------------------
// Workspace epochs
// ---------------------------------------------------------------------------
//
// Each workspace gets a smooth "presence" envelope: a few overlapping bell
// curves over the year so the per-project Y-dot trend shows realistic ramps
// and lulls (instead of every project being touched every day).

function workspacePresence(workspace: string, offsetDays: number, span: number): number {
  const rng = seedrandom(`${SEED}:ws:${workspace}`)
  // 2–4 bumps per workspace, with random centers/widths but seeded so they
  // stay stable across requests.
  const bumps = 2 + Math.floor(rng() * 3)
  let total = 0
  for (let i = 0; i < bumps; i++) {
    const center = Math.floor(rng() * span)
    const width = 18 + Math.floor(rng() * 60)
    const peak = 0.5 + rng() * 0.8
    const dist = (offsetDays - center)
    total += peak * Math.exp(-(dist * dist) / (2 * width * width))
  }
  // Always keep a small baseline so the project never disappears entirely.
  return 0.08 + total
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type StatsTimeRow = { duration: number, time: string }
export type StatsByRow = { duration: number, time: string, by: string }

export function generateDailyTotals(limit: number): StatsTimeRow[] {
  const timeline = buildTimeline(limit)
  // Return ascending chronological order — the UI sorts internally but
  // ordered input keeps any list view (latest-logs etc.) tidy.
  return timeline
    .slice(0, limit)
    .map(s => ({ duration: s.totalMinutes, time: s.date.toISOString() }))
    .toReversed()
}

export function generateDailyByField(
  field: 'language' | 'workspace' | 'platform' | 'editor',
  limit: number,
): StatsByRow[] {
  const timeline = buildTimeline(limit)
  const rng = seedrandom(`${SEED}:by:${field}`)
  const rows: StatsByRow[] = []

  if (field === 'workspace') {
    for (const state of timeline) {
      if (state.totalMinutes <= 0) {
        continue
      }
      const offset = Math.round((Date.now() - state.date.getTime()) / DAY_MS)
      // Combine each workspace's baseline weight with its time-varying
      // presence + a per-day random jitter. The dominant workspace on a
      // given day naturally varies across the year.
      const samples = WORKSPACE_PROFILES.map((profile) => {
        const presence = workspacePresence(profile.name, offset, Math.max(365, limit))
        const jitter = 0.6 + rng() * 0.8
        return { by: profile.name, raw: profile.weight * presence * jitter }
      })
      // Throttle to 1–3 active workspaces most days; on intense days allow
      // up to 4 so the dots layer doesn't go monochromatic.
      const active = state.intensity > 0.85 ? 4 : (state.intensity > 0.5 ? 3 : 2)
      const ordered = samples.toSorted((a, b) => b.raw - a.raw).slice(0, active)
      const sumRaw = ordered.reduce((acc, s) => acc + s.raw, 0)
      if (sumRaw <= 0) {
        continue
      }
      for (const sample of ordered) {
        const share = sample.raw / sumRaw
        const minutes = Math.round(state.totalMinutes * share)
        if (minutes <= 0) {
          continue
        }
        rows.push({ duration: minutes, time: state.date.toISOString(), by: sample.by })
      }
    }
    return rows.toReversed()
  }

  if (field === 'language') {
    // Derive language minutes from the workspace allocation so the two
    // panels tell a consistent story (typescript-heavy weeks ↔ web-app weeks).
    for (const state of timeline) {
      if (state.totalMinutes <= 0) {
        continue
      }
      const offset = Math.round((Date.now() - state.date.getTime()) / DAY_MS)
      const wsSamples = WORKSPACE_PROFILES.map((profile) => {
        const presence = workspacePresence(profile.name, offset, Math.max(365, limit))
        const jitter = 0.6 + rng() * 0.8
        return { profile, raw: profile.weight * presence * jitter }
      })
      const active = state.intensity > 0.85 ? 4 : (state.intensity > 0.5 ? 3 : 2)
      const orderedWs = wsSamples.toSorted((a, b) => b.raw - a.raw).slice(0, active)
      const sumWsRaw = orderedWs.reduce((acc, s) => acc + s.raw, 0)
      if (sumWsRaw <= 0) {
        continue
      }
      const langTotals = new Map<string, number>()
      for (const ws of orderedWs) {
        const wsShare = ws.raw / sumWsRaw
        const wsMinutes = state.totalMinutes * wsShare
        const langSum = Object.values(ws.profile.languages).reduce<number>((acc, v) => acc + (v ?? 0), 0)
        if (langSum <= 0) {
          continue
        }
        for (const [lang, weight] of Object.entries(ws.profile.languages)) {
          if (!weight) {
            continue
          }
          const minutes = wsMinutes * (weight / langSum)
          langTotals.set(lang, (langTotals.get(lang) ?? 0) + minutes)
        }
      }
      // Occasional "tinker" languages — Rust/Go bursts decoupled from web work.
      if (rng() < 0.18) {
        const extra = rng() < 0.5 ? 'rust' : 'go'
        const bump = state.totalMinutes * (0.04 + rng() * 0.12)
        langTotals.set(extra, (langTotals.get(extra) ?? 0) + bump)
      }
      for (const [lang, minutes] of langTotals) {
        const rounded = Math.round(minutes)
        if (rounded <= 0) {
          continue
        }
        rows.push({ duration: rounded, time: state.date.toISOString(), by: lang })
      }
    }
    return rows.toReversed()
  }

  // Platform / editor — single bucket dominates with rare context switches.
  const buckets = field === 'platform' ? PLATFORMS : EDITORS
  for (const state of timeline) {
    if (state.totalMinutes <= 0) {
      continue
    }
    const samples = buckets.map((bucket) => {
      const stickiness = bucket.weight ** 2
      const jitter = 0.5 + rng() * 0.8
      return { by: bucket.by, raw: stickiness * jitter }
    })
    const sumRaw = samples.reduce((acc, s) => acc + s.raw, 0)
    for (const sample of samples) {
      const share = sample.raw / sumRaw
      const minutes = Math.round(state.totalMinutes * share)
      if (minutes <= 0) {
        continue
      }
      rows.push({ duration: minutes, time: state.date.toISOString(), by: sample.by })
    }
  }
  return rows.toReversed()
}

export type TopRow = { field: string, minutes: number }

export function generateTop(
  field: 'language' | 'workspace' | 'platform' | 'editor',
  minutes: number,
  limit: number,
): TopRow[] {
  // Derive directly from the same timeline so the "top" cards match the
  // trend panels for the same window.
  const days = Math.max(1, Math.min(Math.ceil(minutes / (24 * 60)), 365))
  const rows = generateDailyByField(field, days)
  const totals = new Map<string, number>()
  for (const row of rows) {
    totals.set(row.by, (totals.get(row.by) ?? 0) + row.duration)
  }
  return [...totals.entries()]
    .map(([by, mins]) => ({ field: by, minutes: mins }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, limit)
}

export type DistributionRow = { hour: number, minute: number, count: number }

// Hour/minute histogram. Double-peak workday shape; each segment gets a
// distinct seed so the segmented overlay in the daily-distribution chart
// shows visible drift.
export function generateDistribution(segmentIndex: number): DistributionRow[] {
  const rng = seedrandom(`${SEED}:dist:${segmentIndex}`)
  const rows: DistributionRow[] = []
  const morningPeak = 10 + (segmentIndex % 3) * 0.45 - 0.3
  const afternoonPeak = 15.5 + (segmentIndex % 4) * 0.32
  const eveningLevel = 0.28 + (segmentIndex % 5) * 0.045
  const lateNightTail = segmentIndex % 2 === 0 ? 0.06 : 0.02

  for (let minute = 0; minute < 1440; minute += 5) {
    const hour = minute / 60
    let ratio = 0
    if (hour < 6) {
      ratio = 0.005 + rng() * 0.012
    }
    else if (hour < 9) {
      ratio = 0.04 + (hour - 6) / 3 * 0.22 + rng() * 0.05
    }
    else if (hour < 12) {
      ratio = 0.32 + Math.exp(-((hour - morningPeak) ** 2) / 1.6) * 0.45 + rng() * 0.08
    }
    else if (hour < 13.5) {
      const lunchTrough = 1 - Math.exp(-((hour - 12.75) ** 2) / 0.35)
      ratio = 0.05 + lunchTrough * 0.18 + rng() * 0.05
    }
    else if (hour < 18) {
      ratio = 0.36 + Math.exp(-((hour - afternoonPeak) ** 2) / 1.8) * 0.52 + rng() * 0.08
    }
    else if (hour < 19.5) {
      const dinnerTrough = 1 - Math.exp(-((hour - 18.75) ** 2) / 0.35)
      ratio = 0.1 + dinnerTrough * 0.14 + rng() * 0.05
    }
    else if (hour < 23) {
      ratio = eveningLevel + Math.exp(-((hour - 21) ** 2) / 2.4) * 0.2 + rng() * 0.08
    }
    else {
      ratio = lateNightTail + rng() * 0.04
    }
    const count = Math.max(0, Math.round(ratio * 600))
    if (count <= 0) {
      continue
    }
    rows.push({ hour: Math.floor(hour), minute: minute % 60, count })
  }
  return rows
}

export function pickSegmentIndex(startTime?: Date | null, endTime?: Date | null): number {
  if (!startTime || !endTime) {
    return 0
  }
  const widthDays = Math.max(
    1,
    Math.round((endTime.getTime() - startTime.getTime()) / DAY_MS),
  )
  const epochDays = Math.floor(startTime.getTime() / DAY_MS)
  return Math.abs(epochDays + widthDays) % 6
}
