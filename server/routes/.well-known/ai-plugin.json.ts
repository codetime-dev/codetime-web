// OpenAI plugin manifest (legacy ChatGPT plugin format, still consumed
// by GPT Store discovery and various agent platforms).
import { defineEventHandler, setHeader } from 'h3'

const MANIFEST = {
  schema_version: 'v1',
  name_for_human: 'Code Time',
  name_for_model: 'codetime',
  description_for_human: 'Track and analyse your coding time across editors.',
  description_for_model:
    'Plugin for querying a developer\'s coding-time analytics from Code Time. '
    + 'Use it to answer questions like "how long did I code last week", '
    + '"what languages have I been writing in", or to fetch per-workspace '
    + 'aggregates. Authenticate with the user\'s bearer token.',
  auth: {
    type: 'oauth',
    client_url: 'https://codetime.dev/en/user/profile',
    scope: 'codetime:read',
    authorization_url: 'https://github.com/login/oauth/authorize',
    authorization_content_type: 'application/json',
    verification_tokens: {},
  },
  api: {
    type: 'openapi',
    url: 'https://codetime.dev/openapi.json',
  },
  logo_url: 'https://codetime.dev/icon.png',
  contact_email: 'support@codetime.dev',
  legal_info_url: 'https://codetime.dev/en/privacy',
}

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return MANIFEST
})
