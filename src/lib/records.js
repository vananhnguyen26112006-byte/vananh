import { todayKey, yesterdayKey } from './storage.js'

// 연속 학습일 (PRD 7.8): 하루 1문제 이상 풀면 학습한 날. 어제 학습했으면 +1, 빠지면 1부터.
export function bumpStreak(streak) {
  const today = todayKey()
  if (streak?.lastDate === today) return streak
  const count = streak?.lastDate === yesterdayKey() ? (streak.count || 0) + 1 : 1
  return { count, lastDate: today }
}

// 화면 표시용: 오늘이나 어제 학습했으면 이어지는 중, 아니면 0
export function currentStreak(streak) {
  if (!streak?.lastDate) return 0
  if (streak.lastDate === todayKey() || streak.lastDate === yesterdayKey()) return streak.count || 0
  return 0
}

// 전체 정답률 (%). 푼 문제가 없으면 null
export function accuracy(progress) {
  let answered = 0
  let correct = 0
  for (const day of Object.values(progress || {})) {
    answered += day?.answered || 0
    correct += day?.correct || 0
  }
  return answered ? Math.round((correct / answered) * 100) : null
}
