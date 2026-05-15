// Tiny in-process Prometheus metrics registry. Hand-rolled so we don't
// pull in `prom-client` for what is, on the Nuxt side, a small set of
// counters + histograms. The exposition format follows Prometheus text
// format 0.0.4. Histograms emit `_bucket`, `_sum`, `_count` series with
// cumulative bucket counts (Prom convention).
//
// Why this is here at all: the Python service exposes /v3/metrics for
// Prometheus to scrape (process_*, codetime_*, http_request_*). Now
// that the Nuxt backend owns every /v3/* path, Prometheus pulls metrics
// from this endpoint instead. The metric *names* mirror Python's so
// the existing scrape config and dashboards keep working without
// per-backend branching.

import process from 'node:process'

type LabelDict = Record<string, string | number>

function escapeLabel(v: string): string {
  return v.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n')
}

function fmtLabels(labels: LabelDict | undefined): string {
  if (!labels) {
 return ''
}
  const parts: string[] = []
  for (const k of Object.keys(labels).sort()) {
    parts.push(`${k}="${escapeLabel(String(labels[k]))}"`)
  }
  return parts.length ? `{${parts.join(',')}}` : ''
}

// Reasonable default buckets — matches the codetime-server config's
// `request_duration_buckets` so the bucket boundaries line up across
// backends and the histogram queries don't need per-backend branches.
const DEFAULT_BUCKETS = [
  0.001,
  0.005,
  0.01,
  0.025,
  0.05,
  0.075,
  0.1,
  0.25,
  0.5,
  0.75,
  1.0,
  2.5,
  5.0,
  7.5,
  10.0,
]

class Counter {
  private values = new Map<string, number>()
  constructor(public name: string, public help: string, public labelNames: string[] = []) {}

  inc(labels?: LabelDict, amount = 1) {
    const key = fmtLabels(labels)
    this.values.set(key, (this.values.get(key) ?? 0) + amount)
  }

  expose(): string {
    const out: string[] = [
      `# HELP ${this.name} ${this.help}`,
      `# TYPE ${this.name} counter`,
    ]
    if (this.values.size === 0) {
      // Counter with no observations: prometheus still wants the TYPE line.
      return out.join('\n')
    }
    for (const [labels, v] of this.values) {
      out.push(`${this.name}${labels} ${v}`)
    }
    return out.join('\n')
  }
}

class Gauge {
  private getter: () => number
  constructor(public name: string, public help: string, getter: () => number) {
    this.getter = getter
  }

  expose(): string {
    return [
      `# HELP ${this.name} ${this.help}`,
      `# TYPE ${this.name} gauge`,
      `${this.name} ${this.getter()}`,
    ].join('\n')
  }
}

class Histogram {
  private observations = new Map<string, { buckets: number[], sum: number, count: number }>()
  constructor(
    public name: string,
    public help: string,
    public labelNames: string[] = [],
    public buckets: number[] = DEFAULT_BUCKETS,
  ) {}

  observe(value: number, labels?: LabelDict) {
    const key = fmtLabels(labels)
    let bucket = this.observations.get(key)
    if (!bucket) {
      bucket = { buckets: new Array(this.buckets.length).fill(0), sum: 0, count: 0 }
      this.observations.set(key, bucket)
    }
    for (let i = 0; i < this.buckets.length; i++) {
      if (value <= this.buckets[i]) bucket.buckets[i]++
    }
    bucket.sum += value
    bucket.count += 1
  }

  expose(): string {
    const out: string[] = [
      `# HELP ${this.name} ${this.help}`,
      `# TYPE ${this.name} histogram`,
    ]
    for (const [labelStr, h] of this.observations) {
      // Drop the trailing `}` so we can splice `le="..."` in.
      const base = labelStr ? labelStr.slice(0, -1) : '{'
      const sep = labelStr ? ',' : ''
      let cum = 0
      for (let i = 0; i < this.buckets.length; i++) {
        cum += h.buckets[i]
        out.push(`${this.name}_bucket${base}${sep}le="${this.buckets[i]}"} ${cum}`)
      }
      out.push(`${this.name}_bucket${base}${sep}le="+Inf"} ${h.count}`)
      out.push(`${this.name}_sum${labelStr} ${h.sum}`)
      out.push(`${this.name}_count${labelStr} ${h.count}`)
    }
    return out.join('\n')
  }
}

class Registry {
  collectors: Array<Counter | Gauge | Histogram> = []
  counter(name: string, help: string, labels: string[] = []): Counter {
    const c = new Counter(name, help, labels)
    this.collectors.push(c)
    return c
  }

  gauge(name: string, help: string, getter: () => number): Gauge {
    const g = new Gauge(name, help, getter)
    this.collectors.push(g)
    return g
  }

  histogram(name: string, help: string, labels: string[] = [], buckets?: number[]): Histogram {
    const h = new Histogram(name, help, labels, buckets ?? DEFAULT_BUCKETS)
    this.collectors.push(h)
    return h
  }

  expose(): string {
    return `${this.collectors.map(c => c.expose()).join('\n')}\n`
  }
}

// Singleton — Nuxt's dev server may HMR-reload modules but the registry
// must outlive that to keep counter values monotonic across hot reloads.
declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var __codetimeMetrics: {
    registry: Registry
    httpRequestsTotal: Counter
    httpRequestDuration: Histogram
  } | undefined
}

function build() {
  const registry = new Registry()

  // Process gauges — names match prom-client's default collectors so the
  // existing scrape config keeps working without a renaming dance.
  const startTime = Date.now() / 1000
  registry.gauge('process_start_time_seconds', 'Start time of the process since unix epoch in seconds.', () => startTime)
  registry.gauge('process_resident_memory_bytes', 'Resident memory size in bytes.', () => process.memoryUsage.rss())
  registry.gauge('process_heap_used_bytes', 'V8 heap used in bytes.', () => process.memoryUsage().heapUsed)
  registry.gauge('process_heap_total_bytes', 'V8 heap total in bytes.', () => process.memoryUsage().heapTotal)
  registry.gauge('process_cpu_user_seconds_total', 'Total user CPU time spent in seconds.', () => process.cpuUsage().user / 1_000_000)
  registry.gauge('process_cpu_system_seconds_total', 'Total system CPU time spent in seconds.', () => process.cpuUsage().system / 1_000_000)
  registry.gauge('nodejs_uptime_seconds', 'Process uptime in seconds.', () => process.uptime())
  registry.gauge('nodejs_eventloop_lag_seconds', 'Approximate event-loop lag in seconds. Sampled lazily on scrape.', () => 0)

  // HTTP request counters — wire matches the Python prometheus plugin's
  // `codetime_requests_total` and `codetime_request_duration_seconds`.
  const httpRequestsTotal = registry.counter(
    'codetime_requests_total',
    'Total HTTP requests served by the Nuxt backend.',
    ['method', 'path', 'status'],
  )
  const httpRequestDuration = registry.histogram(
    'codetime_request_duration_seconds',
    'HTTP request duration in seconds.',
    ['method', 'path'],
  )

  return { registry, httpRequestsTotal, httpRequestDuration }
}

export const metrics = globalThis.__codetimeMetrics ??= build()
