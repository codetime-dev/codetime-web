<template>
  <h1 class="landing-title font-mono">
    <span class="title-code font-mono">CODE</span>
    <span class="title-time font-mono">TIME</span>
  </h1>
</template>

<style scoped>
.landing-title {
  font-family: var(--ct-font-mono);
  font-size: clamp(3.5rem, 14vw, 8.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 0.95;
  text-align: center;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.22em;
  align-items: baseline;
  justify-content: center;
  text-transform: uppercase;
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
