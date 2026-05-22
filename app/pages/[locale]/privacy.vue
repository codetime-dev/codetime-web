<script setup lang="ts">
definePageMeta({
  middleware: ['i18n'],
  layout: 'landing',
})

const locale = useLocale()

const isEnglish = computed(() => (locale.value || 'en') === 'en')
const canonicalUrl = computed(() => `https://codetime.dev/${locale.value || 'en'}/privacy`)

const lastUpdated = '2026-05-22'

useSeoMeta({
  title: 'Privacy Policy · Code Time',
  description: 'What Code Time collects, where it goes, and how to control or remove it.',
  ogTitle: 'Privacy Policy · Code Time',
  ogDescription: 'What Code Time collects, where it goes, and how to control or remove it.',
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
  'name': 'Privacy Policy',
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
        Privacy Policy
      </h1>
      <p class="legal-meta">
        Last updated: <time :datetime="lastUpdated">{{ lastUpdated }}</time>
      </p>
    </header>

    <div v-if="!isEnglish" class="legal-translation-note">
      The English text below is the authoritative version of this policy.
      Localized translations are not yet available.
    </div>

    <section class="legal-section">
      <p>
        Code Time (<a href="https://codetime.dev">codetime.dev</a>) is an
        independent project run by an individual developer. This page
        describes, plainly, what data the Service collects, what we do with
        it, and how you can control or remove it. We process personal data
        in accordance with Japan's Act on the Protection of Personal
        Information (<strong>APPI</strong>), and — where they apply — the
        EU/UK General Data Protection Regulation
        (<strong>GDPR</strong>) and the California Consumer Privacy Act as
        amended by the CPRA (<strong>CCPA</strong>). If anything below is
        unclear, email
        <a href="mailto:support@codetime.dev">support@codetime.dev</a> and
        we will explain.
      </p>
    </section>

    <section class="legal-section">
      <h2>1. What we collect</h2>

      <p>
        <strong>Account.</strong> When you sign in with GitHub, Google,
        or Apple OAuth, we receive a provider account ID, your public
        username (where the provider supplies one), display name, avatar
        URL, and the email address linked to that provider. If you use
        Sign in with Apple and choose <em>Hide My Email</em>, we receive
        Apple's anonymised relay address instead of your real one and
        treat it the same as any other email on file. We never receive
        your password.
      </p>

      <p>
        <strong>Coding activity (from the editor plugins).</strong> The
        VS Code and JetBrains plugins send: per-minute timestamps, the
        language of the active file, the file path (relative and
        absolute), the workspace name, the git origin URL, the git branch,
        the editor, and the platform.
        <strong>Source code is never sent.</strong> Note that file paths
        and git origin URLs may themselves contain identifying strings
        (your username, client names, private-repo names). If that's a
        concern, configure path redaction in the plugin before connecting.
      </p>

      <p>
        <strong>AI-agent activity (from the agent CLI, optional).</strong>
        If you install the agent CLI, it sends session-level metadata:
        model name, token counts (input / output / cache), cache-hit rate,
        per-tool call and failure counts, estimated cost, session start /
        duration / turn count, project path, and the list of file paths
        touched. <strong>Prompt text, tool inputs/outputs, and file
          contents are not sent.</strong>
      </p>

      <p>
        <strong>iOS app.</strong> The iOS app is a thin client over the
        same dashboards described above. When you open it, it sends the
        same kind of request metadata any HTTP client would (app
        version, iOS version, device model family, preferred language,
        and your sign-in token if you're signed in). The auth token is
        stored in the iOS Keychain on your device. The app does
        <strong>not</strong> request the App Tracking Transparency
        (ATT) prompt because we do not track you across other apps or
        websites and do not collect the IDFA. The app does
        <strong>not</strong> use push notifications, and so does not
        register a push token. The app does not access your contacts,
        photos, microphone, camera, calendar, health data, or precise
        location. Apple may share anonymous, aggregated App Analytics
        and crash reports with us if (and only if) you have opted in
        under iOS Settings → Privacy &amp; Security → Analytics &amp;
        Improvements; that data is not linked to your account.
      </p>

      <p>
        <strong>Server logs.</strong> Like any web server, ours records
        request metadata for each request — timestamp, method, URL, your
        IP, user-agent, response status, request duration — to operate the
        service and detect abuse. Kept up to 90 days, then rotated out.
      </p>

      <p>
        <strong>Cookies.</strong> First-party: <code>auth_token</code> and
        <code>user_id</code> (sign-in session) and <code>locale</code>
        (your language preference). Third-party: we use
        <strong>Google Analytics 4</strong> (ID
        <code>G-36N091FBKT</code>), loaded lazily after your first
        interaction with the page, to measure aggregate site traffic.
        Google may set its own cookies (<code>_ga</code>,
        <code>_ga_*</code>). No advertising features are enabled and we do
        not run any cross-site tracking, retargeting, or fingerprinting.
        You can block Google Analytics in your browser without losing any
        Service feature.
      </p>
    </section>

    <section class="legal-section">
      <h2>2. How we use it</h2>
      <ul>
        <li>Render your dashboards, badges, widgets, and exports.</li>
        <li>Compute leaderboards and public profile pages (see §3).</li>
        <li>Bill Pro subscriptions through our payment processor.</li>
        <li>Respond to support requests.</li>
        <li>Keep the Service running, debugged, and reasonably secure.</li>
      </ul>
      <p>
        We do not sell your data. We do not share it with advertisers. We
        do not use your coding activity, prompts, or source code to train
        machine-learning models.
      </p>
    </section>

    <section class="legal-section">
      <h2>3. What is public</h2>
      <p>
        <strong>Some of your data is visible without signing in.</strong>
        Please read this section:
      </p>
      <ul>
        <li>
          <strong>Leaderboard.</strong> If your total coding minutes put
          you in the top ranks, your username, avatar, and total minutes
          appear on <code>/dashboard/leaderboard</code>.
          <strong>This is opt-out, not opt-in.</strong>
        </li>
        <li>
          <strong>Profile page.</strong> Your profile at
          <code>/user/&lt;your-id&gt;</code> shows your username, avatar,
          coding totals, language breakdown, bio, and (if enabled) your
          GitHub link. Search engines may index it.
        </li>
      </ul>
      <p>
        From Dashboard → Settings you can hide the <em>current</em>
        workspace name and language from your live status, hide your
        GitHub link, and edit your display name and bio. To remove
        yourself from the leaderboard and the public profile entirely,
        delete your account (§5) or email
        <a href="mailto:support@codetime.dev">support@codetime.dev</a>.
      </p>
    </section>

    <section class="legal-section">
      <h2>4. Who else processes the data</h2>
      <p>The data passes through these third parties as needed:</p>
      <ul>
        <li>
          <strong>GitHub</strong>, <strong>Google</strong>, and
          <strong>Apple</strong> — OAuth sign-in. Apple is also the
          distribution channel for the iOS app (App Store and
          TestFlight) and may collect its own diagnostics under your iOS
          privacy settings (see §1 iOS app).
        </li>
        <li>
          <strong>LemonSqueezy</strong> — payment processing for Pro
          subscriptions, sold on the website only (the iOS app does not
          offer in-app purchases). Card details go to LemonSqueezy
          directly; we receive only subscription status, customer ID,
          and transaction metadata.
        </li>
        <li>
          <strong>Google Analytics 4</strong> — aggregate traffic
          measurement on the website only; not loaded inside the iOS
          app (see §1 Cookies).
        </li>
        <li>
          Our <strong>hosting provider</strong> — runs the servers and
          the database.
        </li>
      </ul>
      <p>
        The Service runs on servers outside mainland China. Data may be
        processed in countries outside your country of residence. For
        EU/EEA/UK users, transfers to third countries are covered by an
        adequacy decision where one exists (e.g. the EU-Japan adequacy
        decision) or otherwise by Standard Contractual Clauses. Email us
        for the relevant documentation.
      </p>
    </section>

    <section class="legal-section">
      <h2>5. Your controls</h2>
      <ul>
        <li>
          <strong>Export.</strong> Dashboard → Settings → Export downloads
          your full raw coding-time history as a CSV file. For an export
          of other data we hold about you (account record, agent
          telemetry), email us.
        </li>
        <li>
          <strong>Delete data or close your account.</strong> Available
          from Dashboard → Settings → Danger Zone on the web, and from
          Settings → Account → Delete Account inside the iOS app (per
          Apple's account-deletion requirement). Account closure
          cascades the deletion to your coding minutes, event logs, and
          workspace metadata, and removes you from the leaderboard.
          Encrypted backups may still contain the data for up to 30
          days before rotation. <strong>Uninstalling the iOS app does
            not delete your account or your data on our
            servers</strong> — use the in-app or in-dashboard delete
          flow for that.
        </li>
        <li>
          <strong>Access, correction, restriction, objection.</strong>
          Email us. EU/EEA/UK users have these rights under the GDPR;
          California residents have equivalent rights under the CCPA /
          CPRA. We aim to respond within 30 days.
        </li>
        <li>
          <strong>Complaint to a regulator.</strong> EU/EEA/UK users may
          lodge a complaint with their local data protection authority.
        </li>
      </ul>
      <p>
        Active coding-time records are kept for as long as your account
        exists, so you can review history. They are deleted when you
        delete them or close your account. Financial records (subscription
        invoices) are kept as long as required by tax and accounting law.
      </p>
    </section>

    <section class="legal-section">
      <h2>6. Legal bases for processing</h2>
      <p>
        If you are in the EU/EEA, UK, or Switzerland, we process your
        data on the following bases:
        <strong>performance of a contract</strong> (Art. 6(1)(b)) to deliver
        the Service you signed up for;
        <strong>legitimate interests</strong> (Art. 6(1)(f)) to keep the
        Service secure and to measure aggregate usage;
        <strong>consent</strong> (Art. 6(1)(a)) for non-essential analytics
        where required; and
        <strong>legal obligation</strong> (Art. 6(1)(c)) for tax and
        accounting records.
      </p>
      <p>
        If you are in mainland China, the Service operates outside the
        mainland and using it requires your personal information to be
        transferred and processed overseas. By signing in you provide
        separate consent to that cross-border transfer for the purposes
        above. You can withdraw it by closing your account.
      </p>
    </section>

    <section class="legal-section">
      <h2>7. We don't sell your data</h2>
      <p>
        We do not "sell" or "share" personal information as those terms
        are defined under the CCPA / CPRA. We do not target ads, build
        profiles for ad networks, or use the data for any purpose other
        than the ones described above.
      </p>
    </section>

    <section class="legal-section">
      <h2>8. Children</h2>
      <p>
        Code Time is not directed at children. You may use the Service
        only if you are at least 13 years old, or 16 if your country
        applies that as the digital-consent age under the GDPR. If you
        think a child has provided us with personal information, email us
        and we will delete it.
      </p>
    </section>

    <section class="legal-section">
      <h2>9. Contact and operator</h2>
      <p>
        Code Time is operated as an independent personal project by an
        individual sole proprietor based in <strong>Tokyo, Japan</strong>.
        For any privacy question, request, or complaint:
      </p>
      <ul>
        <li>Email: <a href="mailto:support@codetime.dev">support@codetime.dev</a></li>
        <li>
          Operator: an individual sole proprietor in Tokyo, Japan
          (full legal name and registered contact address are provided
          on lawful request to satisfy statutory disclosure obligations
          under Japan's APPI, the GDPR, or equivalent regimes — email
          the address above).
        </li>
      </ul>
      <p class="legal-tbd-note">
        We may update this policy as the Service evolves. Material changes
        will be flagged on the site; the "Last updated" date at the top
        always reflects the current version.
      </p>
    </section>

    <footer class="legal-foot">
      <NuxtLink :to="`/${locale || 'en'}/terms`" class="legal-foot-link">
        Terms of Service
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
.legal-section a {
  color: var(--ct-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
}
.legal-section a:hover {
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
.legal-section em {
  color: var(--ct-fg);
  font-style: italic;
}

.legal-tbd-note {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--ct-border);
  font-size: 12.5px;
  color: var(--ct-fg-subtle);
  font-style: italic;
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
