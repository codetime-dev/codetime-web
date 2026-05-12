<script setup lang="ts">
definePageMeta({
  middleware: ['i18n'],
  layout: 'landing',
})
const t = useI18N()
const route = useRoute()

// Landing-page OG image. Dashboard/private routes deliberately get no OG —
// they require login and are not crawled. Other public pages (user profile,
// annual report) call defineOgImageComponent themselves.
defineOgImage('NuxtSeoSatori', {
  title: t.value.meta.title,
  description: t.value.meta.description,
  colorMode: 'dark',
})

// Hand-tokenised JSON snippet for the 03 EXPORT card. Injected via v-html so
// Vue's template whitespace-condense pass doesn't eat the column alignment
// between the spans.
const sampleJsonHtml = [
  '<span class="tk-pun">{</span>',
  '  <span class="tk-key">"minutes"</span><span class="tk-pun">:</span> <span class="tk-num">14820</span><span class="tk-pun">,</span>',
  '  <span class="tk-key">"since"</span><span class="tk-pun">:</span>   <span class="tk-str">"2024-01-01"</span><span class="tk-pun">,</span>',
  '  <span class="tk-key">"by"</span><span class="tk-pun">:</span>      <span class="tk-str">"language"</span><span class="tk-pun">,</span>',
  '  <span class="tk-key">"data"</span><span class="tk-pun">:</span> <span class="tk-pun">[</span>',
  '    <span class="tk-pun">{</span> <span class="tk-key">"field"</span><span class="tk-pun">:</span> <span class="tk-str">"TypeScript"</span><span class="tk-pun">,</span> <span class="tk-key">"minutes"</span><span class="tk-pun">:</span> <span class="tk-num">6240</span> <span class="tk-pun">},</span>',
  '    <span class="tk-pun">{</span> <span class="tk-key">"field"</span><span class="tk-pun">:</span> <span class="tk-str">"Python"</span><span class="tk-pun">,</span>     <span class="tk-key">"minutes"</span><span class="tk-pun">:</span> <span class="tk-num">4180</span> <span class="tk-pun">},</span>',
  '    <span class="tk-pun">{</span> <span class="tk-key">"field"</span><span class="tk-pun">:</span> <span class="tk-str">"Go"</span><span class="tk-pun">,</span>         <span class="tk-key">"minutes"</span><span class="tk-pun">:</span> <span class="tk-num">2120</span> <span class="tk-pun">}</span>',
  '  <span class="tk-pun">]</span>',
  '<span class="tk-pun">}</span>',
].join('\n')

// Canonical URL: every localized homepage points back to the single
// site root so agents don't cite the 12 locale variants as separate
// pages. (Localized SEO is still handled by hreflang/sitemap entries.)
const canonicalUrl = computed(() => {
  const locale = (route.params.locale as string) || 'en'
  return locale === 'en'
    ? 'https://codetime.dev/'
    : `https://codetime.dev/${locale}`
})

watchEffect(() => {
  useSeoMeta({
    title: 'Code Time — Coding Analytics for VS Code & JetBrains',
    description: 'Automatically track how long you spend coding, visualise habits by language and project, and export your raw editor data. Free plugins for VS Code, Cursor, Windsurf and every JetBrains IDE.',
    keywords: 'coding analytics, programming tracker, developer productivity, code metrics, VS Code extension, JetBrains plugin, Cursor, Windsurf',
    ogTitle: 'Code Time — Coding Analytics for VS Code & JetBrains',
    ogDescription: 'Automatically track how long you spend coding, visualise habits by language and project, and export your raw editor data. Free plugins for VS Code, Cursor, Windsurf and every JetBrains IDE.',
    ogType: 'website',
    ogUrl: canonicalUrl.value,
    ogImage: '/icon.png',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Code Time — Coding Analytics for VS Code & JetBrains',
    twitterDescription: 'Automatically track coding time, visualise habits by language and project, export raw editor data. Free plugins for VS Code and JetBrains.',
  })
})

// ---------------------------------------------------------------------------
// JSON-LD structured data — Organization + SoftwareApplication + FAQPage +
// Speakable, with sameAs links for entity disambiguation.
// ---------------------------------------------------------------------------
const jsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://codetime.dev/#org',
      'name': 'Code Time',
      'url': 'https://codetime.dev',
      'logo': 'https://codetime.dev/icon.png',
      'description':
        'Code Time builds privacy-respecting coding-time analytics for '
        + 'developers using VS Code and JetBrains IDEs.',
      'sameAs': [
        'https://github.com/jannchie',
        'https://marketplace.visualstudio.com/items?itemName=jannchie.codetime',
        'https://plugins.jetbrains.com/plugin/codetime',
      ],
      'contactPoint': [
        {
          '@type': 'ContactPoint',
          'email': 'support@codetime.dev',
          'contactType': 'customer support',
          'availableLanguage': ['en', 'zh-CN', 'ja'],
        },
      ],
      'address': {
        '@type': 'PostalAddress',
        'addressCountry': 'JP',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://codetime.dev/#website',
      'url': 'https://codetime.dev',
      'name': 'Code Time',
      'publisher': { '@id': 'https://codetime.dev/#org' },
      'inLanguage': 'en',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://codetime.dev/#app',
      'name': 'Code Time',
      'operatingSystem': 'Windows, macOS, Linux',
      'applicationCategory': 'DeveloperApplication',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
      'url': 'https://codetime.dev',
      'description':
        'Track programming time, analyze coding patterns, and export raw '
        + 'editor activity. Compatible with VS Code and JetBrains IDEs.',
      'softwareVersion': '3',
      'publisher': { '@id': 'https://codetime.dev/#org' },
    },
    {
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'What is Code Time?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text':
              'Code Time is a coding-time analytics platform that tracks '
              + 'how long you spend in your editor and visualises your '
              + 'coding patterns by language, workspace, and time of day.',
          },
        },
        {
          '@type': 'Question',
          'name': 'Which editors are supported?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text':
              'Code Time has official plugins for Visual Studio Code and '
              + 'all JetBrains IDEs (IntelliJ IDEA, PyCharm, WebStorm, '
              + 'GoLand, Rider, RubyMine, CLion, and more).',
          },
        },
        {
          '@type': 'Question',
          'name': 'How do AI agents call Code Time?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text':
              'Code Time exposes an MCP server at /mcp, an OpenAPI 3.1 '
              + 'spec at /openapi.json, an NLWeb /ask endpoint, and an '
              + 'OpenAI plugin manifest at /.well-known/ai-plugin.json.',
          },
        },
        {
          '@type': 'Question',
          'name': 'Is Code Time free?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text':
              'Yes — the free tier covers unlimited personal use with '
              + 'full history retention. Paid tiers add team features.',
          },
        },
      ],
    },
    {
      '@type': 'WebPage',
      '@id': 'https://codetime.dev/#homepage',
      'url': 'https://codetime.dev',
      'name': 'Code Time — Coding Analytics for VS Code & JetBrains',
      'speakable': {
        '@type': 'SpeakableSpecification',
        'cssSelector': ['h1.landing-title', '.agent-friendly-summary p'],
      },
    },
  ],
}))

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: () => JSON.stringify(jsonLd.value),
    },
  ],
  link: [
    { rel: 'canonical', href: canonicalUrl.value },
    { rel: 'alternate', type: 'text/markdown', href: '/index.md' },
    { rel: 'service-desc', type: 'application/openapi+json', href: '/openapi.json' },
    { rel: 'api-catalog', href: '/.well-known/api-catalog' },
    { rel: 'describedby', type: 'text/plain', href: '/.well-known/llms.txt' },
  ],
})
</script>

<template>
  <!-- HERO -->
  <section class="hero relative overflow-hidden">
    <div class="hero-grid" aria-hidden="true" />
    <div class="hero-glow" aria-hidden="true" />

    <div class="px-6 py-24 flex flex-col gap-8 items-center justify-center relative lg:py-32 sm:py-28">
      <div class="hero-badge">
        <span class="hero-badge-dot" />
        <span>{{ t.landing.heroBadge }}</span>
      </div>

      <LandingTitle />

      <div class="mt-2 flex flex-col gap-4 items-center">
        <LoginButton />
        <div class="hero-meta">
          <span class="hero-meta-rule" />
          <span>{{ t.landing.freeMessage }}</span>
          <span class="hero-meta-rule" />
        </div>
      </div>
    </div>
  </section>

  <!-- Privacy-respecting coding-time analytics description (kept for SEO/agents only) -->
  <section class="agent-friendly-summary visually-hidden" aria-label="About Code Time">
    <div class="mx-auto px-6 py-16 max-w-4xl space-y-6">
      <h2 class="text-2xl text-ct-fg font-mono font-semibold">
        Privacy-respecting coding-time analytics for VS Code and JetBrains
      </h2>
      <p class="text-[15px] text-ct-fg-muted leading-[1.7] font-mono">
        Code Time records per-minute coding activity reported by official
        editor plugins for Visual Studio Code and every JetBrains IDE. Sign
        in with GitHub or Google, install the plugin, and watch your
        dashboard fill in: daily distribution, language breakdown,
        per-workspace totals, and a calendar heatmap. Source code is never
        uploaded — only file paths, languages, and timestamps. Your raw
        events are exportable forever through the JSON API.
      </p>
      <p class="text-[15px] text-ct-fg-muted leading-[1.7] font-mono">
        Built for developers who want to understand their habits, attribute
        time to projects, or feed coding metrics into downstream tools.
        Compatible with VS Code, IntelliJ IDEA, PyCharm, WebStorm, GoLand,
        Rider, RubyMine, CLion, and the rest of the JetBrains family. The
        free tier supports unlimited personal use with full history
        retention.
      </p>
    </div>
  </section>

  <!-- STATS · GLOBAL COUNTER -->
  <section class="section-band">
    <div class="px-6 py-24 flex flex-col gap-12 items-center sm:py-32">
      <div class="eyebrow">
        <span class="eyebrow-bracket">[</span>
        <span class="eyebrow-num">00</span>
        <span class="eyebrow-sep">/</span>
        <span>{{ t.landing.sections.globalImpact }}</span>
        <span class="eyebrow-bracket">]</span>
      </div>
      <LandingSumHours />
    </div>
  </section>

  <!-- VISUALIZATION SHOWCASE -->
  <section>
    <div class="mx-auto px-6 py-24 max-w-6xl sm:py-32">
      <div class="mb-16 flex flex-col gap-3">
        <div class="eyebrow">
          <span class="eyebrow-bracket">[</span>
          <span class="eyebrow-num">01</span>
          <span class="eyebrow-sep">/</span>
          <span>{{ t.landing.sections.visualization }}</span>
          <span class="eyebrow-bracket">]</span>
        </div>
        <h2 class="section-heading text-ct-fg leading-[1.05] font-mono font-semibold max-w-3xl">
          {{ t.landing.features.visualization.title }}
        </h2>
        <p class="text-[14px] text-ct-fg-muted leading-[1.7] mt-2 max-w-2xl">
          {{ t.landing.features.visualization.description }}
        </p>
      </div>

      <!--
        The four dashboard previews pull in Observable Plot + d3 (~600KB of
        JS). Defer them until the user scrolls into range so the landing
        first paint ships with none of that on the critical path.
      -->
      <OnVisible min-height="640px" root-margin="400px">
        <div class="showcase-frame">
          <div class="showcase-grid">
            <div class="showcase-cell showcase-cell--top">
              <LazyDashboardTopCardTemplateDemo />
            </div>
            <div class="showcase-cell showcase-cell--cal">
              <LazyDashboardCalendarCardDemo class="w-full" />
            </div>
          </div>
          <div class="showcase-cell showcase-scroll">
            <LazyDashboardProjectYDotCardDemo />
          </div>
          <div class="showcase-cell showcase-scroll">
            <LazyPoltDailyDistributionTemplateDemo />
          </div>
        </div>
      </OnVisible>

      <!--
        Static previews above only hint at the real dashboard. The /demo
        route renders the full UnifiedUserDashboard against synthetic data
        so visitors can poke around the live UI before signing in.
      -->
      <div class="mt-10 flex justify-center sm:mt-12">
        <NuxtLink
          aria-label="demo"
          :to="`/${($route.params.locale || 'en')}/demo`"
          class="demo-cta"
        >
          <i class="demo-cta-icon i-eva-bar-chart-outline" />
          <span>{{ t.landing.demo }}</span>
          <i class="demo-cta-arrow i-tabler-arrow-right" />
        </NuxtLink>
      </div>
    </div>
  </section>

  <!-- FEATURE PAIRS -->
  <section class="section-band">
    <div class="mx-auto px-6 py-24 max-w-6xl space-y-28 sm:py-32 sm:space-y-32">
      <!-- 02 SAVE — wide hero card with calendar visual -->
      <div class="feature-card feature-card--wide">
        <div class="feature-card-body">
          <div class="eyebrow feature-eyebrow">
            <span class="eyebrow-bracket">[</span>
            <span class="eyebrow-num">02</span>
            <span class="eyebrow-sep">/</span>
            <span>{{ t.landing.sections.alwaysSynced }}</span>
            <span class="eyebrow-bracket">]</span>
          </div>
          <h2 class="section-heading feature-title text-ct-fg leading-[1.05] font-mono font-semibold">
            {{ t.landing.features.save.title }}
          </h2>
          <p class="feature-desc text-ct-fg-muted leading-[1.7] max-w-2xl">
            {{ t.landing.features.save.description }}
          </p>
          <div class="feature-stat-row">
            <div class="feature-stat">
              <span class="feature-stat-num">∞</span>
              <span class="feature-stat-label">{{ t.landing.features.save.statRetention || 'Forever' }}</span>
            </div>
            <div class="feature-stat">
              <span class="feature-stat-num">1m</span>
              <span class="feature-stat-label">{{ t.landing.features.save.statResolution || 'Per minute' }}</span>
            </div>
            <div class="feature-stat">
              <span class="feature-stat-num">0$</span>
              <span class="feature-stat-label">{{ t.landing.features.save.statCost || 'Free to keep' }}</span>
            </div>
          </div>
        </div>
        <div class="feature-card-visual">
          <i class="i-line-md-calendar feature-card-visual-icon" />
          <span class="feature-card-visual-grid" aria-hidden="true" />
        </div>
      </div>

      <!-- 03 EXPORT — split with API/JSON snippet -->
      <div class="gap-12 grid items-stretch md:gap-14 md:grid-cols-[1fr_1.25fr]">
        <div class="feature-text-block">
          <div class="eyebrow feature-eyebrow">
            <span class="eyebrow-bracket">[</span>
            <span class="eyebrow-num">03</span>
            <span class="eyebrow-sep">/</span>
            <span>{{ t.landing.sections.openData }}</span>
            <span class="eyebrow-bracket">]</span>
          </div>
          <h2 class="section-heading feature-title text-ct-fg leading-[1.05] font-mono font-semibold">
            {{ t.landing.features.export.title }}
          </h2>
          <p class="feature-desc text-ct-fg-muted leading-[1.7] max-w-xl">
            {{ t.landing.features.export.description }}
          </p>
          <div class="feature-chip-row">
            <span class="feature-chip"><i class="i-tabler-braces" />JSON</span>
            <span class="feature-chip"><i class="i-tabler-table" />CSV</span>
            <span class="feature-chip"><i class="i-tabler-api" />REST API</span>
          </div>
        </div>
        <div class="code-card">
          <div class="code-card-bar">
            <span class="code-card-method">GET</span>
            <span class="code-card-path">/v3/stats</span>
            <span class="code-card-status">200 OK</span>
          </div>
          <pre class="code-card-body"><code class="code-card-code" v-html="sampleJsonHtml" /></pre>
        </div>
      </div>

      <!-- 04 EDITOR — title above, editor grid below -->
      <div class="space-y-12">
        <div class="feature-text-block max-w-3xl">
          <div class="eyebrow feature-eyebrow">
            <span class="eyebrow-bracket">[</span>
            <span class="eyebrow-num">04</span>
            <span class="eyebrow-sep">/</span>
            <span>{{ t.landing.sections.editors }}</span>
            <span class="eyebrow-bracket">]</span>
          </div>
          <h2 class="section-heading feature-title text-ct-fg leading-[1.05] font-mono font-semibold">
            {{ t.landing.features.editor.title }}
          </h2>
          <p class="feature-desc text-ct-fg-muted leading-[1.7] max-w-2xl">
            {{ t.landing.features.editor.description }}
          </p>
        </div>
        <div class="editor-grid">
          <div class="editor-tile editor-tile--lg">
            <i class="i-logos-visual-studio-code editor-tile-icon" />
            <span class="editor-tile-name">VS Code</span>
          </div>
          <div class="editor-tile editor-tile--lg">
            <i class="i-logos-jetbrains editor-tile-icon" />
            <span class="editor-tile-name">JetBrains</span>
          </div>
          <div class="editor-tile editor-tile--lg">
            <i class="i-simple-icons-cursor editor-tile-icon editor-tile-icon--mono" />
            <span class="editor-tile-name">Cursor</span>
          </div>
          <div class="editor-tile editor-tile--lg">
            <i class="i-simple-icons-windsurf editor-tile-icon editor-tile-icon--mono" />
            <span class="editor-tile-name">Windsurf</span>
          </div>
          <div class="editor-tile editor-tile--lg">
            <i class="i-tabler-rocket editor-tile-icon editor-tile-icon--mono" />
            <span class="editor-tile-name">Antigravity</span>
          </div>
          <div class="editor-tile editor-tile--lg editor-tile--more">
            <i class="i-tabler-plus editor-tile-icon editor-tile-icon--mono" />
            <span class="editor-tile-name">{{ t.landing.features.editor.more || 'more' }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- WIDGETS -->
  <LandingWidgetShowcase />

  <!-- PRICING -->
  <section>
    <div class="mx-auto px-6 py-24 max-w-6xl sm:py-32">
      <div class="mb-12 text-center flex flex-col gap-3 items-center">
        <div class="eyebrow">
          <span class="eyebrow-bracket">[</span>
          <span class="eyebrow-num">06</span>
          <span class="eyebrow-sep">/</span>
          <span>{{ t.landing.sections.pricing }}</span>
          <span class="eyebrow-bracket">]</span>
        </div>
        <h2 class="section-heading text-ct-fg leading-[1.05] font-mono font-semibold max-w-3xl">
          {{ t.landing.pricing.heading }}
        </h2>
        <p class="text-[14px] text-ct-fg-muted leading-[1.7] mt-2 max-w-xl">
          {{ t.landing.pricing.description }}
        </p>
      </div>
      <OnVisible min-height="420px" root-margin="300px">
        <LazyPriceTable />
      </OnVisible>
    </div>
  </section>

  <!-- CLOSING CTA -->
  <section class="section-band">
    <div class="px-6 py-24 text-center flex flex-col gap-8 items-center sm:py-32">
      <div class="eyebrow">
        <span class="eyebrow-bracket">[</span>
        <span class="eyebrow-num">⇢</span>
        <span class="eyebrow-sep">/</span>
        <span>{{ t.landing.sections.startTracking }}</span>
        <span class="eyebrow-bracket">]</span>
      </div>
      <h2 class="closing-heading text-ct-fg font-mono font-semibold max-w-3xl">
        <span class="closing-line block">{{ t.landing.closing.line1 }}</span>
        <span class="closing-line closing-line--2 block">{{ t.landing.closing.line2 }}</span>
      </h2>
      <LoginButton />
    </div>
  </section>
</template>

<style scoped>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.closing-heading {
  position: relative;
  font-family: var(--ct-font-sans);
  letter-spacing: -0.02em;
  color: var(--ct-fg);
  line-height: 1.25;
}
.closing-line {
  font-size: clamp(1.25rem, 3vw, 1.875rem);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-fg-muted);
}
.closing-line--2 {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  color: var(--ct-primary);
  font-weight: var(--ct-weight-semibold);
}

.hero-desc {
  font-family: var(--ct-font-sans);
  font-size: clamp(15px, 1.6vw, 17px);
  line-height: 1.7;
  color: var(--ct-fg-muted);
  text-align: center;
  max-width: 38rem;
  padding: 0 16px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ct-fg-muted);
  background: color-mix(in srgb, var(--ct-surface-1) 70%, transparent);
  border: 1px solid var(--ct-border);
  border-radius: 999px;
  backdrop-filter: blur(6px);
}
.hero-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ct-primary);
  box-shadow: 0 0 12px color-mix(in srgb, var(--ct-primary) 80%, transparent);
  animation: hero-badge-pulse 2.4s ease-in-out infinite;
}
@keyframes hero-badge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.hero-meta {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
  letter-spacing: 0.04em;
}
.hero-meta-rule {
  width: 28px;
  height: 1px;
  background: color-mix(in srgb, var(--ct-primary) 35%, transparent);
}

/* Feature card (02 SAVE) */
.feature-card {
  position: relative;
  display: grid;
  gap: 0;
  border: 1px solid var(--ct-border);
  background: var(--ct-surface-1);
  overflow: hidden;
}
.feature-card--wide {
  grid-template-columns: 1fr;
}
@media (min-width: 768px) {
  .feature-card--wide {
    grid-template-columns: 1.4fr 1fr;
  }
}
.feature-card-body {
  padding: clamp(1.75rem, 3vw, 2.75rem);
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Feature text block: title/description rhythm */
.feature-text-block {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.feature-eyebrow {
  margin-bottom: 18px;
}
.feature-title {
  margin: 0 0 22px 0;
}
.feature-desc {
  font-size: 15px;
  margin: 0;
}
.feature-card-body .feature-chip-row,
.feature-text-block .feature-chip-row {
  margin-top: 22px;
}
.feature-card-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--ct-primary) 8%, transparent) 0%,
    transparent 70%);
  border-top: 1px solid var(--ct-border);
}
@media (min-width: 768px) {
  .feature-card-visual {
    border-top: 0;
    border-left: 1px solid var(--ct-border);
  }
}
.feature-card-visual-icon {
  font-size: clamp(4rem, 9vw, 6.5rem);
  color: var(--ct-primary);
  opacity: 0.85;
  position: relative;
  z-index: 1;
}
.feature-card-visual-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, var(--ct-border) 1px, transparent 1px),
    linear-gradient(to bottom, var(--ct-border) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.55;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
}

.feature-stat-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px 32px;
  margin-top: 28px;
  padding-top: 22px;
  border-top: 1px dashed var(--ct-border);
}
.feature-stat {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  min-width: 88px;
}
.feature-stat-num {
  font-family: var(--ct-font-mono);
  font-size: clamp(1.4rem, 2.4vw, 1.9rem);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-primary);
  line-height: 1;
}
.feature-stat-label {
  font-family: var(--ct-font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--ct-fg-muted);
  text-transform: uppercase;
}

/* Feature chip row (03) */
.feature-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}
.feature-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-family: var(--ct-font-mono);
  font-size: 12px;
  color: var(--ct-fg);
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border);
  border-radius: 999px;
}
.feature-chip i {
  font-size: 14px;
  color: var(--ct-primary);
}

/* Code card (03) */
.code-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ct-border);
  background: var(--ct-surface);
  font-family: var(--ct-font-mono);
  overflow: hidden;
  border-radius: 14px;
}
.code-card-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--ct-surface-1);
  border-bottom: 1px solid var(--ct-border);
  font-family: var(--ct-font-mono);
  min-width: 0;
}
.code-card-method {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 9px;
  font-size: 11px;
  font-weight: var(--ct-weight-semibold);
  letter-spacing: 0.08em;
  color: var(--ct-on-primary, #fff);
  background: var(--ct-primary);
  border-radius: 6px;
}
.code-card-path {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 13px;
  color: var(--ct-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.code-card-status {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--ct-fg-muted);
}
.code-card-status::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #28c840;
  box-shadow: 0 0 8px color-mix(in srgb, #28c840 60%, transparent);
}
.code-card-body {
  margin: 0;
  padding: 18px 20px;
  font-family: var(--ct-font-mono);
  font-variant-ligatures: none;
  font-feature-settings: "tnum" 1, "calt" 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--ct-fg);
  white-space: pre;
  overflow-x: auto;
  scrollbar-width: thin;
  tab-size: 2;
}
.code-card-body .code-card-code,
.code-card-body :deep(span) {
  font-family: var(--ct-font-mono);
  font-variant-ligatures: none;
  font-feature-settings: "tnum" 1, "calt" 0;
}
.code-card-body :deep(.tk-key) { color: #7aa2f7; }
.code-card-body :deep(.tk-str) { color: #9ece6a; }
.code-card-body :deep(.tk-num) { color: #ff9e64; }
.code-card-body :deep(.tk-pun) { color: color-mix(in srgb, var(--ct-fg) 55%, transparent); }
html[data-scheme="light"] .code-card-body :deep(.tk-key) { color: #2563eb; }
html[data-scheme="light"] .code-card-body :deep(.tk-str) { color: #15803d; }
html[data-scheme="light"] .code-card-body :deep(.tk-num) { color: #c2410c; }
html[data-scheme="light"] .code-card-body :deep(.tk-pun) { color: color-mix(in srgb, var(--ct-fg) 50%, transparent); }
@media (min-width: 1024px) {
  .code-card-body { font-size: 13px; }
}

/* Editor grid (04) */
.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
@media (min-width: 640px) {
  .editor-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (min-width: 1024px) {
  .editor-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
}
.editor-tile--lg {
  flex-direction: column;
  gap: 10px;
  padding: 1.5rem 1rem;
}
.editor-tile-icon {
  width: 2.75rem;
  height: 2.75rem;
}
.editor-tile-icon--mono {
  color: var(--ct-fg);
  opacity: 0.85;
}
.editor-tile-name {
  font-family: var(--ct-font-mono);
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--ct-fg-muted);
}
.editor-tile--more {
  border-style: dashed;
}

/* Hero */
.hero {
  min-height: clamp(520px, 88vh, 820px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, var(--ct-border) 1px, transparent 1px),
    linear-gradient(to bottom, var(--ct-border) 1px, transparent 1px);
  background-size: 72px 72px;
  opacity: 0.55;
  mask-image: radial-gradient(ellipse at center, black 20%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 20%, transparent 75%);
  pointer-events: none;
}

.hero-glow {
  position: absolute;
  left: 50%;
  top: 55%;
  width: min(75vw, 720px);
  height: min(75vw, 720px);
  transform: translate(-50%, -50%);
  /* Pre-blurred radial: the soft falloff is baked into the gradient stops, so
     we no longer need a 56px filter pass on every paint — large win on mobile
     LCP where filter:blur is one of the most expensive paint ops. */
  background: radial-gradient(circle,
    color-mix(in srgb, var(--ct-primary) 22%, transparent) 0%,
    color-mix(in srgb, var(--ct-primary) 10%, transparent) 35%,
    transparent 70%);
  pointer-events: none;
  opacity: 0.85;
  will-change: auto;
}
/* Keep the blur for desktops where GPU paint is cheap and the softer halo
   reads better against the grid. */
@media (min-width: 1024px) and (hover: hover) {
  .hero-glow {
    background: radial-gradient(circle, color-mix(in srgb, var(--ct-primary) 18%, transparent) 0%, transparent 65%);
    filter: blur(56px);
  }
}
/* Light scheme: a strong blue blur muddies the hero on a soft-gray bg.
   Fall back to a tighter, lower-opacity halo so the grid carries focus. */
html[data-scheme="light"] .hero-glow {
  width: min(55vw, 520px);
  height: min(55vw, 520px);
  background: radial-gradient(circle,
    color-mix(in srgb, var(--ct-primary) 12%, transparent) 0%,
    color-mix(in srgb, var(--ct-primary) 5%, transparent) 40%,
    transparent 75%);
  opacity: 0.6;
}
@media (min-width: 1024px) and (hover: hover) {
  html[data-scheme="light"] .hero-glow {
    background: radial-gradient(circle, color-mix(in srgb, var(--ct-primary) 8%, transparent) 0%, transparent 70%);
    filter: blur(42px);
  }
}

/* Section band: subtle alternating bg */
.section-band {
  position: relative;
  background-color: var(--ct-surface-1);
}

.section-band::before,
.section-band::after {
  content: "";
  position: absolute;
  left: 50%;
  width: 100vw;
  height: 1px;
  background: var(--ct-border);
  opacity: 0.7;
  transform: translateX(-50%);
  pointer-events: none;
}

.section-band::before {
  top: 0;
}

.section-band::after {
  bottom: 0;
}

/* Showcase frame — mirrors the actual dashboard look */
.showcase-frame {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--ct-border);
  border-radius: 16px;
  background: var(--ct-bg);
  overflow: hidden;
}
.showcase-grid {
  display: grid;
  grid-template-columns: 1fr;
}
@media (min-width: 1024px) {
  .showcase-grid {
    grid-template-columns: minmax(0, 24rem) minmax(0, 1fr);
  }
  .showcase-grid > .showcase-cell + .showcase-cell {
    border-left: 1px solid var(--ct-border-subtle);
  }
}
.showcase-cell {
  position: relative;
  min-width: 0;
}
.showcase-frame > .showcase-cell + .showcase-cell,
.showcase-frame > .showcase-grid + .showcase-cell {
  border-top: 1px solid var(--ct-border-subtle);
}
.showcase-scroll {
  overflow-x: auto;
  scrollbar-width: thin;
}
.showcase-scroll::-webkit-scrollbar {
  height: 6px;
}
.showcase-scroll::-webkit-scrollbar-thumb {
  background: var(--ct-border);
  border-radius: 3px;
}

/* Feature icon */
.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(7rem, 16vw, 10rem);
  height: clamp(7rem, 16vw, 10rem);
  background-color: var(--ct-surface-1);
  position: relative;
}

.feature-icon::before,
.feature-icon::after {
  content: "";
  position: absolute;
  width: 14px;
  height: 14px;
  border: 1px solid var(--color-primary-1);
  opacity: 0.5;
}

.feature-icon::before {
  top: -1px;
  left: -1px;
  border-right: 0;
  border-bottom: 0;
}

.feature-icon::after {
  bottom: -1px;
  right: -1px;
  border-left: 0;
  border-top: 0;
}

.feature-icon i {
  font-size: clamp(3rem, 7vw, 4.5rem);
  color: var(--color-primary-1);
  opacity: 0.85;
}

/* Demo CTA (under visualization showcase) */
.demo-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 22px;
  font-family: var(--ct-font-mono);
  font-size: 13px;
  letter-spacing: 0.06em;
  color: var(--ct-fg);
  text-decoration: none;
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border);
  border-radius: 999px;
  transition: background-color 200ms ease, border-color 200ms ease, transform 200ms ease;
}
.demo-cta:hover {
  background: var(--ct-surface-2);
  border-color: color-mix(in srgb, var(--ct-primary) 45%, transparent);
  transform: translateY(-1px);
}
.demo-cta-icon {
  font-size: 16px;
  color: var(--ct-primary);
}
.demo-cta-arrow {
  font-size: 15px;
  color: var(--ct-fg-muted);
  transition: transform 200ms ease;
}
.demo-cta:hover .demo-cta-arrow {
  color: var(--ct-primary);
  transform: translateX(3px);
}

/* Editor tile */
.editor-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background-color: var(--ct-surface-1);
  border: 1px solid var(--ct-border);
  transition: background-color 220ms ease, transform 220ms ease, border-color 220ms ease;
}

.editor-tile:hover {
  background-color: var(--ct-surface-2);
  border-color: color-mix(in srgb, var(--color-primary-1) 50%, transparent);
  transform: translateY(-2px);
}
</style>
