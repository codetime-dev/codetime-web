<script setup lang="ts">
const t = useI18N()
</script>

<template>
  <h1 class="landing-title font-mono">
    <span class="title-mark">
      <span class="title-code font-mono">CODE</span>
      <span class="title-time font-mono">TIME</span>
    </span>
    <span class="title-tagline font-mono">
      {{ t.landing.description }}
    </span>
  </h1>
</template>

<style scoped>
.landing-title {
  font-family: var(--ct-font-mono);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 0.95;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4em;
  text-transform: none;
  margin: 0;
}
.title-mark {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.22em;
  align-items: baseline;
  justify-content: center;
  font-size: clamp(3.5rem, 14vw, 8.5rem);
  text-transform: uppercase;
  line-height: 0.95;
}
.title-tagline {
  font-family: var(--ct-font-mono);
  font-size: clamp(0.9rem, 1.6vw, 1.05rem);
  font-weight: 500;
  letter-spacing: 0;
  line-height: 1.4;
  color: var(--ct-fg-muted);
  text-transform: none;
  max-width: 38rem;
  padding: 0 16px;
}
.title-code {
  background: linear-gradient(
    180deg,
    var(--ct-primary) 0%,
    color-mix(in srgb, var(--ct-primary) 70%, transparent) 100%
  );
  -webkit-background-clip: text;
          background-clip: text;
  color: transparent;
}
/* Light scheme: fade-to-transparent collapses against the soft-gray bg.
   Use a darker→primary in-hue ramp so the type stays grounded. */
html[data-scheme="light"] .title-code {
  background: linear-gradient(
    180deg,
    var(--ct-brand-700) 0%,
    var(--ct-brand-500) 100%
  );
  -webkit-background-clip: text;
          background-clip: text;
}
.title-time {
  color: var(--ct-fg);
}
</style>
