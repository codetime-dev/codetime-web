import { sql } from 'drizzle-orm'
import { useDb } from './db'

// Window-function ranking helpers — mirror Python services/logs.py.
// Each function uses a Postgres CTE (minutes per user) + rank() +
// percent_rank() so behaviour is identical at the SQL layer. Returns
// plain objects ready to map to DTO shape.

export type LanguageRankEntry = {
  user_id: number
  username: string
  avatar: string | null
  bio: string | null
  github_id: number | null
  google_id: string | null
  email: string | null
  plan: string
  timezone: string | null
  created_at: string
  updated_at: string
  share_current: boolean
  show_email: boolean
  show_github: boolean
  language: string
  total_minutes: number
  rank: number
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
    user_id: Number(r.id),
    username: String(r.username),
    avatar: r.avatar ?? null,
    bio: r.bio ?? null,
    github_id: r.github_id ?? null,
    google_id: r.google_id ?? null,
    email: r.show_email ? (r.email ?? null) : null,
    plan: String(r.plan),
    timezone: r.timezone ?? null,
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
    share_current: Boolean(r.share_current),
    show_email: Boolean(r.show_email),
    show_github: Boolean(r.show_github),
    language,
    total_minutes: Number(r.total_minutes),
    rank: Number(r.rnk),
    percentile: Math.round((1 - Number(r.pct_raw)) * 1000) / 10,
  }))
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
        rank() over (order by total_minutes desc) as rnk,
        percent_rank() over (order by total_minutes desc) as pct_raw,
        count(*) over () as total_users
      from user_minutes
    )
    select total_minutes, rnk, pct_raw, total_users
    from ranked where uid = ${uid}
  `)
  const row = (result as any as any[])[0]
  if (!row) {
 return null
}
  return {
    total_minutes: Number(row.total_minutes),
    rank: Number(row.rnk),
    percentile: Math.round((1 - Number(row.pct_raw)) * 1000) / 10,
    total_users: Number(row.total_users),
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
        rank() over (order by total_minutes desc) as rnk,
        percent_rank() over (order by total_minutes desc) as pct_raw,
        count(*) over () as total_users
      from user_minutes
    )
    select total_minutes, rnk, pct_raw, total_users
    from ranked where uid = ${uid}
  `)
  const row = (result as any as any[])[0]
  if (!row) {
 return null
}
  return {
    total_minutes: Number(row.total_minutes),
    rank: Number(row.rnk),
    percentile: Math.round((1 - Number(row.pct_raw)) * 1000) / 10,
    total_users: Number(row.total_users),
  }
}

export type UserTopLanguageRankRow = {
  language: string
  total_minutes: number
  rank: number
  percentile: number
  total_users: number
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
        rank() over (partition by language order by total_minutes desc) as rnk,
        percent_rank() over (partition by language order by total_minutes desc) as pct_raw,
        count(*) over (partition by language) as total_users
      from global_minutes
    )
    select r.language, r.total_minutes, r.rnk, r.pct_raw, r.total_users
    from ranked r
    where r.uid = ${uid}
    order by r.total_minutes desc
  `)
  return (result as any as any[]).map((row: any) => ({
    language: String(row.language),
    total_minutes: Number(row.total_minutes),
    rank: Number(row.rnk),
    percentile: Math.round((1 - Number(row.pct_raw)) * 1000) / 10,
    total_users: Number(row.total_users),
  }))
}

export type LeaderboardRow = {
  user_id: number
  username: string
  avatar: string | null
  bio: string | null
  plan: string
  total_minutes: number
  rank: number
}

export async function fetchLeaderboard(from: Date, to: Date, limit: number): Promise<LeaderboardRow[]> {
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
    select u.id, u.username, u.avatar, u.bio, u.plan, u.share_current, u.show_email, u.show_github,
           r.total_minutes, r.rnk
    from ranked r
    join users u on u.id = r.uid
    order by r.rnk asc
    limit ${limit}
  `)
  return (result as any as any[]).map((row: any) => ({
    user_id: Number(row.id),
    username: String(row.username),
    avatar: row.avatar ?? null,
    bio: row.bio ?? null,
    plan: String(row.plan),
    total_minutes: Number(row.total_minutes),
    rank: Number(row.rnk),
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
