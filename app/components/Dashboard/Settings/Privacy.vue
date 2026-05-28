<script setup lang="ts">
// Fine-grained privacy. One mental model across every switch: ON = others
// can see it. Master switches (profile / leaderboard / widgets) gate their
// facet children — a child greys out (locked) when its surface is off.
// Backed by usePrivacy() (shared state) so an in-context "make public" from
// the widget builder is reflected here too.
//
// NOTE: copy is inline English; move to i18n keys in a follow-up.

const { privacy, load, patch, saving } = usePrivacy()
await load()

const savedTick = autoResetRef(false, 1800)

// `surface` names the exact place(s) the toggle controls — surfaced in the
// UI as a small subtitle so users see "what flipping this hides" without
// reading the docs. Keep names short; "profile"/"widget"/"badge" map 1:1
// to user-visible pages.
type Item = { key: string, label: string, surface: string, locked?: () => boolean }
type Group = { label: string, hint?: () => string, items: Item[] }

const widgetsOff = () => !privacy.value?.widgetsEnabled
const codingOff = () => privacy.value?.status.coding === 'private'
const allSurfacesOff = () => !privacy.value?.widgetsEnabled && !privacy.value?.profilePublic

const groups: Group[] = [
  {
    label: 'Discovery',
    items: [
      { key: 'profilePublic', label: 'Public profile', surface: '/user/<id> page' },
      { key: 'leaderboardListed', label: 'Leaderboards', surface: 'rank · percentile' },
      { key: 'widgetsEnabled', label: 'Embeddable widgets', surface: 'every SVG widget' },
    ],
  },
  {
    label: 'Identity',
    items: [
      { key: 'identity.email', label: 'Email', surface: 'profile header' },
      { key: 'identity.github', label: 'GitHub', surface: 'profile header · github.com link' },
    ],
  },
  {
    label: 'Live status',
    hint: () => (widgetsOff() ? 'widgets off' : ''),
    items: [
      { key: 'status.coding', label: 'Currently coding', surface: 'status widget', locked: widgetsOff },
      { key: 'status.project', label: 'Project', surface: 'status widget', locked: () => widgetsOff() || codingOff() },
      { key: 'status.language', label: 'Language', surface: 'status widget', locked: () => widgetsOff() || codingOff() },
      { key: 'status.editor', label: 'Editor', surface: 'status widget', locked: () => widgetsOff() || codingOff() },
    ],
  },
  {
    label: 'History',
    hint: () => (allSurfacesOff() ? 'no surface' : ''),
    items: [
      { key: 'history.totalTime', label: 'Total time', surface: 'profile · shield badge · OG image', locked: allSurfacesOff },
      { key: 'history.languages', label: 'Languages', surface: 'profile · donut widget', locked: allSurfacesOff },
      { key: 'history.projects', label: 'Projects', surface: 'profile · donut widget', locked: allSurfacesOff },
      { key: 'history.calendar', label: 'Calendar', surface: 'profile · calendar/trend/usage widgets', locked: allSurfacesOff },
    ],
  },
]

// ON = visible. Masters are booleans; facets are 'public'/'private'.
function getOn(key: string): boolean {
  const p = privacy.value
  if (!p) {
    return false
  }
  if (key === 'profilePublic' || key === 'leaderboardListed' || key === 'widgetsEnabled') {
    return p[key]
  }
  const [grp, f] = key.split('.') as [keyof typeof p, string]
  return (p[grp] as Record<string, string>)[f] === 'public'
}

async function toggle(item: Item) {
  const p = privacy.value
  if (!p || item.locked?.()) {
    return
  }
  const on = !getOn(item.key)
  if (item.key === 'profilePublic' || item.key === 'leaderboardListed' || item.key === 'widgetsEnabled') {
    p[item.key] = on
  }
  else {
    const [grp, f] = item.key.split('.') as [keyof typeof p, string]
    ;(p[grp] as Record<string, string>)[f] = on ? 'public' : 'private'
  }
  const ok = await patch(p as unknown as Record<string, unknown>)
  if (ok) {
    savedTick.value = true
  }
}
</script>

<template>
  <PanelSection num="08" title="Privacy" meta="visibility · on = visible to others" flush>
    <template #icon>
      <i class="i-tabler-lock text-[15px] text-ct-fg-muted" />
    </template>

    <div v-if="privacy" class="pv">
      <p class="pv-note">
        Your settings are the ceiling — badges, leaderboard and your profile only show what's
        switched on here, whatever an embed asks for.
        <span v-if="saving" class="pv-save">saving…</span>
        <span v-else-if="savedTick" class="pv-save pv-save-ok">saved</span>
      </p>

      <div class="pv-groups">
        <section v-for="g in groups" :key="g.label" class="pv-group">
          <div class="pv-group-head">
            <span class="pv-group-label">{{ g.label }}</span>
            <span v-if="g.hint && g.hint()" class="pv-group-hint">{{ g.hint() }}</span>
          </div>
          <div class="pv-grid">
            <button
              v-for="it in g.items"
              :key="it.key"
              type="button"
              class="pv-item"
              :class="{ 'pv-item-locked': it.locked?.() }"
              :disabled="it.locked?.()"
              @click="toggle(it)"
            >
              <i v-if="it.locked?.()" class="i-tabler-lock pv-item-lock" />
              <span class="pv-item-text">
                <span class="pv-item-label">{{ it.label }}</span>
                <span class="pv-item-surface">{{ it.surface }}</span>
              </span>
              <span class="pv-sw" :class="{ 'pv-sw-on': getOn(it.key) }">
                <span class="pv-sw-knob" />
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  </PanelSection>
</template>

<style scoped>
.pv-note {
  padding: 12px 16px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ct-fg-subtle);
  border-bottom: 1px solid var(--ct-border-subtle);
}
.pv-save { margin-left: 4px; font-family: var(--ct-font-mono); color: var(--ct-fg-muted); }
.pv-save-ok { color: var(--r-color-secondary-1, #10b981); }

.pv-groups {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2px;
  padding: 10px 12px 14px;
}
@media (min-width: 720px) {
  .pv-groups { grid-template-columns: 1fr 1fr; gap: 10px 18px; }
}

.pv-group-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 8px 6px 4px;
}
.pv-group-label {
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg-subtle);
}
.pv-group-hint {
  font-size: 9.5px;
  letter-spacing: 0.04em;
  color: var(--ct-fg-subtle);
  opacity: 0.7;
}
.pv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }

.pv-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: transparent;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: background-color 140ms ease;
}
.pv-item:hover:not(:disabled) { background: var(--ct-surface-1); }
.pv-item-locked { cursor: not-allowed; opacity: 0.5; }
.pv-item-lock { font-size: 11px; color: var(--ct-fg-subtle); flex-shrink: 0; }
.pv-item-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.pv-item-label {
  font-size: 12.5px;
  color: var(--ct-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pv-item-surface {
  font-family: var(--ct-font-mono);
  font-size: 10px;
  color: var(--ct-fg-subtle);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.78;
}

/* compact switch — ON = visible */
.pv-sw {
  position: relative;
  flex-shrink: 0;
  width: 30px;
  height: 17px;
  border-radius: 999px;
  background: var(--ct-surface-3, var(--ct-border));
  transition: background-color 160ms ease;
}
.pv-sw-on { background: var(--ct-primary); }
.pv-sw-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 13px;
  height: 13px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
  transition: transform 160ms ease;
}
.pv-sw-on .pv-sw-knob { transform: translateX(13px); }
</style>
