import { useMemo, useState } from 'react'
import { Check, Volume2, X } from 'lucide-react'
import { pick } from '../i18n/index.js'
import { choiceOrder } from '../lib/questions.js'
import { speak, speechSupported } from '../lib/speech.js'
import { ICON, ProgressBar, TextButton } from '../components/ui.jsx'

// mode: 'normal' (일반 퀴즈) | 'review' (오답 노트 복습) | 'test' (레벨 테스트: 정답·해설을 보여주지 않음)
export default function Quiz({ t, lang, questions, mode = 'normal', speechRate, notice, onAnswer, onFinish, onQuit }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null) // 원래 choices 인덱스
  const [checked, setChecked] = useState(false)
  const [results, setResults] = useState([])
  const [note, setNote] = useState('') // 복습 진행 안내 등 패널 추가 문구

  const q = questions[idx]
  const order = useMemo(() => choiceOrder(q), [q])
  const isCorrect = selected === q.answerIndex
  const isLast = idx === questions.length - 1
  const isTest = mode === 'test'

  function record() {
    const entry = { question: q, selected, correct: isCorrect }
    const next = [...results, entry]
    setResults(next)
    setNote(onAnswer?.(isCorrect, q) || '')
    return next
  }

  function advance(all) {
    if (isLast) return onFinish(all)
    setIdx(idx + 1)
    setSelected(null)
    setChecked(false)
    setNote('')
  }

  function check() {
    if (selected === null || checked) return
    const all = record()
    if (isTest) advance(all)
    else setChecked(true)
  }

  function choiceClass(i) {
    if (!checked) return i === selected ? 'border border-ink bg-ink text-on-ink' : 'border border-line text-ink'
    if (i === q.answerIndex) return 'border-2 border-correct text-ink'
    if (i === selected) return 'border-2 border-wrong text-ink'
    return 'border border-line text-ink opacity-40'
  }

  // 예문 듣기: 빈칸 문제는 정답을 채운 문장 (틀린 곳 찾기 문장은 틀린 문장이라 읽지 않음)
  const sentence = q.question.includes('___') ? q.question.replace('___', q.choices[q.answerIndex]) : null

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-0 z-10 bg-bg">
        <ProgressBar value={(idx + (checked ? 1 : 0)) / questions.length} />
        <div className="flex items-center justify-between px-6 pt-3">
          <p className="t-label text-ink-muted">{t('quiz.question', { n: idx + 1, total: questions.length })}</p>
          <button onClick={onQuit} aria-label={t('quiz.quit')} className="-mr-3 flex h-11 w-11 items-center justify-center">
            <X {...ICON} />
          </button>
        </div>
      </div>

      {/* AI → 기본 문제 전환 같은 안내 (첫 문제에서만) */}
      {notice && idx === 0 && <p className="t-body border-b border-line bg-bg-soft px-6 py-3 text-ink">{notice}</p>}

      <div key={q.id + idx} className={`anim-fade px-6 pt-10 ${checked ? 'pb-[75dvh]' : 'pb-32'}`}>
        <p className="t-label text-ink-muted">
          {q.source === 'ai' && (
            <span lang="en" className="mr-2 border border-ink px-1 text-ink">
              AI
            </span>
          )}
          {t(`quiz.instructions.${q.format}`)}
        </p>
        <h2 lang="en" className="t-heading mt-6 break-words">
          {q.question}
        </h2>

        <div className="mt-10 flex flex-col gap-3">
          {order.map((i) => {
            const showCorrect = checked && i === q.answerIndex
            const showWrong = checked && i === selected && !isCorrect
            return (
              <button
                key={i}
                lang="en"
                onClick={() => !checked && setSelected(i)}
                disabled={checked}
                aria-pressed={i === selected}
                className={`t-body flex min-h-[56px] items-center justify-between gap-3 px-5 py-3 text-left transition-colors disabled:cursor-default ${choiceClass(i)}`}
              >
                <span>{q.choices[i]}</span>
                {showCorrect && <Check {...ICON} className="shrink-0 text-correct" aria-label={t('quiz.correct')} />}
                {showWrong && <X {...ICON} className="shrink-0 text-wrong" aria-label={t('quiz.wrong')} />}
              </button>
            )
          })}
        </div>
      </div>

      {!checked && (
        <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[430px] bg-bg px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
          <button className="btn-primary w-full" disabled={selected === null} onClick={check}>
            {!isTest ? t('quiz.check') : isLast ? t('quiz.seeResult') : t('quiz.next')}
          </button>
        </div>
      )}

      {checked && (
        <section className="anim-slide-up fixed inset-x-0 bottom-0 z-20 mx-auto max-h-[70dvh] w-full max-w-[430px] overflow-y-auto border-t border-line bg-bg-soft px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8">
          <p className={`t-label flex items-center gap-2 ${isCorrect ? 'text-correct' : 'text-wrong'}`}>
            {isCorrect ? <Check {...ICON} aria-hidden="true" /> : <X {...ICON} aria-hidden="true" />}
            {isCorrect ? t('quiz.correct') : t('quiz.wrong')}
          </p>
          {note && <p className="t-body mt-3 text-ink-muted">{note}</p>}
          {!isCorrect && (
            <p className="t-body mt-3">
              {t('quiz.answer')}: <span lang="en">{q.choices[q.answerIndex]}</span>
            </p>
          )}
          {q.category === 'vocab' && q.word && (
            <p className="t-body mt-3">
              <span lang="en">{q.word}</span> — {pick(q.meaning, lang)}
            </p>
          )}
          {q.category === 'grammar' && q.grammarPoint && (
            <p className="t-body mt-3">
              {t('quiz.grammarPoint')}: {pick(q.grammarPoint, lang)}
            </p>
          )}

          {speechSupported && (q.word || sentence) && (
            <div className="mt-2 flex flex-wrap gap-x-6">
              {q.category === 'vocab' && q.word && (
                <TextButton arrow={false} icon={Volume2} onClick={() => speak(q.word, speechRate)}>
                  {t('quiz.listenWord')}
                </TextButton>
              )}
              {sentence && (
                <TextButton arrow={false} icon={Volume2} onClick={() => speak(sentence, speechRate)}>
                  {t('quiz.listenSentence')}
                </TextButton>
              )}
            </div>
          )}

          <p className="t-label t-label-rule mt-8 text-ink-muted">{t('quiz.why')}</p>
          <p className="t-body mt-4 text-ink">{pick(q.explanation, lang)}</p>

          <button className="btn-primary mt-8 w-full" onClick={() => advance(results)}>
            {isLast ? t('quiz.seeResult') : t('quiz.next')}
          </button>
        </section>
      )}
    </div>
  )
}
