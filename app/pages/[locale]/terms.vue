<script setup lang="ts">
definePageMeta({
  middleware: ['i18n'],
  layout: 'landing',
})

const locale = useLocale()

const isEnglish = computed(() => (locale.value || 'en') === 'en')
const canonicalUrl = computed(() => `https://codetime.dev/${locale.value || 'en'}/terms`)

const lastUpdated = '2026-05-19'

useSeoMeta({
  title: 'Terms of Service · Code Time',
  description: 'The terms that govern your use of Code Time.',
  ogTitle: 'Terms of Service · Code Time',
  ogDescription: 'The terms that govern your use of Code Time.',
  ogUrl: canonicalUrl.value,
  ogType: 'website',
  twitterCard: 'summary',
  robots: 'index, follow',
})

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl.value }],
})

const jsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  'name': 'Terms of Service',
  'url': canonicalUrl.value,
  'inLanguage': 'en',
  'dateModified': lastUpdated,
  'publisher': { '@type': 'Organization', 'name': 'Code Time', '@id': 'https://codetime.dev/#org' },
}))

useHead({
  script: [
    { type: 'application/ld+json', innerHTML: () => JSON.stringify(jsonLd.value) },
  ],
})
</script>

<template>
  <article class="legal-page mx-auto px-6 py-16 max-w-[78ch] sm:py-24">
    <header class="legal-header">
      <p class="legal-eyebrow">
        <span class="eyebrow-bracket">[</span>
        <span class="eyebrow-num">§</span>
        <span class="eyebrow-sep">/</span>
        <span>legal</span>
        <span class="eyebrow-bracket">]</span>
      </p>
      <h1 class="legal-title">
        Terms of Service
      </h1>
      <p class="legal-meta">
        Last updated: <time :datetime="lastUpdated">{{ lastUpdated }}</time>
      </p>
    </header>

    <div v-if="!isEnglish" class="legal-translation-note">
      The English text below is the authoritative version of these terms.
      Localized translations are not yet available.
    </div>

    <section class="legal-section">
      <p>
        Code Time (<a href="https://codetime.dev">codetime.dev</a>) is an
        independent personal project. These Terms govern your access to
        and use of the website, editor plugins, agent CLI, and API
        (together, the "<strong>Service</strong>"). By using the Service
        you agree to these Terms. If you do not agree, don't use it. How
        we handle data is described in our
        <NuxtLink :to="`/${locale || 'en'}/privacy`" class="legal-inline-link">
          Privacy Policy
        </NuxtLink>.
      </p>
    </section>

    <section class="legal-section">
      <h2>1. Your account and acceptable use</h2>
      <p>
        You sign in via GitHub or Google OAuth. You're responsible for
        what happens under your account and for keeping your API token
        secret. You must be at least 13 years old (or 16 if you live in
        an EU country that applies that as the digital-consent age).
      </p>
      <p>You agree not to:</p>
      <ul>
        <li>
          submit fabricated coding activity, or otherwise tamper with
          leaderboards, badges, or aggregate statistics;
        </li>
        <li>
          materially exceed documented API rate limits or design tools
          to evade them;
        </li>
        <li>
          attempt to gain unauthorised access to other accounts, our
          infrastructure, or other users' data;
        </li>
        <li>
          resell the Service, or build a competing service primarily by
          re-exposing our API;
        </li>
        <li>use the Service to violate any applicable law.</li>
      </ul>
    </section>

    <section class="legal-section">
      <h2>2. Plans, billing, and refunds</h2>
      <p>
        A free tier supports unlimited personal use with full history
        retention. Pro features are billed through LemonSqueezy at the
        prices shown on the pricing page at the time of purchase, on a
        monthly, yearly, or one-time basis. Subscriptions renew until
        cancelled; cancel from your LemonSqueezy customer portal at any
        time, taking effect at the end of the current billing period.
      </p>
      <p>
        Refunds are handled case-by-case at our reasonable discretion.
        Email <a href="mailto:support@codetime.dev">support@codetime.dev</a>
        within 14 days of a charge to ask. Statutory consumer rights
        (e.g. EU withdrawal rights, where applicable) are unaffected.
      </p>
    </section>

    <section class="legal-section">
      <h2>3. Your data and our IP</h2>
      <p>
        You keep ownership of the coding-activity records and agent
        telemetry you submit. You grant us a non-exclusive licence to
        host, process, and display this data solely to operate the Service
        for you — including rendering your dashboards and computing public
        leaderboards and profile pages (see the Privacy Policy for what is
        public and how to limit it).
      </p>
      <p>
        The Code Time name, logo, website design, and the proprietary
        parts of the server and plugins remain ours or our licensors'.
        Open-source components are governed by their own licences. Nothing
        in these Terms transfers any of those rights to you, except the
        limited right to use the Service as intended.
      </p>
    </section>

    <section class="legal-section">
      <h2>4. Service availability and termination</h2>
      <p>
        We aim for high availability but don't guarantee that the Service
        is uninterrupted or error-free. We may modify, suspend, or
        discontinue features with reasonable notice when practical.
      </p>
      <p>
        You can close your account at any time from Dashboard → Settings
        → Danger Zone. Closing your account permanently deletes your data
        (subject to short backup retention as described in the Privacy
        Policy). We may suspend or terminate accounts that materially
        violate these Terms, that are used to abuse the Service, or that
        we are required to remove by law, giving you reasonable notice
        where possible.
      </p>
    </section>

    <section class="legal-section">
      <h2>5. Disclaimer and limitation of liability</h2>
      <p>
        The Service is provided <strong>"as is" and "as available"</strong>
        without warranties of any kind, whether express or implied,
        including any warranty of merchantability, fitness for a
        particular purpose, or non-infringement. We don't warrant that
        the Service will be accurate, reliable, or available without
        interruption.
      </p>
      <p>
        To the maximum extent permitted by applicable law, we are not
        liable for any indirect, incidental, special, consequential, or
        punitive damages, or for any loss of profits, revenue, data, or
        goodwill, arising from or in connection with your use of the
        Service. Our total liability for direct damages will not exceed
        the greater of (a) the amount you paid us in the 12 months before
        the event giving rise to the claim, or (b) USD 100. Nothing in
        these Terms limits liability that cannot be limited under
        applicable law (including, in some jurisdictions, liability for
        death, personal injury, gross negligence, fraud, or statutory
        consumer rights).
      </p>
    </section>

    <section class="legal-section">
      <h2>6. General</h2>
      <p>
        We may update these Terms as the Service evolves. Material
        changes will be flagged on the site; continued use after a change
        means you accept the updated Terms. If any clause is found
        unenforceable, the rest stays in effect. These Terms are the
        entire agreement between you and us regarding the Service. You
        may not assign them; we may assign them to a successor of the
        Service. For notices to us, use
        <a href="mailto:support@codetime.dev">support@codetime.dev</a>;
        for notices to you, we may use the email on your account or post
        an in-product notice.
      </p>
      <p>
        These Terms are governed by the laws of the operator's place of
        residence (see the Privacy Policy, §9), without regard to its
        conflict-of-laws principles. Mandatory consumer-protection laws
        in your country of residence still apply where they would override
        this choice.
      </p>
    </section>

    <section class="legal-section">
      <h2>Contact</h2>
      <p>
        Code Time is an independent personal project. Questions about
        these Terms:
        <a href="mailto:support@codetime.dev">support@codetime.dev</a>.
        Operator: an individual sole proprietor based in Tokyo, Japan.
        Full legal name and registered address are provided on lawful
        request — email the address above.
      </p>
    </section>

    <footer class="legal-foot">
      <NuxtLink :to="`/${locale || 'en'}/privacy`" class="legal-foot-link">
        Privacy Policy
      </NuxtLink>
      <span class="legal-foot-sep">·</span>
      <NuxtLink :to="`/${locale || 'en'}`" class="legal-foot-link">
        Back to home
      </NuxtLink>
    </footer>
  </article>
</template>

<style scoped>
.legal-page {
  font-family: var(--ct-font-mono);
  color: var(--ct-fg);
  line-height: 1.7;
}

/* HEADER -------------------------------------------------------------- */
.legal-header {
  margin-bottom: 3.5rem;
  padding-bottom: 1.75rem;
  border-bottom: 1px dashed var(--ct-border);
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
.legal-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ct-fg-muted);
}
.eyebrow-bracket { color: var(--ct-fg-disabled); }
.eyebrow-num     { color: var(--ct-primary); font-weight: var(--ct-weight-semibold); }
.eyebrow-sep     { color: var(--ct-fg-disabled); }
.legal-title {
  font-family: var(--ct-font-mono);
  font-size: clamp(2rem, 4.5vw, 2.75rem);
  font-weight: var(--ct-weight-semibold);
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: var(--ct-fg);
}
.legal-meta {
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
}

/* CALLOUT (non-en banner) -------------------------------------------- */
.legal-translation-note {
  margin-bottom: 2.5rem;
  padding: 1rem 1.125rem;
  font-family: var(--ct-font-mono);
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--ct-fg-muted);
  background: var(--ct-surface-1);
  border: 1px dashed var(--ct-border);
  border-radius: 8px;
}

/* SECTIONS ----------------------------------------------------------- */
.legal-section {
  margin-bottom: 2.75rem;
}
.legal-section h2 {
  font-family: var(--ct-font-mono);
  font-size: 1.375rem;
  font-weight: var(--ct-weight-semibold);
  letter-spacing: -0.015em;
  line-height: 1.3;
  margin-bottom: 1rem;
  color: var(--ct-fg);
}
.legal-section p,
.legal-section li {
  font-size: 15px;
  color: var(--ct-fg-muted);
}
.legal-section p + p,
.legal-section ul + p,
.legal-section p + ul {
  margin-top: 0.875rem;
}

/* Lists: mono-style em-dash markers in primary tint */
.legal-section ul {
  list-style: none;
  padding-left: 0;
  margin: 0.875rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.legal-section li {
  position: relative;
  padding-left: 1.5rem;
}
.legal-section li::before {
  content: "—";
  position: absolute;
  left: 0;
  top: 0;
  color: var(--ct-primary);
  opacity: 0.7;
}

/* Inline elements ---------------------------------------------------- */
.legal-section a,
.legal-inline-link {
  color: var(--ct-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
}
.legal-section a:hover,
.legal-inline-link:hover {
  text-decoration-thickness: 2px;
}
.legal-section strong {
  color: var(--ct-fg);
  font-weight: var(--ct-weight-semibold);
}
.legal-section code {
  font-family: var(--ct-font-mono);
  font-size: 13px;
  padding: 1px 6px;
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border);
  border-radius: 4px;
  color: var(--ct-fg);
}

/* FOOTER ------------------------------------------------------------- */
.legal-foot {
  margin-top: 4rem;
  padding-top: 1.75rem;
  border-top: 1px dashed var(--ct-border);
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-muted);
}
.legal-foot-sep { color: var(--ct-fg-disabled); }
.legal-foot-link {
  color: var(--ct-fg-muted);
  transition: color var(--ct-duration-fast) var(--ct-ease);
}
.legal-foot-link:hover { color: var(--ct-primary); }
</style>
