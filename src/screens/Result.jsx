import { Check, X } from 'lucide-react'
import { DisplayWord, ICON, TextButton } from '../components/ui.jsx'

export default function Result({ t, results, today, goal, onRetryWrong, onHome }) {
  const total = results.length
  const correct = results.filter((r) => r.correct).length
  const wrong = results.filter((r) => !r.correct)

  return (
    <div className="flex flex-1 flex-col px-6 pb-48 pt-16">
      <p className="t-label t-label-rule text-ink-muted">{t('result.title')}</p>
      <DisplayWord className="mt-8">{`${correct}/${total}`}</DisplayWord>
      <p className="t-body mt-5 text-ink-muted">{t('result.score', { correct, total })}</p>
      {today && today.answered >= goal && (
        <p className="t-label mt-6 flex items-center gap-2 text-correct">
          <Check {...ICON} aria-hidden="true" />
          {t('home.goalDone')} · <span lang="en">{today.answered} / {goal}</span>
        </p>
      )}

      <section className="mt-16">
        {wrong.length === 0 ? (
          <p className="t-body">{t('result.perfect')}</p>
        ) : (
          <>
            <p className="t-label text-ink-muted">{t('result.wrongList')}</p>
            <ul className="mt-6 flex flex-col gap-3">
              {wrong.map(({ question: q, selected }) => (
                <li key={q.id} className="card">
                  <p lang="en" className="t-body text-ink">
                    {q.question}
                  </p>
                  <p lang="en" className="t-body mt-3 flex items-center gap-2 text-ink-muted line-through">
                    <X size={20} strokeWidth={1.5} className="shrink-0 text-wrong" aria-label={t('quiz.wrong')} />
                    {q.choices[selected]}
                  </p>
                  <p lang="en" className="t-body mt-1 flex items-center gap-2 text-ink">
                    <Check size={20} strokeWidth={1.5} className="shrink-0 text-correct" aria-label={t('quiz.correct')} />
                    {q.choices[q.answerIndex]}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-[430px] flex-col items-start gap-2 bg-bg px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        {wrong.length > 0 && (
          <button className="btn-primary w-full" onClick={onRetryWrong}>
            {t('result.reviewMistakes')}
          </button>
        )}
        <TextButton onClick={onHome}>{t('result.home')}</TextButton>
      </div>
    </div>
  )
}
