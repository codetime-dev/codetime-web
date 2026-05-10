import { defineEventHandler, setHeader } from 'h3'
import { INDEX_MD } from '../utils/index-md'

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=600')
  return INDEX_MD
})
