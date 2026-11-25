// 오답 노트 (PRD 7.7): 틀린 문제 데이터를 통째로 저장해 오프라인 복습이 가능하게 한다.
// 저장 형식: [{ question, streak, addedAt }]  — streak = 복습에서 연속으로 맞힌 횟수
import { load, save } from './storage.js'

export const MASTER_STREAK = 2

export function loadNotes() {
  const v = load('wrongNotes', [])
  if (!Array.isArray(v)) return []
  return v.filter((n) => n && n.question && typeof n.question.id === 'string' && Array.isArray(n.question.choices))
}

export function saveNotes(notes) {
  save('wrongNotes', notes)
}

// 틀린 문제 추가. 이미 있으면 중복 저장하지 않고 연속 정답만 0으로 되돌린다.
export function addWrong(notes, question) {
  const i = notes.findIndex((n) => n.question.id === question.id)
  if (i >= 0) return notes.map((n, j) => (j === i ? { ...n, streak: 0 } : n))
  return [...notes, { question, streak: 0, addedAt: Date.now() }]
}

// 복습에서 답했을 때: 맞히면 +1, 2번 연속이면 목록에서 제거, 틀리면 0
export function answerInReview(notes, questionId, correct) {
  const note = notes.find((n) => n.question.id === questionId)
  if (!note) return { notes, streak: 0, removed: false }
  const streak = correct ? note.streak + 1 : 0
  if (streak >= MASTER_STREAK) return { notes: notes.filter((n) => n !== note), streak, removed: true }
  return { notes: notes.map((n) => (n === note ? { ...n, streak } : n)), streak, removed: false }
}

export function removeNote(notes, questionId) {
  return notes.filter((n) => n.question.id !== questionId)
}
