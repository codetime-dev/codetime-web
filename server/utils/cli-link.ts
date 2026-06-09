import { randomBytes, randomInt } from 'node:crypto'

// Shared constants + helpers for the device-code `codetime login` flow.
// Routes live under server/routes/v3/agent/cli/link/. The CLI mirror is
// codetime-cli/packages/cli/src/lib/login.ts.

// How long a started link code stays valid before the CLI must restart.
export const CLI_LINK_TTL_SECONDS = 10 * 60
// Suggested seconds between CLI polls. Returned to the CLI by /start.
export const CLI_LINK_POLL_INTERVAL_SECONDS = 4

// Crockford-ish base32 minus easily-confused glyphs (I, L, O, U, 0, 1).
// The user code can end up read off a screen / typed on another device,
// so legibility matters more than density.
const USER_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ'
const USER_CODE_LENGTH = 8

// Secret the CLI holds and polls with — never shown in a URL or page.
export function generateDeviceCode(): string {
  return randomBytes(32).toString('hex')
}

// Public code embedded in /cli/auth?code=… and matched by the approve
// route. Random per-character draw from the unambiguous alphabet.
export function generateUserCode(): string {
  let out = ''
  for (let i = 0; i < USER_CODE_LENGTH; i++) {
    out += USER_CODE_ALPHABET[randomInt(USER_CODE_ALPHABET.length)]
  }
  return out
}

// Normalise a user code from a URL / form: uppercase and drop anything
// outside the alphabet (so "wxyz-2345" and "WXYZ2345" match the same
// row). Returns null when nothing valid remains.
export function normalizeUserCode(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null
  }
  const cleaned = raw.toUpperCase().replaceAll(/[^0-9A-Z]/g, '')
  return cleaned.length === USER_CODE_LENGTH ? cleaned : null
}
