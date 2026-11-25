import { useState } from 'react'
import { ArrowLeft, Check, Trash2 } from 'lucide-react'
import { pick } from '../i18n/index.js'
import { MASTER_STREAK } from '../lib/wrongNotes.js'
import { ICON, TextButton } from '../components/ui.jsx'

// 오답 노트 (PRD 7.7): 어휘/문법 필터, 복습 시작, 개별 삭제, 전체 삭제(확인)
export default function WrongNotes({ t, lang, notes, onReview, onDelete, onDeleteAll, onBack }) {
  const [filter, setFilter] = useState('all')
  const [confirmAll, setConfirmAll] = useState(false)

  const shown = filter === 'all' ? notes : notes.filter((n) => n.question.category === filter)

  if (confirmAll) {
    return (
      <div className="anim-fade flex flex-1 flex-col px-6 pb-16 pt-4">
        <button onClick={() => setConfirmAll(false)} aria-label={t('settings.back')} className="-ml-3 flex h-11 w-11 items-center justify-center">
          <ArrowLeft {...ICON} />
        </button>
        <p className="t-label t-label-rule mt-10 text-ink-muted">{t('wrong.title')}</p>
        <h1 className="t-heading mt-8">{t('wrong.deleteAllConfirm')}</h1>
        <p className="t-body mt-6 text-ink-muted">{t('wrong.deleteAllBody')}</p>
        <div className="mt-12 flex flex-col items-start gap-3">
          <button
            className="btn-primary w-full"
            onClick={() => {
              onDeleteAll()
              setConfirmAll(false)
            }}
          >
            {t('wrong.deleteAll')}
          </button>
          <TextButton arrow={false} onClick={() => setConfirmAll(false)}>
            {t('settings.cancel')}
          </TextButton>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col px-6 pb-40 pt-4">
      <button onClick={onBack} aria-label={t('settings.back')} className="-ml-3 flex h-11 w-11 items-center justify-center">
        <ArrowLeft {...ICON} />
      </button>
      <h1 className="t-heading mt-10">{t('wrong.title')}</h1>
      <p className="t-body mt-4 text-ink-muted">{t('wrong.hint')}</p>

      {/* 필터 */}
      <div className="mt-10 flex border-b border-line" role="tablist">
        {['all', 'vocab', 'grammar'].map((f) => {
          const count = f === 'all' ? notes.length : notes.filter((n) => n.question.category === f).length
          const active = filter === f
          return (
            <button
              key={f}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f)}
              className={`t-label -mb-px flex min-h-[44px] flex-1 items-center justify-center gap-1 border-b ${
                active ? 'border-ink text-ink' : 'border-transparent text-ink-muted'
              }`}
            >
              {t(`wrong.${f}`)} <span lang="en">{count}</span>
            </button>
          )
        })}
      </div>

      {shown.length === 0 ? (
        <p className="t-body mt-12 text-ink-muted">{t('wrong.empty')}</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {shown.map(({ question: q, streak }) => (
            <li key={q.id} className="card flex gap-3">
              <div className="min-w-0 flex-1">
                <p className="t-label text-ink-muted">
                  <span lang="en">{q.level}</span> · {q.category === 'vocab' ? t('wrong.vocab') : pick(q.grammarPoint, lang)}
                </p>
                <p lang="en" className="t-body mt-2 break-words text-ink">
                  {q.question}
                </p>
                <p lang="en" className="t-body mt-1 flex items-center gap-2 text-ink">
                  <Check size={20} strokeWidth={1.5} className="shrink-0 text-correct" aria-label={t('quiz.answer')} />
                  {q.choices[q.answerIndex]}
                </p>
                {/* 연속 정답 진행: 작은 사각형 2개 */}
                <p className="t-label mt-3 flex items-center gap-2 text-ink-muted">
                  {Array.from({ length: MASTER_STREAK }, (_, i) => (
                    <span key={i} className={`inline-block h-2 w-2 border border-ink ${i < streak ? 'bg-ink' : ''}`} aria-hidden="true" />
                  ))}
                  {t('quiz.reviewProgress', { n: streak })}
                </p>
              </div>
              <button
                onClick={() => onDelete(q.id)}
                aria-label={t('wrong.delete')}
                className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center"
              >
                <Trash2 {...ICON} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {notes.length > 0 && (
        <TextButton arrow={false} className="mt-8 self-start" onClick={() => setConfirmAll(true)}>
          {t('wrong.deleteAll')}
        </TextButton>
      )}

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[430px] bg-bg px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        <button className="btn-primary w-full" disabled={shown.length === 0} onClick={() => onReview(shown)}>
          {t('wrong.review')} <span lang="en">({Math.min(10, shown.length)})</span>
        </button>
      </div>
    </div>
  )
}
