// POST /api/generate { category, level, lang, count, inviteCode } → { questions: [...] }
// Claude Haiku로 새 문제를 만든다. 실패하면 1회 재시도, 그래도 실패하면 오류 → 앱은 기본 문제로 전환.
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { aiConfigured, clientIp, dailyLimit, inviteOk, readJson, sendJson, takeQuota } from './_lib/guard.js'
import { AiQuestionSet, buildPrompt, CATEGORIES, LANGS, LEVELS, toAppQuestions } from './_lib/questions.js'

const MODEL = 'claude-haiku-5-5' // PRD 10장: 빠르고 저렴한 Claude Haiku

async function generateOnce(client, params) {
  const { system, user } = buildPrompt(params)
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system,
    output_config: { effort: 'low', format: zodOutputFormat(AiQuestionSet) },
    messages: [{ role: 'user', content: user }],
  })
  if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens' || !response.parsed_output) return []
  return toAppQuestions(response.parsed_output.questions, params)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method' })
  if (!aiConfigured()) return sendJson(res, 503, { error: 'not_configured' })

  let body
  try {
    body = await readJson(req)
  } catch {
    return sendJson(res, 400, { error: 'bad_json' })
  }

  if (!inviteOk(body.inviteCode)) return sendJson(res, 403, { error: 'invite' })

  const params = {
    category: CATEGORIES.includes(body.category) ? body.category : null,
    level: LEVELS.includes(body.level) ? body.level : null,
    lang: LANGS.includes(body.lang) ? body.lang : null,
    count: Math.min(10, Math.max(1, Number(body.count) || 10)),
  }
  if (!params.category || !params.level || !params.lang) return sendJson(res, 400, { error: 'bad_params' })

  if (!takeQuota('generate', clientIp(req), dailyLimit())) return sendJson(res, 429, { error: 'limit' })

  const client = new Anthropic() // ANTHROPIC_API_KEY 환경변수에서 읽음
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const questions = await generateOnce(client, params)
      // 검수에서 너무 많이 빠지면 재시도
      if (questions.length >= Math.ceil(params.count * 0.7)) return sendJson(res, 200, { questions })
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) return sendJson(res, 502, { error: 'server_key' })
      if (error instanceof Anthropic.RateLimitError) return sendJson(res, 503, { error: 'busy' })
      if (error instanceof Anthropic.APIError) console.error('Claude API error', error.status, error.message)
      else console.error('generate failed', error?.message)
    }
  }
  return sendJson(res, 502, { error: 'generation_failed' })
}
