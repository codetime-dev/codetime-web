import { randomBytes } from 'node:crypto'

// UUIDv7 generator — time-ordered ID matching the format the Python
// service emits via `uuid_utils.compat.uuid7`. We mint IDs in the
// application layer because the shared Postgres column has no default
// (Alembic, not Drizzle, owns DDL — see server/CLAUDE.md "Schema parity"
// note) and drizzle's `defaultRandom()` falls through to `DEFAULT`,
// which Postgres rejects on a column with no default.
//
// Layout (RFC 9562 §5.7):
//   48 bits — Unix epoch milliseconds (big-endian)
//    4 bits — version (= 0b0111)
//   12 bits — random (rand_a)
//    2 bits — variant (= 0b10)
//   62 bits — random (rand_b)
export function uuid7(now: number = Date.now()): string {
  const buf = Buffer.alloc(16)
  // 48-bit timestamp
  const ms = BigInt(now)
  buf[0] = Number((ms >> 40n) & 0xFFn)
  buf[1] = Number((ms >> 32n) & 0xFFn)
  buf[2] = Number((ms >> 24n) & 0xFFn)
  buf[3] = Number((ms >> 16n) & 0xFFn)
  buf[4] = Number((ms >> 8n) & 0xFFn)
  buf[5] = Number(ms & 0xFFn)
  // 10 random bytes for the remaining bits
  randomBytes(10).copy(buf, 6)
  // Set version (7) in the high nibble of byte 6
  buf[6] = (buf[6] & 0x0F) | 0x70
  // Set variant (10xx) in the high bits of byte 8
  buf[8] = (buf[8] & 0x3F) | 0x80
  const hex = buf.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
