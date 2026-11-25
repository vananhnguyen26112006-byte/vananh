// GET /api/health — 앱이 AI 메뉴를 보여줄지 판단 (서버에 키·초대 코드가 설정돼 있을 때만 ai: true)
import { aiConfigured, dailyLimit, sendJson } from './_lib/guard.js'

export default function handler(req, res) {
  sendJson(res, 200, { ok: true, ai: aiConfigured(), dailyLimit: dailyLimit() })
}
