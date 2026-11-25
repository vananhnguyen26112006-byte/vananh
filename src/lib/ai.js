// AI 모드 (PRD 6.2 / 11장) — 앱 쪽 코드. API 키는 여기 없다: 서버(/api/*)만 Claude를 부른다.
import { load, save, todayKey } from './storage.js'

export const DEVICE_DAILY_LIMIT = 20

async function fetchJson(url, options = {}, timeoutMs = 8000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal, cache: 'no-store' })
    const body = await res.json().catch(() => ({}))
    return { status: res.status, body }
  } finally {
    clearTimeout(timer)
  }
}

// 서버가 설정돼 있으면 true. 오프라인·로컬 개발(서버 함수 없음)·미설정이면 false → AI 메뉴 숨김
export async function checkAiAvailable() {
  try {
    const { status, body } = await fetchJson('/api/health', {}, 4000)
    return status === 200 && body?.ai === true
  } catch {
    return false
  }
}

// 'ok' | 'wrong' | 'limit' | 'error'
export async function verifyInvite(inviteCode) {
  try {
    const { status } = await fetchJson('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode }),
    })
    if (status === 200) return 'ok'
    if (status === 403) return 'wrong'
    if (status === 429) return 'limit'
    return 'error'
  } catch {
    return 'error'
  }
}

// ---------- 기기당 하루 요청 수 (앱에서 계산) ----------
export function aiUsedToday() {
  const u = load('aiUsage', null)
  return u && u.date === todayKey() ? Number(u.count) || 0 : 0
}

function bumpUsage() {
  save('aiUsage', { date: todayKey(), count: aiUsedToday() + 1 })
}

// 성공하면 { questions }, 실패하면 { error: 'limit' | 'invite' | 'failed' }
export async function fetchAiQuestions({ category, level, lang, inviteCode, count = 10 }) {
  if (aiUsedToday() >= DEVICE_DAILY_LIMIT) return { error: 'limit' }
  bumpUsage()
  try {
    const { status, body } = await fetchJson(
      '/api/generate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, level, lang, count, inviteCode }),
      },
      45000,
    )
    if (status === 200 && Array.isArray(body?.questions) && body.questions.length) return { questions: body.questions }
    if (status === 429) return { error: 'limit' }
    if (status === 403) return { error: 'invite' }
    return { error: 'failed' }
  } catch {
    return { error: 'failed' }
  }
}
