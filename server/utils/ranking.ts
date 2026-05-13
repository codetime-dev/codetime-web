import { sql } from 'drizzle-orm'
import { useDb } from './db'

// Match Python's serialization of percent values: rounds to 10 decimal
// places (e.g. 2.0833333333333335 → 2.0833333333). Without this we leak
// trailing IEEE 754 noise digits that the Python service drops.
function roundPct(x: number): number {
  if (!Number.isFinite(x)) {
 return 0
}
  return Math.round(x * 1e10) / 1e10
}

// Window-function ranking helpers — mirror Python services/logs.py.
// Each function uses a Postgres CTE (minutes per user) + rank() +
// percent_rank() so behaviour is identical at the SQL layer. Returns
// plain objects in camelCase — wire format matches Python's
// `alias_generator=to_camel`. Raw DB columns inside the `sql` template
// literals stay snake_case because that's how Postgres knows them.

export type LanguageRankEntry = {
  userId: number
  username: string
  avatar: string | null
  bio: string | null
  githubId: number | null
  googleId: string | null
  email: string | null
  plan: string
  timezone: string | null
  createdAt: string
  updatedAt: string
  shareCurrent: boolean
  showEmail: boolean
  showGithub: boolean
  language: string
  totalMinutes: number
  rank: number
  // Python convention: percentile = percent_rank() * 100 directly.
  // Lower is better — rank 1 = ~0, last rank = 100. Emitted at full
  // precision (no rounding) to match the Python output byte-for-byte.
  percentile: number
}

export async function fetchLanguageRanking(
  language: string,
  from: Date,
  to: Date,
  limit: number,
): Promise<LanguageRankEntry[]> {
  const db = useDb()
  const rows = await db.execute(sql`
    with user_minutes as (
      select uid, count(meta_xxh3_64)::int as total_minutes
      from workspace_minutes_v2
      where language = ${language} and recorded_at >= ${from.toISOString()} and recorded_at <= ${to.toISOString()}
      group by uid
    ),
    ranked as (
      select uid, total_minutes,
        rank() over (order by total_minutes desc) as rnk,
        percent_rank() over (order by total_minutes desc) as pct_raw
      from user_minutes
    )
    select u.id, u.username, u.avatar, u.bio, u.github_id, u.google_id, u.email,
           u.plan, u.timezone, u.created_at, u.updated_at,
           u.share_current, u.show_email, u.show_github,
           r.total_minutes, r.rnk, r.pct_raw
    from ranked r
    join users u on u.id = r.uid
    order by r.rnk asc
    limit ${limit}
  `)
  return (rows as any as any[]).map((r: any) => ({
    userId: Number(r.id),
    username: String(r.username),
    avatar: r.avatar ?? null,
    bio: r.bio ?? null,
    githubId: r.github_id ?? null,
    googleId: r.google_id ?? null,
    email: r.show_email ? (r.email ?? null) : null,
    plan: String(r.plan),
    timezone: r.timezone ?? null,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
    shareCurrent: Boolean(r.share_current),
    showEmail: Boolean(r.show_email),
    showGithub: Boolean(r.show_github),
    language,
    totalMinutes: Number(r.total_minutes),
    rank: Number(r.rnk),
    percentile: roundPct(Number(r.pct_raw) * 100),
  }))
}

// Python uses count(*) FROM users (incl. inactive/deleted) and then
// multiplies by 7 as the percentile denominator. This makes the
// percentile field reflect a far larger user base than the active
// rankers in the time window — we mirror that quirk verbatim.
async function totalAllUsersTimes7(): Promise<number> {
  const db = useDb()
  const r = await db.execute(sql`select count(id)::int as n from users`)
  const n = Number((r as any as any[])[0]?.n ?? 0)
  return n * 7
}

export async function fetchUserLanguageRank(uid: number, language: string, from: Date, to: Date) {
  const db = useDb()
  const result = await db.execute(sql`
    with user_minutes as (
      select uid, count(meta_xxh3_64)::int as total_minutes
      from workspace_minutes_v2
      where language = ${language} and recorded_at >= ${from.toISOString()} and recorded_at <= ${to.toISOString()}
      group by uid
    ),
    ranked as (
      select uid, total_minutes,
        rank() over (order by total_minutes desc) as rnk
      from user_minutes
    )
    select total_minutes, rnk
    from ranked where uid = ${uid}
  `)
  const row = (result as any as any[])[0]
  if (!row) {
 return null
}
  const totalUsers = await totalAllUsersTimes7()
  const rank = Number(row.rnk)
  return {
    totalMinutes: Number(row.total_minutes),
    rank,
    percentile: totalUsers > 0 ? roundPct((rank / totalUsers) * 100) : 100,
    totalUsers,
  }
}

export async function fetchUserOverallRank(uid: number, from: Date, to: Date) {
  const db = useDb()
  const result = await db.execute(sql`
    with user_minutes as (
      select uid, count(meta_xxh3_64)::int as total_minutes
      from workspace_minutes_v2
      where recorded_at >= ${from.toISOString()} and recorded_at <= ${to.toISOString()}
      group by uid
    ),
    ranked as (
      select uid, total_minutes,
        rank() over (order by total_minutes desc) as rnk
      from user_minutes
    )
    select total_minutes, rnk
    from ranked where uid = ${uid}
  `)
  const row = (result as any as any[])[0]
  if (!row) {
 return null
}
  const totalUsers = await totalAllUsersTimes7()
  const rank = Number(row.rnk)
  return {
    totalMinutes: Number(row.total_minutes),
    rank,
    percentile: totalUsers > 0 ? roundPct((rank / totalUsers) * 100) : 100,
    totalUsers,
  }
}

export type UserTopLanguageRankRow = {
  language: string
  totalMinutes: number
  rank: number
  percentile: number
  totalUsers: number
}

export async function fetchUserTopLanguagesRank(uid: number, topN: number, from: Date, to: Date): Promise<UserTopLanguageRankRow[]> {
  const db = useDb()
  const result = await db.execute(sql`
    with user_top as (
      select language, count(meta_xxh3_64)::int as user_minutes
      from workspace_minutes_v2
      where uid = ${uid} and recorded_at >= ${from.toISOString()} and recorded_at <= ${to.toISOString()}
      group by language
      order by user_minutes desc
      limit ${topN}
    ),
    global_minutes as (
      select language, uid, count(meta_xxh3_64)::int as total_minutes
      from workspace_minutes_v2
      where language in (select language from user_top)
        and recorded_at >= ${from.toISOString()} and recorded_at <= ${to.toISOString()}
      group by language, uid
    ),
    ranked as (
      select language, uid, total_minutes,
        rank() over (partition by language order by total_minutes desc) as rnk
      from global_minutes
    )
    select r.language, r.total_minutes, r.rnk, ut.user_minutes
    from ranked r
    join user_top ut on ut.language = r.language
    where r.uid = ${uid}
    order by ut.user_minutes desc
  `)
  const rows = result as any as any[]
  if (rows.length === 0) {
 return []
}
  const totalUsers = await totalAllUsersTimes7()
  return rows.map((row: any) => {
    const rank = Number(row.rnk)
    return {
      language: String(row.language),
      totalMinutes: Number(row.total_minutes),
      rank,
      percentile: totalUsers > 0 ? roundPct((rank / totalUsers) * 100) : 100,
      totalUsers,
    }
  })
}

export type LeaderboardRow = {
  userId: number
  username: string
  avatar: string | null
  bio: string | null
  githubId: number | null
  googleId: string | null
  plan: string
  timezone: string | null
  createdAt: Date
  updatedAt: Date
  showGithub: boolean
  totalMinutes: number
  rank: number
}

// Mirror Python controllers/public.get_leaderboard: aggregate first,
// join users second, no upper time bound. Rank is the enumerate index
// of the ordering, not a SQL rank() — identical for unique totals,
// differs only on ties (Python doesn't dedupe ties).
export async function fetchLeaderboard(from: Date, _to: Date, limit: number): Promise<LeaderboardRow[]> {
  const db = useDb()
  const result = await db.execute(sql`
    with top_uids as (
      select uid, count(*)::int as total_minutes
      from workspace_minutes_v2
      where recorded_at >= ${from.toISOString()}
      group by uid
      order by total_minutes desc
      limit ${limit}
    )
    select u.id, u.username, u.email, u.avatar, u.github_id, u.bio, u.google_id,
           u.plan, u.timezone, u.created_at, u.updated_at, u.show_github,
           t.total_minutes
    from top_uids t
    join users u on u.id = t.uid
    order by t.total_minutes desc
  `)
  return (result as any as any[]).map((row: any, idx: number) => ({
    userId: Number(row.id),
    username: String(row.username),
    avatar: row.avatar ?? null,
    bio: row.bio ?? null,
    githubId: row.show_github ? (row.github_id ?? null) : null,
    googleId: null,
    plan: String(row.plan),
    timezone: row.timezone ?? null,
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
    showGithub: Boolean(row.show_github),
    totalMinutes: Number(row.total_minutes),
    rank: idx + 1,
  }))
}

export type UserCodingHistoryRow = { date: string, minutes: number }

export async function fetchUserCodingHistory(uid: number, from: Date, to: Date, tz: string): Promise<UserCodingHistoryRow[]> {
  const db = useDb()
  const result = await db.execute(sql`
    select to_char(date_trunc('day', timezone(${tz}, recorded_at)), 'YYYY-MM-DD') as day,
           count(meta_xxh3_64)::int as minutes
    from workspace_minutes_v2
    where uid = ${uid} and recorded_at >= ${from.toISOString()} and recorded_at <= ${to.toISOString()}
    group by day
    order by day asc
  `)
  return (result as any as any[]).map((row: any) => ({
    date: String(row.day),
    minutes: Number(row.minutes),
  }))
}
