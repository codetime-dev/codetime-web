// Custom robots.txt with AI-crawler tier differentiation, Content Signals,
// and a schemamap directive for NLWeb Schema Feeds discovery.
import { defineEventHandler, setHeader } from 'h3'

const SITE = 'https://codetime.dev'

const BODY = `# Code Time — robots.txt
# Site: ${SITE}
# Updated: 2026-05-10

# ---------------------------------------------------------------
# Default policy — search indexing allowed, AI training disallowed.
# Cloudflare Content Signals (https://contentsignals.org)
# ---------------------------------------------------------------
User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no
Allow: /
Disallow: /api/
Disallow: /v3/

# ---------------------------------------------------------------
# Tier 1 — search-style AI assistants (allowed: surface answers in real-time)
# ---------------------------------------------------------------
User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GoogleOther
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: DuckAssistBot
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: ora-agent
Allow: /

User-agent: DeepSeekBot
Allow: /

# ---------------------------------------------------------------
# Tier 2 — bulk training crawlers
# Allowed: GPTBot, CCBot, anthropic-ai, Google-Extended (already above).
# Blocking these drops codetime.dev out of training corpora and out of
# AI-search citation graphs; the public landing copy is marketing, not
# proprietary data, so the upside of presence beats the downside of
# inclusion in training sets.
# ---------------------------------------------------------------
User-agent: GPTBot
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

# Still blocked — undisclosed crawl behaviour, scraper-grade UAs.
User-agent: ByteSpider
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Amazonbot
Disallow: /

User-agent: FacebookBot
Disallow: /

User-agent: Meta-ExternalAgent
Disallow: /

User-agent: omgili
Disallow: /

User-agent: TimpiBot
Disallow: /

# ---------------------------------------------------------------
# Discovery resources
# ---------------------------------------------------------------
Sitemap: ${SITE}/sitemap.xml
# NLWeb Schema Feeds (non-standard, ignored by search engines)
# schemamap: ${SITE}/schema-map.xml
`

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return BODY
})
