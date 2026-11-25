import { useEffect, useMemo, useState } from 'react'
import { isLang, makeT } from './i18n/index.js'
import { load, remove, save, todayKey } from './lib/storage.js'
import { buildLevelTest, judgeLevel, markSeen, pickQuestions, shuffle } from './lib/questions.js'
import { bumpStreak } from './lib/records.js'
import { addWrong, answerInReview, loadNotes, removeNote, saveNotes } from './lib/wrongNotes.js'
import Onboarding from './screens/Onboarding.jsx'
import Home from './screens/Home.jsx'
import Quiz from './screens/Quiz.jsx'
import Result from './screens/Result.jsx'
import Settings from './screens/Settings.jsx'
import WrongNotes from './screens/WrongNotes.jsx'
import { LevelTestIntro, LevelTestResult } from './screens/LevelTest.jsx'

const LEVEL_CODES = ['L1', 'L2', 'L3', 'L4']
const GOALS = [10, 20, 30]
const RECORD_KEYS = ['progress', 'streak', 'wrongNotes', 'seenQuestions']

// 저장된 설정이 깨져 있으면 null → 온보딩부터 다시. 빠진 선택 항목은 기본값으로 채운다.
function loadSettings() {
  const s = load('settings', null)
  if (!s || typeof s !== 'object') return null
  if (!isLang(s.lang) || !LEVEL_CODES.includes(s.level) || !GOALS.includes(s.goal)) return null
  return {
    ...s,
    speechRate: s.speechRate === 'slow' ? 'slow' : 'normal',
    theme: ['light', 'dark'].includes(s.theme) ? s.theme : 'system',
  }
}

function loadObject(key) {
  const v = load(key, {})
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [progress, setProgress] = useState(() => loadObject('progress'))
  const [streak, setStreak] = useState(() => loadObject('streak'))
  const [notes, setNotes] = useState(loadNotes)
  const [screen, setScreen] = useState(settings ? 'home' : 'onboarding')
  const [quiz, setQuiz] = useState(null) // { id, questions, mode: 'normal' | 'review' | 'test' }
  const [results, setResults] = useState([])
  const [judged, setJudged] = useState(null) // 레벨 테스트 판정
  const [testFrom, setTestFrom] = useState('home') // 레벨 테스트를 연 화면 (뒤로 가기용)

  const lang = settings?.lang ?? 'en'
  const t = useMemo(() => makeT(lang), [lang])
  const today = progress[todayKey()] ?? { answered: 0, correct: 0 }

  // 화면 언어 → <html lang> (글꼴·자간이 언어에 맞게 바뀜)
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // 다크 모드 수동 전환: 'system'이면 속성을 지워 기기 설정을 따른다
  useEffect(() => {
    const root = document.documentElement
    if (settings?.theme === 'light' || settings?.theme === 'dark') root.dataset.theme = settings.theme
    else delete root.dataset.theme
  }, [settings?.theme])

  function updateSettings(next) {
    setSettings(next)
    save('settings', next)
  }

  function updateNotes(next) {
    setNotes(next)
    saveNotes(next)
  }

  function finishOnboarding(values, takeTest) {
    updateSettings({ speechRate: 'normal', theme: 'system', ...values, level: values.level ?? 'L1' })
    if (takeTest) openLevelTest('onboarding')
    else setScreen('home')
  }

  // 답 하나를 기록하고, 패널에 보여줄 추가 문구를 돌려준다
  function recordAnswer(correct, q, mode) {
    if (mode === 'test') return '' // 레벨 테스트는 학습 기록·오답 노트에 넣지 않는다

    markSeen(q.id)
    setProgress((prev) => {
      const key = todayKey()
      const cur = prev[key] ?? { answered: 0, correct: 0 }
      const next = { ...prev, [key]: { answered: cur.answered + 1, correct: cur.correct + (correct ? 1 : 0) } }
      save('progress', next)
      return next
    })
    setStreak((prev) => {
      const next = bumpStreak(prev)
      if (next !== prev) save('streak', next)
      return next
    })

    if (mode === 'review') {
      const r = answerInReview(notes, q.id, correct)
      updateNotes(r.notes)
      return r.removed ? t('quiz.mastered') : t('quiz.reviewProgress', { n: r.streak })
    }
    if (!correct) updateNotes(addWrong(notes, q))
    return ''
  }

  function resetRecords() {
    RECORD_KEYS.forEach(remove)
    setProgress({})
    setStreak({})
    setNotes([])
  }

  function startQuiz(category) {
    setQuiz({ id: Date.now(), mode: 'normal', questions: pickQuestions({ category, level: settings.level, count: 10 }) })
    setScreen('quiz')
  }

  function startReview(list) {
    setQuiz({ id: Date.now(), mode: 'review', questions: shuffle(list).slice(0, 10).map((n) => n.question) })
    setScreen('quiz')
  }

  function retryWrong() {
    setQuiz({ id: Date.now(), mode: quiz?.mode === 'review' ? 'review' : 'normal', questions: results.filter((r) => !r.correct).map((r) => r.question) })
    setScreen('quiz')
  }

  function openLevelTest(from) {
    setTestFrom(from)
    setScreen('levelIntro')
  }

  function finishQuiz(res) {
    setResults(res)
    if (quiz.mode === 'test') {
      setJudged(judgeLevel(res))
      setScreen('levelResult')
    } else setScreen('result')
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-bg">
      <div key={screen} className="anim-fade flex flex-1 flex-col">
        {screen === 'onboarding' && <Onboarding onDone={finishOnboarding} />}
        {screen === 'home' && settings && (
          <Home
            t={t}
            settings={settings}
            today={today}
            progress={progress}
            streak={streak}
            notesCount={notes.length}
            onStart={startQuiz}
            onSettings={() => setScreen('settings')}
            onWrongNotes={() => setScreen('wrongNotes')}
            onLevelTest={() => openLevelTest('home')}
          />
        )}
        {screen === 'quiz' && quiz && (
          <Quiz
            key={quiz.id}
            t={t}
            lang={lang}
            mode={quiz.mode}
            speechRate={settings.speechRate}
            questions={quiz.questions}
            onAnswer={(correct, q) => recordAnswer(correct, q, quiz.mode)}
            onFinish={finishQuiz}
            onQuit={() => setScreen(quiz.mode === 'review' ? 'wrongNotes' : quiz.mode === 'test' ? 'levelIntro' : 'home')}
          />
        )}
        {screen === 'result' && (
          <Result t={t} results={results} today={today} goal={settings.goal} onRetryWrong={retryWrong} onHome={() => setScreen('home')} />
        )}
        {screen === 'settings' && settings && (
          <Settings
            t={t}
            settings={settings}
            onChange={updateSettings}
            onReset={resetRecords}
            onLevelTest={() => openLevelTest('settings')}
            onBack={() => setScreen('home')}
          />
        )}
        {screen === 'wrongNotes' && (
          <WrongNotes
            t={t}
            lang={lang}
            notes={notes}
            onReview={startReview}
            onDelete={(id) => updateNotes(removeNote(notes, id))}
            onDeleteAll={() => updateNotes([])}
            onBack={() => setScreen('home')}
          />
        )}
        {screen === 'levelIntro' && (
          <LevelTestIntro
            t={t}
            onStart={() => {
              setQuiz({ id: Date.now(), mode: 'test', questions: buildLevelTest() })
              setScreen('quiz')
            }}
            onBack={testFrom === 'onboarding' ? null : () => setScreen(testFrom)}
          />
        )}
        {screen === 'levelResult' && judged && (
          <LevelTestResult
            t={t}
            judged={judged}
            onApply={(level) => {
              updateSettings({ ...settings, level })
              setScreen('home')
            }}
          />
        )}
      </div>
    </div>
  )
}
