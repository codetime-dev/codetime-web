// Fine-grained privacy model — the single source of truth for "what may be
// shown publicly". Every public surface (profile page, leaderboard, widgets)
// reads down from here; embedder query params and plan gating can only
// narrow within this ceiling, never widen it.
//
// Storage (see migration 0004): `users.leaderboard_listed` is a real column
// (the only setting filtered across MANY users); everything below lives in
// the `users.privacy` JSONB blob, read per-user alongside the row.

export type Facet = 'public' | 'private'

export type UserPrivacy = {
  v: 1
  // Surface master switches. When off, every facet under them is forced
  // private regardless of its own value (see the can*() helpers).
  profilePublic: boolean
  widgetsEnabled: boolean
  identity: {
    email: Facet
    github: Facet
  }
  // "Right now" — the live status widget.
  status: {
    coding: Facet // the baseline: coding-now indicator, today minutes, last seen
    project: Facet
    language: Facet
    editor: Facet
  }
  // Historical aggregates — profile page + history widgets.
  history: {
    totalTime: Facet
    languages: Facet
    projects: Facet
    calendar: Facet
  }
}

// Privacy-first defaults for brand-new signups (privacy = NULL). Badges work
// out of the box (widgetsEnabled) but the sensitive specifics — project
// name, email, github, project list — start private. Existing users are NOT
// subject to this; migration 0004 grandfathers them to their prior
// public-everything visibility.
export const NEW_USER_PRIVACY: UserPrivacy = {
  v: 1,
  profilePublic: true,
  widgetsEnabled: true,
  identity: { email: 'private', github: 'private' },
  status: { coding: 'public', project: 'private', language: 'public', editor: 'public' },
  history: { totalTime: 'public', languages: 'public', projects: 'private', calendar: 'public' },
}

function asFacet(v: unknown, fallback: Facet): Facet {
  return v === 'public' || v === 'private' ? v : fallback
}

function asBool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback
}

// Normalise whatever is in the JSONB column into a complete, valid
// UserPrivacy. null/partial/legacy shapes fall back key-by-key to the
// privacy-first default, so a newly-added facet defaults to its safe value
// even for users whose stored blob predates it.
export function resolveUserPrivacy(raw: unknown): UserPrivacy {
  const d = NEW_USER_PRIVACY
  if (!raw || typeof raw !== 'object') {
    return structuredClone(d)
  }
  const p = raw as Record<string, any>
  const identity = (p.identity ?? {}) as Record<string, unknown>
  const status = (p.status ?? {}) as Record<string, unknown>
  const history = (p.history ?? {}) as Record<string, unknown>
  return {
    v: 1,
    profilePublic: asBool(p.profilePublic, d.profilePublic),
    widgetsEnabled: asBool(p.widgetsEnabled, d.widgetsEnabled),
    identity: {
      email: asFacet(identity.email, d.identity.email),
      github: asFacet(identity.github, d.identity.github),
    },
    status: {
      coding: asFacet(status.coding, d.status.coding),
      project: asFacet(status.project, d.status.project),
      language: asFacet(status.language, d.status.language),
      editor: asFacet(status.editor, d.status.editor),
    },
    history: {
      totalTime: asFacet(history.totalTime, d.history.totalTime),
      languages: asFacet(history.languages, d.history.languages),
      projects: asFacet(history.projects, d.history.projects),
      calendar: asFacet(history.calendar, d.history.calendar),
    },
  }
}

// ---- Surface-aware ceiling helpers -----------------------------------------
// A facet is publicly visible only when both its own switch is 'public' AND
// the master switch for its surface is on. These encode the "lock" semantics:
// turning a master off collapses all its children to private.

export function isLiveStatusEnabled(p: UserPrivacy): boolean {
  return p.widgetsEnabled && p.status.coding === 'public'
}

export function canShowStatusField(p: UserPrivacy, field: 'project' | 'language' | 'editor'): boolean {
  return isLiveStatusEnabled(p) && p.status[field] === 'public'
}

export function canShowHistory(p: UserPrivacy, field: keyof UserPrivacy['history']): boolean {
  return p.widgetsEnabled && p.history[field] === 'public'
}

export function canShowProfileIdentity(p: UserPrivacy, field: keyof UserPrivacy['identity']): boolean {
  return p.profilePublic && p.identity[field] === 'public'
}

// Gate a shared public DATA endpoint that feeds BOTH the profile page and a
// widget (e.g. coding-history backs both the profile heatmap and the
// calendar/trend SVGs). `dataPublic` says the data category itself is public
// (a history facet, or leaderboardListed for ranks). The surface master
// applied depends on the caller: widget SVGs pass `?widget=1` and are gated
// by widgetsEnabled; the profile page / direct access is gated by
// profilePublic. One endpoint, two surfaces, two independent masters.
export function canExposePublicData(p: UserPrivacy, dataPublic: boolean, widgetCaller: boolean): boolean {
  if (!dataPublic) {
    return false
  }
  return widgetCaller ? p.widgetsEnabled : p.profilePublic
}

// True when a request originated from a widget SVG (which appends ?widget=1).
export function isWidgetCaller(v: unknown): boolean {
  return v === '1' || v === 'true' || v === true
}

// ---- Update path ------------------------------------------------------------
// Deep-merge a (possibly partial) patch onto the current privacy, then
// re-validate. Powers both the settings page (sends the full object) and the
// fast-follow in-context consent (sends e.g. { status: { project: 'public' } }).
export function mergePrivacy(current: UserPrivacy, patch: unknown): UserPrivacy {
  if (!patch || typeof patch !== 'object') {
    return current
  }
  const p = patch as Record<string, any>
  return resolveUserPrivacy({
    ...current,
    ...p,
    identity: { ...current.identity, ...p.identity },
    status: { ...current.status, ...p.status },
    history: { ...current.history, ...p.history },
  })
}
