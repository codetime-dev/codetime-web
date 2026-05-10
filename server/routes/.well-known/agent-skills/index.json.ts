// Agent Skills index — v0.2.0 (https://agentskills.io/discovery)
import { defineEventHandler, setHeader } from 'h3'
import { sha256, SKILL_MD } from '../../../utils/skill'

const INDEX = {
  $schema: 'https://agentskills.io/schemas/index/v0.2.0.json',
  version: '0.2.0',
  publisher: {
    name: 'Code Time',
    url: 'https://codetime.dev',
  },
  skills: [
    {
      type: 'skill-md',
      name: 'codetime',
      description: 'Query a developer\'s coding-time analytics from Code Time.',
      version: '1.0.0',
      url: 'https://codetime.dev/.well-known/agent-skills/codetime/SKILL.md',
      digest: sha256(SKILL_MD),
    },
  ],
}

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return INDEX
})
