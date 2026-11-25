#!/usr/bin/env node
// 문제은행 검수 스크립트 (PRD 8장 "문제은행 품질 규칙")
// 사용법:
//   node scripts/validate-questions.mjs                 → src/data/questions/L*-*.json 전체 검사
//   node scripts/validate-questions.mjs <파일> [...]     → 지정한 파일만 검사
//   --no-count                                          → 파일별 문제 수(어휘 40 / 문법 30) 검사 생략
// 오류가 하나라도 있으면 종료 코드 1

import { readFileSync, readdirSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

const LANGS = ['ko', 'en', 'ja', 'zh', 'es', 'vi']
const LEVELS = ['L1', 'L2', 'L3', 'L4']
const FORMATS = { vocab: ['blank', 'definition', 'synonym'], grammar: ['form', 'error'] }
const EXPECTED_COUNT = { vocab: 40, grammar: 30 }
const DIR = resolve('src/data/questions')

const args = process.argv.slice(2)
const checkCount = !args.includes('--no-count')
const fileArgs = args.filter((a) => !a.startsWith('--'))
const files = fileArgs.length
  ? fileArgs.map((f) => resolve(f))
  : readdirSync(DIR)
      .filter((f) => /^L[1-4]-(vocab|grammar)\.json$/.test(f))
      .sort()
      .map((f) => join(DIR, f))

const errors = []
const warnings = []
const seenIds = new Map()
const seenQuestions = new Map()
const seenWords = new Map()
const stats = {}

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0

function checkLangObject(where, field, obj) {
  if (!isObj(obj)) return errors.push(`${where}: ${field}가 6개 언어 객체가 아님`)
  for (const l of LANGS) if (!nonEmpty(obj[l])) errors.push(`${where}: ${field}.${l} 누락/빈 값`)
  for (const k of Object.keys(obj)) if (!LANGS.includes(k)) errors.push(`${where}: ${field}에 알 수 없는 언어 키 "${k}"`)
}

function sentenceCount(text) {
  // 마침표·물음표·느낌표 및 CJK 마침표 기준 대략적인 문장 수
  return (text.match(/[.!?。！？](\s|$)/g) || []).length || 1
}

for (const file of files) {
  const name = basename(file)
  const m = name.match(/^(L[1-4])-(vocab|grammar)\.json$/)
  if (!m) {
    errors.push(`${name}: 파일 이름은 L1-vocab.json 형식이어야 함`)
    continue
  }
  const [, fileLevel, fileCat] = m

  let data
  try {
    const raw = readFileSync(file, 'utf8')
    if (raw.charCodeAt(0) === 0xfeff) errors.push(`${name}: 파일 맨 앞에 BOM이 있음 (UTF-8 BOM 없이 저장)`)
    data = JSON.parse(raw.replace(/^﻿/, ''))
  } catch (e) {
    errors.push(`${name}: JSON 파싱 실패 — ${e.message}`)
    continue
  }
  if (!Array.isArray(data)) {
    errors.push(`${name}: 최상위가 배열이 아님`)
    continue
  }

  const fmtCount = {}
  const answerPos = [0, 0, 0, 0]

  data.forEach((q, i) => {
    const where = `${name}#${i + 1}${q?.id ? ` (${q.id})` : ''}`
    if (!isObj(q)) return errors.push(`${where}: 객체가 아님`)

    // id
    const idRe = new RegExp(`^${fileCat}-${fileLevel}-\\d{4}$`)
    if (!nonEmpty(q.id) || !idRe.test(q.id)) errors.push(`${where}: id는 "${fileCat}-${fileLevel}-0001" 형식이어야 함`)
    else if (seenIds.has(q.id)) errors.push(`${where}: id 중복 (${seenIds.get(q.id)})`)
    else seenIds.set(q.id, where)

    // 분류
    if (q.category !== fileCat) errors.push(`${where}: category "${q.category}" ≠ 파일(${fileCat})`)
    if (q.level !== fileLevel) errors.push(`${where}: level "${q.level}" ≠ 파일(${fileLevel})`)
    if (!LEVELS.includes(q.level)) errors.push(`${where}: level 값 오류`)
    if (!FORMATS[fileCat]?.includes(q.format)) errors.push(`${where}: format "${q.format}"은 ${fileCat}에서 쓸 수 없음`)
    fmtCount[q.format] = (fmtCount[q.format] || 0) + 1

    // 문제·선택지
    if (!nonEmpty(q.question)) errors.push(`${where}: question 누락`)
    if (!Array.isArray(q.choices) || q.choices.length !== 4) errors.push(`${where}: choices는 정확히 4개여야 함`)
    else {
      if (!q.choices.every(nonEmpty)) errors.push(`${where}: 빈 선택지 있음`)
      const norm = q.choices.map((c) => String(c).trim().toLowerCase())
      if (new Set(norm).size !== 4) errors.push(`${where}: 선택지 중복`)
    }
    if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > 3) errors.push(`${where}: answerIndex는 0~3 정수`)
    else answerPos[q.answerIndex]++

    if ((q.format === 'blank' || q.format === 'form') && !q.question?.includes('___'))
      errors.push(`${where}: ${q.format} 문제에는 빈칸 "___"이 있어야 함`)

    if (q.format === 'error' && Array.isArray(q.choices) && nonEmpty(q.question)) {
      // 선택지 4개가 문장 안에 순서대로 들어 있어야 함
      let pos = 0
      for (const c of q.choices) {
        const at = q.question.indexOf(c, pos)
        if (at < 0) {
          errors.push(`${where}: 틀린 곳 찾기 선택지 "${c}"가 문장에 순서대로 없음`)
          break
        }
        pos = at + c.length
      }
    }

    if (q.format === 'synonym' && !/\b(SAME|OPPOSITE)\b/.test(q.question || ''))
      errors.push(`${where}: synonym 문제는 질문에 SAME 또는 OPPOSITE를 대문자로 써야 함`)

    // 중복 문제
    const qKey = String(q.question || '').trim().toLowerCase()
    if (qKey) {
      if (seenQuestions.has(qKey)) errors.push(`${where}: 같은 문제 문장이 이미 있음 (${seenQuestions.get(qKey)})`)
      else seenQuestions.set(qKey, where)
    }

    // 영역별 필드
    if (fileCat === 'vocab') {
      if (!nonEmpty(q.word)) errors.push(`${where}: 어휘 문제에 word 누락`)
      else if (Array.isArray(q.choices) && Number.isInteger(q.answerIndex) && q.choices[q.answerIndex] !== q.word)
        errors.push(`${where}: word "${q.word}"가 정답 선택지 "${q.choices[q.answerIndex]}"와 다름`)
      checkLangObject(where, 'meaning', q.meaning)
      if (q.grammarPoint !== null) errors.push(`${where}: 어휘 문제의 grammarPoint는 null이어야 함`)
      if (nonEmpty(q.word)) {
        const w = q.word.toLowerCase()
        if (seenWords.has(w)) warnings.push(`${where}: 정답 단어 "${q.word}"가 이미 출제됨 (${seenWords.get(w)})`)
        else seenWords.set(w, where)
      }
    } else {
      if (q.word !== null) errors.push(`${where}: 문법 문제의 word는 null이어야 함`)
      if (q.meaning !== null) errors.push(`${where}: 문법 문제의 meaning은 null이어야 함`)
      checkLangObject(where, 'grammarPoint', q.grammarPoint)
    }

    // 해설: 6개 언어, 2~4문장 (영어 기준으로 문장 수 검사)
    checkLangObject(where, 'explanation', q.explanation)
    if (nonEmpty(q.explanation?.en)) {
      const n = sentenceCount(q.explanation.en)
      if (n < 2 || n > 4) warnings.push(`${where}: 영어 해설이 ${n}문장 (권장 2~4문장)`)
    }
    for (const l of LANGS) {
      const len = q.explanation?.[l]?.length || 0
      if (len > 500) warnings.push(`${where}: explanation.${l}이 너무 김 (${len}자)`)
    }
  })

  if (checkCount && data.length !== EXPECTED_COUNT[fileCat])
    errors.push(`${name}: 문제 수 ${data.length}개 (목표 ${EXPECTED_COUNT[fileCat]}개)`)

  const maxPos = Math.max(...answerPos)
  if (data.length >= 20 && maxPos > data.length * 0.4)
    warnings.push(`${name}: 정답 위치가 한쪽에 몰림 [${answerPos.join(', ')}]`)

  stats[name] = { count: data.length, formats: fmtCount, answerPos }
}

console.log('\n문제은행 검수 결과')
console.log('─'.repeat(40))
let total = 0
for (const [name, s] of Object.entries(stats)) {
  total += s.count
  const fmt = Object.entries(s.formats).map(([k, v]) => `${k} ${v}`).join(', ')
  console.log(`${name.padEnd(18)} ${String(s.count).padStart(3)}문제  (${fmt})  정답위치 [${s.answerPos.join(',')}]`)
}
console.log('─'.repeat(40))
console.log(`총 ${total}문제, 파일 ${files.length}개`)

if (warnings.length) {
  console.log(`\n경고 ${warnings.length}건 (통과에는 영향 없음):`)
  warnings.forEach((w) => console.log('  ! ' + w))
}
if (errors.length) {
  console.log(`\n오류 ${errors.length}건:`)
  errors.forEach((e) => console.log('  ✗ ' + e))
  console.log('\n검수 실패')
  process.exit(1)
}
console.log('\n검수 통과')
