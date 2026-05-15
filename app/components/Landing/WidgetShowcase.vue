<script setup lang="ts">
// SVG markup mirrors the real widget endpoints (shields.jannchie.com for the
// badge, /api/widgets/*.svg for donut/status) so the showcase paints with no
// network and inherits scheme automatically through CSS variables.

const t = useI18N()
const locale = useLocale()
const widgetsHref = computed(() => `/${locale.value || 'en'}/dashboard/widgets`)

const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="174" height="20" role="img" aria-label="Codetime: 7190hrs 47mins"><title>Codetime: 7190hrs 47mins</title><style>a:hover #llink{fill:url(#b);stroke:#ccc}a:hover #rlink{fill:#4183c4}</style><linearGradient id="a" x2="0" y2="100%"><stop offset="0" stop-color="#fcfcfc" stop-opacity="0"/><stop offset="1" stop-opacity=".1"/></linearGradient><linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#ccc" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><g stroke="#d5d5d5"><rect stroke="none" fill="#fcfcfc" x="0.5" y="0.5" width="78" height="19" rx="2"/><rect x="84.5" y="0.5" width="89" height="19" rx="2" fill="#fafafa"/><rect x="84" y="7.5" width="0.5" height="5" stroke="#fafafa"/><path d="M84.5 6.5 l-3 3v1 l3 3" fill="#fafafa"/></g><image x="5" y="3" width="14" height="14" href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzc3IiBoZWlnaHQ9IjM3NyIgdmlld0JveD0iMCAwIDM3NyAzNzciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTg4LjUiIGN5PSIxODguNSIgcj0iMTcyLjUiIGZpbGw9IiNEOUQ5RDkiIHN0cm9rZT0iIzE4NzRBOCIgc3Ryb2tlLXdpZHRoPSIzMiIvPjxjaXJjbGUgY3g9IjE4OC41IiBjeT0iMTg4LjUiIHI9IjE3Mi41IiBmaWxsPSIjRDlEOUQ5IiBzdHJva2U9IiMxODc0QTgiIHN0cm9rZS13aWR0aD0iMzIiLz48cGF0aCBkPSJNMjg5LjM1MiAxMTNMMzA3LjAxNiAxNDAuOTA0TDIyMy45NDQgMTg5LjQxNkwzMDcuMDE2IDIzNy4wMzJMMjg4LjcxMiAyNjUuODMyTDE4OSAyMDMuODhWMTc1LjIwOEwyODkuMzUyIDExM1oiIGZpbGw9IiMyRTJFMkUiLz48L3N2Zz4="/><g aria-hidden="true" fill="#333" text-anchor="middle" font-family="Helvetica Neue,Helvetica,Arial,sans-serif" text-rendering="geometricPrecision" font-weight="700" font-size="110px" line-height="14px"><rect id="llink" stroke="#d5d5d5" fill="url(#a)" x=".5" y=".5" width="78" height="19" rx="2"/><text aria-hidden="true" x="475" y="150" fill="#fff" transform="scale(.1)" textLength="510">Codetime</text><text x="475" y="140" transform="scale(.1)" textLength="510">Codetime</text><text aria-hidden="true" x="1285" y="150" fill="#fff" transform="scale(.1)" textLength="810">7190hrs 47mins</text><text id="rlink" x="1285" y="140" transform="scale(.1)" textLength="810">7190hrs 47mins</text></g></svg>`

// SVG attributes resolve var() against each element's computed style, so
// these strings paint correctly for whatever scheme is active.
const FS_SANS = `ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
const FS_MONO = `ui-monospace, SFMono-Regular, Menlo, 'JetBrains Mono', Consolas, monospace`
const DONUT_PALETTE = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#a855f7']
const DONUT_LEGEND = [
  { name: 'typescript', pct: '22.2%' },
  { name: 'markdown', pct: '20.3%' },
  { name: 'python', pct: '19.8%' },
  { name: 'json', pct: '19.2%' },
  { name: 'vue', pct: '18.4%' },
]

const donutSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="180" viewBox="0 0 360 180" role="img" aria-label="Top languages, last 30 days">
  <rect width="360" height="180" rx="10" fill="var(--ct-surface)" stroke="var(--ct-border-subtle)"/>
  <g><path d="M 90.00 20.00 A 70 70 0 0 1 158.91 77.72 L 133.32 82.28 A 44 44 0 0 0 90.00 46.00 Z" fill="${DONUT_PALETTE[0]}"/><path d="M 158.91 77.72 A 70 70 0 0 1 121.64 152.44 L 109.89 129.25 A 44 44 0 0 0 133.32 82.28 Z" fill="${DONUT_PALETTE[1]}"/><path d="M 121.64 152.44 A 70 70 0 0 1 40.88 139.88 L 59.13 121.35 A 44 44 0 0 0 109.89 129.25 Z" fill="${DONUT_PALETTE[2]}"/><path d="M 40.88 139.88 A 70 70 0 0 1 25.91 61.86 L 49.71 72.31 A 44 44 0 0 0 59.13 121.35 Z" fill="${DONUT_PALETTE[3]}"/><path d="M 25.91 61.86 A 70 70 0 0 1 90.00 20.00 L 90.00 46.00 A 44 44 0 0 0 49.71 72.31 Z" fill="${DONUT_PALETTE[4]}"/></g>
  <text x="90" y="82" text-anchor="middle" dominant-baseline="central" font-family="${FS_MONO}" font-size="14" fill="var(--ct-fg)" font-weight="600">126h 10m</text>
  <text x="90" y="99" text-anchor="middle" dominant-baseline="central" font-family="${FS_SANS}" font-size="9.5" fill="var(--ct-fg-subtle)">last 30d</text>
  <text x="190" y="18" dominant-baseline="central" font-family="${FS_SANS}" font-size="10" fill="var(--ct-fg-subtle)" letter-spacing="0.08em">LANGUAGES</text>
  ${DONUT_LEGEND.map((row, i) => {
    const y = 33 + i * 18
    return `<g>
    <rect x="190" y="${y}" width="10" height="10" rx="1.5" fill="${DONUT_PALETTE[i]}"/>
    <text x="206" y="${y + 5}" dominant-baseline="central" font-family="${FS_SANS}" font-size="11" fill="var(--ct-fg)">${row.name}</text>
    <text x="350" y="${y + 5}" dominant-baseline="central" text-anchor="end" font-family="${FS_MONO}" font-size="10.5" fill="var(--ct-fg-subtle)">${row.pct}</text>
  </g>`
  }).join('')}
  <text x="350" y="168" text-anchor="end" dominant-baseline="central" font-family="${FS_MONO}" font-size="9" fill="var(--ct-fg-subtle)">codetime.dev</text>
</svg>`

const statusSvg = (() => {
  const W = 380
  const H = 116
  const ROW_Y = 20
  const BOTTOM_Y = 98
  const DIVIDER_Y = 82
  const primaryY = 48.72
  const secondaryY = 66.32
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="CodeTime status for jannchie">
  <rect width="${W}" height="${H}" rx="10" fill="var(--ct-surface)" stroke="var(--ct-border-subtle)"/>
  <circle cx="18" cy="${ROW_Y}" r="5" fill="var(--ct-success)" opacity="0.55">
    <animate attributeName="r" values="4;9;4" dur="1.6s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.6;0;0.6" dur="1.6s" repeatCount="indefinite"/>
  </circle>
  <circle cx="18" cy="${ROW_Y}" r="3.2" fill="var(--ct-success)"/>
  <text x="30" y="${ROW_Y}" dominant-baseline="central" font-family="${FS_SANS}" font-size="10" letter-spacing="0.12em" font-weight="600" fill="var(--ct-success)">CURRENTLY CODING</text>
  <text x="${W - 14}" y="${ROW_Y}" dominant-baseline="central" text-anchor="end" font-family="${FS_MONO}" font-size="10" fill="var(--ct-fg-subtle)">@jannchie</text>
  <text x="14" y="${primaryY}" dominant-baseline="central" font-family="${FS_SANS}" font-size="13.5" font-weight="600" fill="var(--ct-fg)">codetime-web-v3</text>
  <text x="14" y="${secondaryY}" dominant-baseline="central" font-family="${FS_MONO}" font-size="11" fill="var(--ct-fg-muted)">TypeScript</text>
  <line x1="14" x2="${W - 14}" y1="${DIVIDER_Y}" y2="${DIVIDER_Y}" stroke="var(--ct-border-subtle)"/>
  <text x="14" y="${BOTTOM_Y}" dominant-baseline="central" font-family="${FS_SANS}" font-size="10" fill="var(--ct-fg-subtle)">today</text>
  <text x="60" y="${BOTTOM_Y}" dominant-baseline="central" font-family="${FS_MONO}" font-size="11.5" font-weight="600" fill="var(--ct-fg)">3h 42m</text>
  <text x="${W - 14}" y="${BOTTOM_Y}" dominant-baseline="central" text-anchor="end" font-family="${FS_SANS}" font-size="10" fill="var(--ct-fg-subtle)">last seen just now</text>
</svg>`
})()

const tiles = computed(() => [
  {
    key: 'badge',
    title: t.value.landing.features.widgets.badge,
    snippet: '/v3/users/shield?uid=…',
    svg: badgeSvg,
    aspect: '174 / 20',
    cap: 196,
  },
  {
    key: 'donut',
    title: t.value.landing.features.widgets.donut,
    snippet: '/api/widgets/donut.svg?uid=…',
    svg: donutSvg,
    aspect: '360 / 180',
    cap: 360,
  },
  {
    key: 'status',
    title: t.value.landing.features.widgets.status,
    snippet: '/api/widgets/status.svg?uid=…',
    svg: statusSvg,
    aspect: '380 / 116',
    cap: 360,
  },
])
</script>

<template>
  <section>
    <div class="mx-auto px-6 py-24 max-w-6xl sm:py-32">
      <div class="mb-12 flex flex-col gap-3">
        <div class="eyebrow">
          <span class="eyebrow-bracket">[</span>
          <span class="eyebrow-num">05</span>
          <span class="eyebrow-sep">/</span>
          <span>{{ t.landing.sections.widgets }}</span>
          <span class="eyebrow-bracket">]</span>
        </div>
        <h2 class="section-heading text-ct-fg leading-[1.05] font-semibold max-w-3xl">
          {{ t.landing.features.widgets.title }}
        </h2>
        <p class="text-[14px] text-ct-fg-muted leading-[1.7] mt-2 max-w-2xl">
          {{ t.landing.features.widgets.description }}
        </p>
      </div>

      <div class="widget-grid">
        <article
          v-for="tile in tiles"
          :key="tile.key"
          class="widget-tile"
        >
          <div class="widget-tile-stage">
            <span class="widget-tile-grid" aria-hidden="true" />
            <div
              class="widget-svg"
              :style="{ aspectRatio: tile.aspect, maxWidth: `${tile.cap}px` }"
              v-html="tile.svg"
            />
          </div>
          <div class="widget-tile-meta">
            <code class="widget-tile-snippet">{{ tile.snippet }}</code>
            <h3 class="widget-tile-name">
              {{ tile.title }}
            </h3>
          </div>
        </article>
      </div>

      <div class="widget-cta-row">
        <NuxtLink :to="widgetsHref" class="widget-cta">
          <span>{{ t.landing.features.widgets.cta }}</span>
          <i class="i-tabler-arrow-up-right" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.widget-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
@media (min-width: 768px) {
  .widget-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

.widget-tile {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ct-border);
  background: var(--ct-surface);
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 220ms ease, transform 220ms ease;
}
.widget-tile:hover {
  border-color: color-mix(in srgb, var(--ct-primary) 50%, var(--ct-border));
  transform: translateY(-2px);
}

.widget-tile-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 32px 24px;
  background: color-mix(in srgb, var(--ct-primary) 4%, transparent);
  border-bottom: 1px solid var(--ct-border);
  overflow: hidden;
}

.widget-tile-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, var(--ct-border) 1px, transparent 1px),
    linear-gradient(to bottom, var(--ct-border) 1px, transparent 1px);
  background-size: 28px 28px;
  opacity: 0.35;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 85%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 85%);
  pointer-events: none;
}

.widget-svg {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 8px 22px rgb(2 8 23 / 0.18));
}
.widget-svg :deep(svg) {
  width: 100%;
  height: auto;
  display: block;
}

html[data-scheme="light"] .widget-svg {
  filter: drop-shadow(0 8px 18px rgb(15 23 42 / 0.08));
}

.widget-tile-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 18px 18px;
}
.widget-tile-snippet {
  align-self: flex-start;
  padding: 3px 9px;
  font-family: var(--ct-font-mono);
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--ct-primary);
  background: var(--ct-primary-soft);
  border: 1px solid color-mix(in srgb, var(--ct-primary) 25%, transparent);
  border-radius: 999px;
}
.widget-tile-name {
  font-family: var(--ct-font-sans);
  font-size: 14px;
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg);
  letter-spacing: -0.005em;
  margin: 0;
}

.widget-cta-row {
  display: flex;
  justify-content: center;
  margin-top: 36px;
}
.widget-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 22px;
  font-family: var(--ct-font-mono);
  font-size: 13px;
  font-weight: var(--ct-weight-medium);
  letter-spacing: 0.04em;
  color: var(--ct-primary);
  background: var(--ct-primary-soft);
  border: 1px solid color-mix(in srgb, var(--ct-primary) 35%, transparent);
  border-radius: 10px;
  text-decoration: none;
  transition: background-color 180ms ease, border-color 180ms ease, transform 180ms ease;
}
.widget-cta:hover {
  background: color-mix(in srgb, var(--ct-primary) 20%, transparent);
  border-color: var(--ct-primary);
  transform: translateY(-1px);
}
.widget-cta i { font-size: 15px; }
</style>
