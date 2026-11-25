import ko from './ko.json'
import en from './en.json'
import ja from './ja.json'
import zh from './zh.json'
import es from './es.json'
import vi from './vi.json'

const DICTS = { ko, en, ja, zh, es, vi }

export const LANGS = [
  { code: 'ko', name: '한국어' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '简体中文' },
  { code: 'es', name: 'Español' },
  { code: 'vi', name: 'Tiếng Việt' },
]

export const LEVELS = [
  { code: 'L1', cefr: 'A1' },
  { code: 'L2', cefr: 'A2' },
  { code: 'L3', cefr: 'B1' },
  { code: 'L4', cefr: 'B2+' },
]

export function isLang(code) {
  return Object.prototype.hasOwnProperty.call(DICTS, code)
}

// 폰 언어 설정을 감지해 기본값으로 제안
export function detectLang() {
  try {
    const list = navigator.languages?.length ? navigator.languages : [navigator.language]
    for (const l of list) {
      const code = String(l || '').slice(0, 2).toLowerCase()
      if (isLang(code)) return code
    }
  } catch {
    // 무시
  }
  return 'en'
}

function lookup(dict, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict)
}

// t('home.title', { n: 3 }) 형태로 사용. 번역이 없으면 영어 → 키 순으로 대체
export function makeT(lang) {
  const dict = DICTS[lang] || DICTS.en
  return (path, vars) => {
    let s = lookup(dict, path) ?? lookup(DICTS.en, path) ?? path
    if (vars && typeof s === 'string') {
      for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
    }
    return s
  }
}

// 문제 데이터의 6개 언어 객체에서 현재 언어 값을 꺼낸다 (없으면 영어)
export function pick(obj, lang) {
  if (!obj) return ''
  return obj[lang] ?? obj.en ?? ''
}
