import { defineEventHandler, setHeader } from 'h3'
import { SKILL_MD } from '../../../../utils/skill'

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return SKILL_MD
})
