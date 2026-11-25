// AI 모드 안전장치 (PRD 11장): 초대 코드 + IP 기준 하루 요청 한도
// API 키·초대 코드는 Vercel 환경변수에만 둔다. 앱 코드에는 절대 넣지 않는다.
import { timingSafeEqual } from 'node:crypto'

// IP당 하루 생성 요청 수 (환경변수 AI_DAILY_LIMIT로 바꿀 수 있음, 기본 20)
export function dailyLimit() {
  const n = Number(process.env.AI_DAILY_LIMIT)
  return Number.isFinite(n) && process.env.AI_DAILY_LIMIT !== '' && process.env.AI_DAILY_LIMIT !== undefined ? n : 20
}

export function aiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY && process.env.INVITE_CODE)
}

export function inviteOk(code) {
  const expected = process.env.INVITE_CODE || ''
  const given = String(code ?? '').trim()
  if (!expected || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '')
  return fwd.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown'
}

// 간단한 메모리 카운터. 서버 인스턴스가 새로 뜨면 초기화되므로 "대략적인" 제한이다.
// (확실한 지출 상한은 Anthropic 콘솔의 월 지출 한도로 건다)
const buckets = new Map()

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function takeQuota(kind, ip, limit) {
  const key = `${kind}:${ip}`
  const d = today()
  const cur = buckets.get(key)
  const count = cur && cur.date === d ? cur.count : 0
  if (count >= limit) return false
  buckets.set(key, { date: d, count: count + 1 })
  if (buckets.size > 5000) buckets.clear() // 메모리 보호
  return true
}

export function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}')
  const chunks = []
  for await (const c of req) chunks.push(c)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}
