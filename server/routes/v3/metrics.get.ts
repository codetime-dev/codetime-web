import { defineEventHandler, setHeader } from 'h3'
import { metrics } from '../../utils/metrics'

// Prometheus scrape endpoint. Mirrors the path codetime-server-v3
// exposed via its Litestar Prometheus plugin
// (controllers/prometheus_config.py::CodeTimePrometheusController.path =
// "/v3/metrics"). Prometheus now scrapes this Nuxt endpoint for Node-side
// metrics — request counters fed by middleware/metrics.ts plus process
// gauges from utils/metrics.ts.
//
// Output is text/plain; version=0.0.4 per the Prometheus exposition
// format. Authentication is deliberately absent: the metrics endpoint
// is expected to live behind a network ACL or scrape-only firewall
// rule, same as the Python service's /v3/metrics.

defineRouteMeta({
  openAPI: {
    tags: ['metrics'],
    summary: 'Prometheus scrape endpoint',
    responses: {
      200: {
        description: 'Prometheus text exposition format',
        content: { 'text/plain': { schema: { type: 'string' } } },
      },
    },
  },
})

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  return metrics.registry.expose()
})
