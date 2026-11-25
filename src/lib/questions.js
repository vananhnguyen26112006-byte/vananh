import sample from '../data/questions/sample.json'
import { load, save } from './storage.js'

// 문제은행: src/data/questions/L1-vocab.json … L4-grammar.json (수준×영역별 파일)
const files = import.meta.glob('../data/questions/L[1-4]-*.json', { eager: true, import: 'default' })
const BANK = Object.values(files).flat()
// 문제은행 파일이 아직 없으면 샘플 10문제로 동작
const ALL = BANK.length ? BANK : sample

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---------- 최근 푼 문제 (같은 문제 반복 줄이기, PRD 9장 seenQuestions) ----------
const SEEN_MAX = 400

function loadSeen() {
  const v = load('seenQuestions', [])
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
}

export function markSeen(id) {
  const seen = loadSeen().filter((x) => x !== id)
  seen.push(id)
  save('seenQuestions', seen.slice(-SEEN_MAX))
}

// 안 푼 문제를 먼저 무작위로, 모자라면 가장 오래전에 푼 문제부터 채운다
function preferUnseen(pool, count) {
  const seen = loadSeen()
  const order = new Map(seen.map((id, i) => [id, i]))
  const unseen = shuffle(pool.filter((q) => !order.has(q.id)))
  const old = pool.filter((q) => order.has(q.id)).sort((a, b) => order.get(a.id) - order.get(b.id))
  return [...unseen, ...old].slice(0, count)
}

// category: 'vocab' | 'grammar' | 'mixed'
// 고른 수준·영역에서만 출제한다. (문제가 모자랄 때만 다른 수준으로 채움)
export function pickQuestions({ category, level, count = 10 }) {
  const inCat = (q) => category === 'mixed' || q.category === category
  const exact = ALL.filter((q) => inCat(q) && q.level === level)
  const picked = preferUnseen(exact, count)
  if (picked.length >= count) return shuffle(picked)
  const extra = shuffle(ALL.filter((q) => inCat(q) && q.level !== level)).slice(0, count - picked.length)
  return shuffle([...picked, ...extra])
}

// 화면에 보여줄 선택지 순서 (원래 인덱스 배열). 틀린 곳 찾기는 문장 순서를 지켜야 하므로 섞지 않는다.
export function choiceOrder(question) {
  const idx = question.choices.map((_, i) => i)
  return question.format === 'error' ? idx : shuffle(idx)
}

// 오늘의 단어: 날짜로 정해지는 어휘 문제 하나 (같은 날에는 항상 같은 단어)
// 빈칸 문제는 정답이 활용형(took, requires)이거나 콜로케이션 일부(pay)일 수 있어서 제외하고,
// 사전형 단어가 정답인 뜻 고르기·유의어 문제에서만 고른다.
export function todaysWord(level, dateKey) {
  const words = ALL.filter((q) => q.word && q.meaning && q.format !== 'blank')
  const atLevel = words.filter((q) => q.level === level)
  const pool = atLevel.length ? atLevel : words
  let h = 0
  for (const ch of dateKey) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return pool[h % pool.length]
}

// ---------- 레벨 테스트 (PRD 7.6) ----------
export const TEST_LEVELS = ['L1', 'L2', 'L3', 'L4']
export const TEST_PER_LEVEL = 4

// 16문제: 수준마다 어휘 2 + 문법 2, 쉬운 수준부터 어려운 순서로
export function buildLevelTest() {
  return TEST_LEVELS.flatMap((level) => {
    const vocab = shuffle(ALL.filter((q) => q.level === level && q.category === 'vocab')).slice(0, 2)
    const grammar = shuffle(ALL.filter((q) => q.level === level && q.category === 'grammar')).slice(0, 2)
    return shuffle([...vocab, ...grammar])
  })
}

// 판정: 각 수준 4문제 중 3문제 이상 맞힌 가장 높은 수준. 하나도 없으면 L1.
export function judgeLevel(results) {
  const perLevel = Object.fromEntries(TEST_LEVELS.map((l) => [l, 0]))
  for (const r of results) if (r.correct && r.question.level in perLevel) perLevel[r.question.level]++
  let level = 'L1'
  for (const l of TEST_LEVELS) if (perLevel[l] >= 3) level = l
  return { level, perLevel }
}

export function bankSize() {
  return ALL.length
}
