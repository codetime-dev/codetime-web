// PM2 zero-downtime ready signal.
//
// PM2 cluster mode + `wait_ready: true` only routes traffic to a freshly
// spawned worker after it sends `process.send('ready')`. Nitro's
// node-server entry calls `server.listen()` synchronously after running
// plugins but never fires an in-app hook on listen, so we probe the
// loopback socket ourselves and only signal once the TCP port is
// actually accepting connections. That guarantees the old worker keeps
// serving until the new one is genuinely warm — which is the whole
// point of `pm2 reload`.
//
// Outside a PM2-managed parent (dev, ad-hoc node, tests) `process.send`
// is undefined; we no-op so this plugin stays harmless in every env.

import { Socket } from 'node:net'
import process from 'node:process'

const PORT = Number(process.env.NITRO_PORT || process.env.PORT || 3000)
const HOST = process.env.NITRO_HOST || process.env.HOST || '127.0.0.1'

function probeOnce(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new Socket()
    let settled = false
    const finish = (ok: boolean) => {
      if (settled) {
        return
      }
      settled = true
      socket.destroy()
      resolve(ok)
    }
    socket.setTimeout(500)
    socket.once('connect', () => finish(true))
    socket.once('error', () => finish(false))
    socket.once('timeout', () => finish(false))
    // Probe the loopback address even when the server binds to 0.0.0.0
    // so we don't accidentally race a non-loopback NIC's binding.
    socket.connect(PORT, HOST === '0.0.0.0' ? '127.0.0.1' : HOST)
  })
}

export default defineNitroPlugin(() => {
  // Not under PM2 (or not forked with IPC). Nothing to signal.
  if (typeof process.send !== 'function') {
    return
  }
  let sent = false
  const start = Date.now()
  // Cap the probe loop at 30s — past that something is genuinely broken
  // and PM2's `listen_timeout` will tear us down anyway.
  const DEADLINE_MS = 30_000
  const tick = async () => {
    if (sent) {
      return
    }
    if (await probeOnce()) {
      sent = true
      try {
        process.send?.('ready')
      }
      catch {
        // PM2 detached or IPC channel closed — give up silently.
      }
      return
    }
    if (Date.now() - start > DEADLINE_MS) {
      return
    }
    setTimeout(tick, 100)
  }
  // Defer to the next tick so `server.listen()` (called synchronously
  // after plugins finish) gets a chance to start before our first probe.
  setImmediate(tick)
})
