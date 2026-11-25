// localStorage 안전 래퍼: 저장 데이터가 없거나 깨져 있어도 앱이 멈추지 않게 한다 (PRD 9장)

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    const value = JSON.parse(raw)
    return value ?? fallback
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장 공간 부족·비공개 모드 등: 조용히 무시하고 메모리 상태로 계속 진행
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // 무시
  }
}

// 폰의 현지 시간 기준 날짜 키 (YYYY-MM-DD)
export function todayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function yesterdayKey(date = new Date()) {
  const d = new Date(date)
  d.setDate(d.getDate() - 1)
  return todayKey(d)
}
