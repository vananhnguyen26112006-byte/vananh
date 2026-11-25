// POST /api/verify { inviteCode } — AI 모드를 켤 때 초대 코드 확인 (틀린 시도는 IP당 하루 10회까지)
import { aiConfigured, clientIp, inviteOk, readJson, sendJson, takeQuota } from './_lib/guard.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method' })
  if (!aiConfigured()) return sendJson(res, 503, { error: 'not_configured' })

  let body
  try {
    body = await readJson(req)
  } catch {
    return sendJson(res, 400, { error: 'bad_json' })
  }

  if (inviteOk(body.inviteCode)) return sendJson(res, 200, { ok: true })
  if (!takeQuota('verify-fail', clientIp(req), 10)) return sendJson(res, 429, { error: 'limit' })
  return sendJson(res, 403, { error: 'invite' })
}
