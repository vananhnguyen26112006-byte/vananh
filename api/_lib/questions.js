// AI 문제 생성: Claude가 만든 결과를 앱의 문제 형식(PRD 8장)으로 바꾸고 검사한다.
import { z } from 'zod'

export const LANGS = ['ko', 'en', 'ja', 'zh', 'es', 'vi']
export const LEVELS = ['L1', 'L2', 'L3', 'L4']
export const CATEGORIES = ['vocab', 'grammar', 'mixed']
const LANG_NAMES = { ko: 'Korean', en: 'English', ja: 'Japanese', zh: 'Simplified Chinese', es: 'Spanish', vi: 'Vietnamese' }

const LEVEL_SCOPE = {
  L1: 'CEFR A1: very basic everyday words (family, food, colors, home, school); grammar: be verb, present simple, a/an, plurals, pronouns, there is/are, can, in/on/at, present continuous.',
  L2: 'CEFR A2: everyday-life words (shopping, travel, weather, jobs, feelings); grammar: past simple, past continuous, will / going to, comparatives & superlatives, some/any, much/many, should/must/have to, adverbs.',
  L3: 'CEFR B1: intermediate words, collocations and phrasal verbs (work, study, technology, opinions); grammar: present perfect (+ since/for), passive, relative pronouns, first conditional, used to, gerund vs infinitive, too/enough.',
  L4: 'CEFR B2+: advanced words and strong collocations (formal/academic); grammar: second/third/mixed conditionals, wish, participle clauses, past perfect, future perfect, inversion, causative have, modal perfects.',
}

// 모델이 채우는 형식 (해설은 요청한 언어 1개만: PRD 11장 비용 절약)
export const AiQuestionSet = z.object({
  questions: z.array(
    z.object({
      format: z.enum(['blank', 'definition', 'synonym', 'form', 'error']),
      question: z.string(),
      choices: z.array(z.string()).length(4),
      answerIndex: z.number().int().min(0).max(3),
      word: z.string().nullable(),
      meaning: z.string().nullable(),
      grammarPoint: z.string().nullable(),
      explanation: z.string(),
    }),
  ),
})

export function buildPrompt({ category, level, lang, count }) {
  const cats =
    category === 'mixed'
      ? `${Math.ceil(count / 2)} vocabulary and ${Math.floor(count / 2)} grammar questions`
      : `${count} ${category === 'vocab' ? 'vocabulary' : 'grammar'} questions`
  const system = `You write multiple-choice English questions for language learners. The question text and the 4 choices are always in English. Meanings, grammar point names and explanations are written in ${LANG_NAMES[lang]} (keep English words as they are inside the explanation).

Level: ${level} — ${LEVEL_SCOPE[level]}

Formats:
- Vocabulary: "blank" (an English sentence with one blank written as ___ ; choices are words), "definition" (a short English definition in lowercase; choices are words), "synonym" (exactly: Which word means the SAME as "X"? or Which word means the OPPOSITE of "X"?). For vocabulary set word = the correct choice exactly, meaning = its short dictionary meaning in ${LANG_NAMES[lang]}, grammarPoint = null.
- Grammar: "form" (a sentence with one blank ___ ; choices are forms), "error" (a full sentence with exactly one mistake; choices are 4 consecutive pieces of that sentence copied exactly and in order; exactly one piece contains the mistake). For grammar set word = null, meaning = null, grammarPoint = the short name of the grammar point in ${LANG_NAMES[lang]}.

Quality rules:
- Exactly one correct answer. Wrong choices must be plausible but clearly wrong; no distractor may also be acceptable to a native speaker.
- The 4 choices are all different. Vary the position of the correct answer (answerIndex 0-3).
- explanation: 2-4 short, easy sentences in ${LANG_NAMES[lang]}: why the answer is right and why the other choices are wrong. For "error", give the corrected form.
- Natural English, varied topics, nothing offensive or sensitive.`
  const user = `Write ${cats} for level ${level}. Return exactly ${count} questions.`
  return { system, user }
}

// 앱 형식으로 변환 + 검수 (scripts/validate-questions.mjs와 같은 규칙)
export function toAppQuestions(raw, { category, level, lang }) {
  const out = []
  const stamp = Date.now().toString(36)
  raw.forEach((q, i) => {
    const cat = ['form', 'error'].includes(q.format) ? 'grammar' : 'vocab'
    if (category !== 'mixed' && cat !== category) return
    const choices = q.choices.map((c) => String(c).trim())
    if (choices.length !== 4 || choices.some((c) => !c)) return
    if (new Set(choices.map((c) => c.toLowerCase())).size !== 4) return
    if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > 3) return
    if (!q.question?.trim() || !q.explanation?.trim()) return
    if ((q.format === 'blank' || q.format === 'form') && !q.question.includes('___')) return
    if (q.format === 'synonym' && !/\b(SAME|OPPOSITE)\b/.test(q.question)) return
    if (q.format === 'error') {
      let pos = 0
      for (const c of choices) {
        const at = q.question.indexOf(c, pos)
        if (at < 0) return
        pos = at + c.length
      }
    }
    if (cat === 'vocab' && (!q.word || !q.meaning || q.word.trim() !== choices[q.answerIndex])) return
    if (cat === 'grammar' && !q.grammarPoint) return

    out.push({
      id: `ai-${cat}-${level}-${stamp}-${i}`,
      category: cat,
      level,
      format: q.format,
      question: q.question.trim(),
      choices,
      answerIndex: q.answerIndex,
      word: cat === 'vocab' ? q.word.trim() : null,
      meaning: cat === 'vocab' ? { [lang]: q.meaning.trim() } : null,
      grammarPoint: cat === 'grammar' ? { [lang]: q.grammarPoint.trim() } : null,
      explanation: { [lang]: q.explanation.trim() },
      source: 'ai',
    })
  })
  return out
}
