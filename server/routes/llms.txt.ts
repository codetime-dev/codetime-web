import { defineEventHandler, setHeader } from 'h3'
import { LLMS_TXT } from '../utils/llms'

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return LLMS_TXT
})
