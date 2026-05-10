import { defineEventHandler, setHeader } from 'h3'

const BODY = `# Code Time — Onboarding context

> Scoped llms.txt for editor plugin install / quickstart flows.

## Install the editor plugin
- VS Code: search "Code Time" in the marketplace or run
  \`code --install-extension jannchie.codetime\`
- JetBrains: install "Code Time" from the JetBrains plugin marketplace

## Sign in
1. Visit https://codetime.dev/
2. Click "Sign in with GitHub" or "Sign in with Google"
3. Open https://codetime.dev/en/user/profile and copy your upload token
4. Paste the token into the editor plugin settings

## First dashboard
After ~1 minute of editor activity, your dashboard at
https://codetime.dev/en/dashboard will populate with:
- Daily distribution
- Per-language breakdown
- Per-workspace aggregates
- Calendar heatmap

## Privacy
- Only file paths, language, and timestamps are uploaded
- Source code contents are never sent
- Data is yours to export at any time via the API

## Pricing
Free tier supports unlimited personal use. See https://codetime.dev/#pricing.
`

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return BODY
})
