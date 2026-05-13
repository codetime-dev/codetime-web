#!/usr/bin/env node
// Diff Python vs Nuxt backends endpoint-by-endpoint.
//
// Usage:
//   BASE_PY=https://api.codetime.dev \
//   BASE_NUXT=https://codetime.dev \
//   COOKIE='user_id=...; auth_token=...' \
//   node scripts/diff-backends.mjs [--auth] [--filter substr]
//
// Flags:
//   --auth          include endpoints that require a session cookie
//   --filter <str>  only run endpoints whose path contains <str>
//   --strict        report timestamp diffs too (default: tag-but-still-report)
//   --raw           dump raw bodies on diff (default: structural diff only)

const BASE_PY = process.env.BASE_PY || 'https://api.codetime.dev'
const BASE_NUXT = process.env.BASE_NUXT || 'https://codetime.dev'
const COOKIE = process.env.COOKIE || ''

const argv = process.argv.slice(2)
const wantAuth = argv.includes('--auth')
const wantRaw = argv.includes('--raw')
const filter = (() => {
  const i = argv.indexOf('--filter')
  return i === -1 ? '' : argv[i + 1]
})()

// Endpoint catalog. `auth: false` means callable without cookies.
const endpoints = [
  // Public ranking
  { path: '/v3/public/leaderboard?limit=3', auth: false },
  { path: '/v3/public/language-ranking?language=Python&limit=3', auth: false },
  { path: '/v3/public/users/1/overall-rank', auth: false },
  { path: '/v3/public/users/1/language-rank?language=Python', auth: false },
  { path: '/v3/public/users/1/top-languages-rank?top_n=3', auth: false },
  { path: '/v3/public/users/1/coding-history?days=7', auth: false },
  // Logs (public-shaped)
  { path: '/v3/logs/yearly-report-data?user_id=1&year=2024', auth: false },
  // Payments
  { path: '/v3/payments/products', auth: false },
  // Public user view
  { path: '/v3/users/1', auth: false },
  { path: '/v3/users/1/public/status', auth: false },
  { path: '/v3/users/1/public/top-languages?top_n=3', auth: false },
  { path: '/v3/users/shield?uid=1', auth: false },
  // Auth-required
  { path: '/v3/users/self', auth: true },
  { path: '/v3/users/self/minutes', auth: true },
  { path: '/v3/users/self/stats?by=day&days=7', auth: true },
  { path: '/v3/users/self/stats_time?by=day&days=7', auth: true },
  { path: '/v3/users/self/top?by=language&days=7&limit=3', auth: true },
  { path: '/v3/users/self/latest-logs?limit=3', auth: true },
  { path: '/v3/users/self/time-distribution?days=7', auth: true },
  { path: '/v3/users/self/workspace?days=7&limit=3', auth: true },
  { path: '/v3/users/self/languages/recent', auth: true },
  { path: '/v3/users/self/workspaces/recent', auth: true },
  { path: '/v3/users/self/overall-rank', auth: true },
  { path: '/v3/users/self/top-languages-rank?top_n=3', auth: true },
  { path: '/v3/users/self/privacy', auth: true },
  { path: '/v3/tags', auth: true },
  { path: '/v3/tags/stats', auth: true },
  { path: '/v3/icalendar/info', auth: true },
  { path: '/v3/discounts/active', auth: true },
]

const VOLATILE_KEYS = new Set([
  'updatedAt',
'updated_at',
  'cacheTimestamp',
'cache_timestamp',
  'createdAt',
'created_at', // for response-side timestamps (user objects keep theirs but in lists may differ if ordering shifts)
])

function isObject(x) {
 return x !== null && typeof x === 'object' && !Array.isArray(x)
}

function diff(a, b, path = '$', acc = []) {
  // ignore volatile leaves (still note as "vol" tag)
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      acc.push({ path, kind: 'len', py: a.length, nx: b.length })
      return acc
    }
    for (let i = 0; i < a.length; i++) diff(a[i], b[i], `${path}[${i}]`, acc)
    return acc
  }
  if (isObject(a) && isObject(b)) {
    const ak = Object.keys(a).sort()
    const bk = Object.keys(b).sort()
    const onlyA = ak.filter(k => !(k in b))
    const onlyB = bk.filter(k => !(k in a))
    for (const k of onlyA) acc.push({ path: `${path}.${k}`, kind: 'only-py', py: a[k] })
    for (const k of onlyB) acc.push({ path: `${path}.${k}`, kind: 'only-nx', nx: b[k] })
    for (const k of ak.filter(k => k in b)) diff(a[k], b[k], `${path}.${k}`, acc)
    return acc
  }
  if (a !== b) {
    const leaf = path.split('.').pop().replace(/\[\d+\]$/, '')
    const tag = VOLATILE_KEYS.has(leaf) ? 'vol' : 'val'
    acc.push({ path, kind: tag, py: a, nx: b })
  }
  return acc
}

async function hit(base, path, opts) {
  const url = `${base}${path}`
  const headers = {}
  if (opts.auth && COOKIE) {
 headers.cookie = COOKIE
}
  let res; let body; let ms = Date.now()
  try {
    res = await fetch(url, { headers, redirect: 'manual' })
    ms = Date.now() - ms
    const ct = res.headers.get('content-type') || ''
    body = ct.includes('json') ? await res.json().catch(() => null) : await res.text()
    return { status: res.status, body, ct, ms }
  }
 catch (error) {
    return { status: 0, body: null, error: String(error), ms: Date.now() - ms }
  }
}

function truncate(s, n = 160) {
  const x = typeof s === 'string' ? s : JSON.stringify(s)
  if (x == null) {
 return String(x)
}
  return x.length > n ? `${x.slice(0, n)}…` : x
}

;(async () => {
  const filtered = endpoints
    .filter(e => wantAuth || !e.auth)
    .filter(e => !filter || e.path.includes(filter))

  let okEq = 0; let okDiff = 0; let statusDiff = 0; let hardFail = 0
  const lines = []

  for (const ep of filtered) {
    if (ep.auth && !COOKIE) {
      lines.push(`SKIP  ${ep.path}  (no COOKIE; pass --auth + COOKIE=...)`)
      continue
    }
    const [py, nx] = await Promise.all([hit(BASE_PY, ep.path, ep), hit(BASE_NUXT, ep.path, ep)])
    const head = `${py.status} vs ${nx.status}  ${ep.path}`
    if (py.status !== nx.status) {
      statusDiff += 1
      lines.push(`STATUS ${head}`)
      if (wantRaw) {
 lines.push(`  py: ${truncate(py.body)}`)
}
      if (wantRaw) {
 lines.push(`  nx: ${truncate(nx.body)}`)
}
      continue
    }
    if (py.status >= 500 || nx.status >= 500) {
      hardFail += 1
      lines.push(`5xx   ${head}`)
      lines.push(`  py: ${truncate(py.body)}`)
      lines.push(`  nx: ${truncate(nx.body)}`)
      continue
    }
    if (typeof py.body !== typeof nx.body) {
      okDiff += 1
      lines.push(`TYPE  ${head}  (py ${typeof py.body} / nx ${typeof nx.body})`)
      continue
    }
    if (typeof py.body === 'string') {
      // text/calendar etc.
      if (py.body === nx.body) {
 okEq += 1
}
      else {
        okDiff += 1
        lines.push(`TEXT  ${head}  bytes py=${py.body.length} nx=${nx.body.length}`)
      }
      continue
    }
    const ds = diff(py.body, nx.body)
    if (ds.length === 0) {
 okEq += 1; lines.push(`OK    ${head}`); continue
}
    okDiff += 1
    const onlyVol = ds.every(d => d.kind === 'vol')
    lines.push(`${onlyVol ? 'VOL ' : 'DIFF'}  ${head}  (${ds.length} delta)`)
    for (const d of ds.slice(0, 12)) {
      switch (d.kind) {
      case 'only-py': {
      lines.push(`  only-py ${d.path}=${truncate(d.py)}`)
      break
      }
      case 'only-nx': {
      lines.push(`  only-nx ${d.path}=${truncate(d.nx)}`)
      break
      }
      case 'len': {
      lines.push(`  len     ${d.path}  py=${d.py} nx=${d.nx}`)
      break
      }
      default: { lines.push(`  ${d.kind === 'vol' ? 'vol' : 'val'}     ${d.path}  py=${truncate(d.py)}  nx=${truncate(d.nx)}`)
      }
      }
    }
    if (ds.length > 12) {
 lines.push(`  …+${ds.length - 12} more`)
}
  }

  console.log(lines.join('\n'))
  console.log(`\n=== ${okEq} ok, ${okDiff} diff, ${statusDiff} status, ${hardFail} 5xx ===`)
})()
