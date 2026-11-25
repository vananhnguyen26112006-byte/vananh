// 브라우저 내장 음성(Web Speech API). 지원하지 않는 기기에서는 버튼을 숨긴다 (PRD 7.9)
export const speechSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined'

export function speak(text, rate = 'normal') {
  if (!speechSupported || !text) return
  try {
    window.speechSynthesis.cancel()
    const u = new window.SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = rate === 'slow' ? 0.7 : 1
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith('en-us'))
    if (voice) u.voice = voice
    window.speechSynthesis.speak(u)
  } catch {
    // 음성 실패는 학습을 막지 않는다
  }
}
