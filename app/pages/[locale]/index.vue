<script setup lang="ts">
definePageMeta({
  middleware: ['i18n'],
  layout: 'landing',
})
const t = useI18N()

watchEffect(() => {
  useSeoMeta({
    title: 'Code Time - Programming Time Analytics & Insights',
    description: 'Track your programming time, analyze coding patterns, and get insights into your development productivity. Compatible with VS Code, JetBrains IDEs, and more.',
    keywords: 'programming time tracker, coding analytics, developer productivity, code metrics, programming insights, VS Code extension, JetBrains plugin',
    ogTitle: 'Code Time - Programming Time Analytics & Insights',
    ogDescription: 'Track your programming time, analyze coding patterns, and get insights into your development productivity. Compatible with VS Code, JetBrains IDEs, and more.',
    ogType: 'website',
    ogImage: '/icon.png',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Code Time - Programming Time Analytics & Insights',
    twitterDescription: 'Track your programming time, analyze coding patterns, and get insights into your development productivity.',
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
      'name': 'Code Time — Programming Time Analytics & Insights',
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
    <div class="hero-scan" aria-hidden="true" />
    <div class="hero-glow" aria-hidden="true" />
    <div class="hero-vignette" aria-hidden="true" />

    <div class="px-6 py-24 flex flex-col gap-10 items-center justify-center relative lg:py-40 sm:py-32">
      <LandingTitle />

      <p class="text-[15px] text-surface-dimmed leading-[1.65] tracking-[0.01em] font-mono px-4 text-center max-w-xl sm:text-[16px]">
        {{ t.landing.description }}
      </p>

      <div class="mt-2">
        <LoginButton />
      </div>

    </div>
  </section>

  <!-- Privacy-respecting coding-time analytics description (kept for SEO/agents only) -->
  <section class="agent-friendly-summary visually-hidden" aria-label="About Code Time">
    <div class="mx-auto px-6 py-16 max-w-4xl space-y-6">
      <h2 class="text-2xl text-surface font-mono font-semibold">
        Privacy-respecting coding-time analytics for VS Code and JetBrains
      </h2>
      <p class="text-[15px] text-surface-dimmed leading-[1.7] font-mono">
        Code Time records per-minute coding activity reported by official
        editor plugins for Visual Studio Code and every JetBrains IDE. Sign
        in with GitHub or Google, install the plugin, and watch your
        dashboard fill in: daily distribution, language breakdown,
        per-workspace totals, and a calendar heatmap. Source code is never
        uploaded — only file paths, languages, and timestamps. Your raw
        events are exportable forever through the JSON API.
      </p>
      <p class="text-[15px] text-surface-dimmed leading-[1.7] font-mono">
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
        <h2 class="section-heading text-surface leading-[1.05] font-mono font-semibold max-w-3xl">
          {{ t.landing.features.visualization.title }}
        </h2>
        <p class="text-[14px] text-surface-dimmed leading-[1.7] font-mono mt-2 max-w-2xl">
          {{ t.landing.features.visualization.description }}
        </p>
      </div>

      <div class="gap-3 grid">
        <div class="gap-3 grid grid-cols-1 lg:grid-cols-[22rem_1fr]">
          <div class="showcase-tile">
            <DashboardTopCardTemplateDemo />
          </div>
          <div class="showcase-tile">
            <DashboardCalendarCardDemo class="w-full" />
          </div>
        </div>
        <div class="showcase-tile showcase-scroll">
          <DashboardProjectYDotCardDemo />
        </div>
        <div class="showcase-tile showcase-scroll">
          <PoltDailyDistributionTemplateDemo />
        </div>
      </div>
    </div>
  </section>

  <!-- FEATURE PAIRS -->
  <section class="section-band">
    <div class="mx-auto px-6 py-24 max-w-6xl space-y-24 sm:py-32">
      <!-- 02 SAVE -->
      <div class="gap-10 grid items-center md:gap-16 md:grid-cols-[1fr_auto]">
        <div class="space-y-3">
          <div class="eyebrow">
            <span class="eyebrow-bracket">[</span>
            <span class="eyebrow-num">02</span>
            <span class="eyebrow-sep">/</span>
            <span>{{ t.landing.sections.alwaysSynced }}</span>
            <span class="eyebrow-bracket">]</span>
          </div>
          <h2 class="section-heading text-surface leading-[1.05] font-mono font-semibold">
            {{ t.landing.features.save.title }}
          </h2>
          <p class="text-[14px] text-surface-dimmed leading-[1.7] font-mono max-w-xl">
            {{ t.landing.features.save.description }}
          </p>
        </div>
        <div class="feature-icon">
          <i class="i-line-md-calendar" />
        </div>
      </div>

      <!-- 03 EXPORT -->
      <div class="gap-10 grid items-center md:gap-16 md:grid-cols-[auto_1fr]">
        <div class="feature-icon md:order-1">
          <i class="i-line-md-cloud-down-twotone" />
        </div>
        <div class="space-y-3 md:order-2">
          <div class="eyebrow">
            <span class="eyebrow-bracket">[</span>
            <span class="eyebrow-num">03</span>
            <span class="eyebrow-sep">/</span>
            <span>{{ t.landing.sections.openData }}</span>
            <span class="eyebrow-bracket">]</span>
          </div>
          <h2 class="section-heading text-surface leading-[1.05] font-mono font-semibold">
            {{ t.landing.features.export.title }}
          </h2>
          <p class="text-[14px] text-surface-dimmed leading-[1.7] font-mono max-w-xl">
            {{ t.landing.features.export.description }}
          </p>
        </div>
      </div>

      <!-- 04 EDITOR -->
      <div class="gap-10 grid items-center md:gap-16 md:grid-cols-[1fr_auto]">
        <div class="space-y-3">
          <div class="eyebrow">
            <span class="eyebrow-bracket">[</span>
            <span class="eyebrow-num">04</span>
            <span class="eyebrow-sep">/</span>
            <span>{{ t.landing.sections.editors }}</span>
            <span class="eyebrow-bracket">]</span>
          </div>
          <h2 class="section-heading text-surface leading-[1.05] font-mono font-semibold">
            {{ t.landing.features.editor.title }}
          </h2>
          <p class="text-[14px] text-surface-dimmed leading-[1.7] font-mono max-w-xl">
            {{ t.landing.features.editor.description }}
          </p>
        </div>
        <div class="flex gap-4 items-center">
          <div class="editor-tile">
            <i class="i-logos-visual-studio-code h-14 w-14 md:h-16 md:w-16" />
          </div>
          <div class="editor-tile">
            <i class="i-logos-jetbrains h-14 w-14 md:h-16 md:w-16" />
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- PRICING -->
  <section>
    <div class="mx-auto px-6 py-24 max-w-6xl sm:py-32">
      <div class="mb-12 text-center flex flex-col gap-3 items-center">
        <div class="eyebrow">
          <span class="eyebrow-bracket">[</span>
          <span class="eyebrow-num">05</span>
          <span class="eyebrow-sep">/</span>
          <span>{{ t.landing.sections.pricing }}</span>
          <span class="eyebrow-bracket">]</span>
        </div>
        <h2 class="section-heading text-surface leading-[1.05] font-mono font-semibold">
          {{ t.landing.pricing.heading }}
        </h2>
      </div>
      <PriceTable />
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
      <h2 class="closing-heading text-surface font-mono font-semibold max-w-3xl">
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

.section-heading {
  font-size: clamp(2rem, 5vw, 3.25rem);
  letter-spacing: -0.02em;
}

.closing-heading {
  position: relative;
  letter-spacing: -0.02em;
  color: var(--r-surface-foreground-color);
  line-height: 1.25;
}

.closing-line {
  font-size: clamp(1.25rem, 3vw, 2rem);
}

.closing-line--2 {
  font-size: clamp(1.5rem, 4vw, 2.75rem);
  color: var(--color-primary-1);
  opacity: 0.9;
}

/* Eyebrow */
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-family: 'Berkeley Mono', 'Share Tech Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--color-primary-1);
}

.eyebrow-bracket {
  color: color-mix(in srgb, var(--color-primary-1) 55%, transparent);
  font-weight: 400;
}

.eyebrow-num {
  color: var(--r-surface-text-color);
  opacity: 0.85;
}

.eyebrow-sep {
  color: color-mix(in srgb, var(--color-primary-1) 45%, transparent);
}

/* Hero */
.hero {
  min-height: clamp(560px, 92vh, 900px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--r-surface-border-color) 80%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--r-surface-border-color) 80%, transparent) 1px, transparent 1px);
  background-size: 64px 64px;
  opacity: 0.2;
  mask-image: radial-gradient(ellipse at center, black 25%, transparent 78%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 25%, transparent 78%);
  pointer-events: none;
  animation: grid-drift 40s linear infinite;
}

.hero-scan {
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    180deg,
    transparent 0,
    transparent 3px,
    rgba(255, 255, 255, 0.012) 3px,
    rgba(255, 255, 255, 0.012) 4px
  );
  pointer-events: none;
  mix-blend-mode: overlay;
}

.hero-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center,
    transparent 50%,
    color-mix(in srgb, var(--r-color-surface-9) 60%, transparent) 100%);
  pointer-events: none;
}

@keyframes grid-drift {
  from { background-position: 0 0, 0 0; }
  to { background-position: 64px 64px, 64px 64px; }
}

.hero-glow {
  position: absolute;
  left: 50%;
  top: 60%;
  width: min(80vw, 800px);
  height: min(80vw, 800px);
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, color-mix(in srgb, var(--color-primary-1) 26%, transparent) 0%, transparent 60%);
  filter: blur(48px);
  pointer-events: none;
  opacity: 0.75;
  animation: glow-pulse 8s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.85; transform: translate(-50%, -50%) scale(1.08); }
}

/* Section band: subtle alternating bg */
.section-band {
  position: relative;
  background-color: rgb(var(--r-color-surface-7) / 0.12);
}

.section-band::before,
.section-band::after {
  content: "";
  position: absolute;
  left: 50%;
  width: 100vw;
  height: 1px;
  background: var(--r-surface-border-color);
  opacity: 0.3;
  transform: translateX(-50%);
  pointer-events: none;
}

.section-band::before {
  top: 0;
}

.section-band::after {
  bottom: 0;
}

/* Showcase tile — blueprint corner crosshairs */
.showcase-tile {
  background-color: transparent;
  border: 1px solid color-mix(in srgb, var(--r-surface-border-color) 38%, transparent);
  padding: 1rem;
  position: relative;
}

.showcase-tile::before,
.showcase-tile::after {
  content: "";
  position: absolute;
  width: 10px;
  height: 10px;
  border: 1px solid color-mix(in srgb, var(--color-primary-1) 70%, transparent);
  pointer-events: none;
  transition: opacity 220ms ease;
  opacity: 0.55;
}

.showcase-tile::before {
  top: -1px;
  left: -1px;
  border-right: 0;
  border-bottom: 0;
}

.showcase-tile::after {
  bottom: -1px;
  right: -1px;
  border-left: 0;
  border-top: 0;
}

.showcase-scroll {
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.showcase-scroll::-webkit-scrollbar {
  display: none;
}

/* Feature icon */
.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(7rem, 16vw, 10rem);
  height: clamp(7rem, 16vw, 10rem);
  background-color: rgb(var(--r-color-surface-7) / 0.16);
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

/* Editor tile */
.editor-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background-color: rgb(var(--r-color-surface-7) / 0.16);
  border: 1px solid color-mix(in srgb, var(--r-surface-border-color) 35%, transparent);
  transition: background-color 220ms ease, transform 220ms ease, border-color 220ms ease;
}

.editor-tile:hover {
  background-color: rgb(var(--r-color-surface-7) / 0.32);
  border-color: color-mix(in srgb, var(--color-primary-1) 50%, transparent);
  transform: translateY(-2px);
}

@media (prefers-reduced-motion: reduce) {
  .hero-grid,
  .hero-glow {
    animation: none;
  }
}
</style>
