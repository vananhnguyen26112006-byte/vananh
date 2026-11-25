import { Flame, Percent, Settings as SettingsIcon, Signal, Target, Volume2 } from 'lucide-react'
import { LEVELS, pick } from '../i18n/index.js'
import { todayKey } from '../lib/storage.js'
import { todaysWord } from '../lib/questions.js'
import { accuracy, currentStreak } from '../lib/records.js'
import { speak, speechSupported } from '../lib/speech.js'
import { DisplayWord, ICON, TextButton, TopBand } from '../components/ui.jsx'

// 최근 7일 (오늘 포함, 오래된 날부터)
function last7Days(progress, lang) {
  const fmt = new Intl.DateTimeFormat(lang, { weekday: 'narrow' })
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = todayKey(d)
    return { key, label: fmt.format(d), studied: (progress[key]?.answered || 0) > 0, isToday: i === 6 }
  })
}

export default function Home({ t, settings, today, progress, streak, notesCount, onStart, onSettings, onWrongNotes, onLevelTest }) {
  const days = currentStreak(streak)
  const acc = accuracy(progress)
  const word = todaysWord(settings.level, todayKey())
  const cefr = LEVELS.find((l) => l.code === settings.level)?.cefr
  const week = last7Days(progress, settings.lang)

  const sections = [
    { key: 'vocab', title: 'VOCABULARY', desc: t('home.vocabDesc'), onClick: () => onStart('vocab') },
    { key: 'grammar', title: 'GRAMMAR', desc: t('home.grammarDesc'), onClick: () => onStart('grammar') },
    {
      key: 'review',
      title: 'REVIEW',
      desc: `${t('home.reviewDesc')} · ${t('home.reviewCount', { n: notesCount })}`,
      onClick: onWrongNotes,
    },
  ]

  const stats = [
    { icon: Flame, label: t('home.streak'), value: days },
    { icon: Target, label: t('home.todayGoal'), value: `${today.answered}/${settings.goal}` },
    { icon: Percent, label: t('home.accuracy'), value: acc == null ? '—' : `${acc}%` },
    { icon: Signal, label: t('home.level'), value: `${settings.level} ${cefr}` },
  ]

  return (
    <div className="flex flex-1 flex-col">
      <TopBand>
        🔥 {t('home.streakBand', { n: days })} · {t('home.todayBand', { a: today.answered, g: settings.goal })}
      </TopBand>

      <header className="flex items-center justify-between px-6 pt-6">
        <span lang="en" className="t-heading">
          ENGLOOP
        </span>
        <button
          onClick={onSettings}
          aria-label={t('home.settings')}
          className="-mr-3 flex h-11 w-11 items-center justify-center text-ink active:opacity-85"
        >
          <SettingsIcon {...ICON} />
        </button>
      </header>

      {/* 히어로: 오늘의 단어 */}
      <section className="px-6 pb-16 pt-14">
        <p className="t-label t-label-rule text-ink-muted">{t('home.todaysWord')}</p>
        <DisplayWord className="mt-8">{word.word}</DisplayWord>
        <p className="t-body mt-5 text-ink-muted">{pick(word.meaning, settings.lang)}</p>
        {speechSupported && (
          <TextButton arrow={false} icon={Volume2} className="mt-2" onClick={() => speak(word.word, settings.speechRate)}>
            {t('home.listen')}
          </TextButton>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button className="btn-primary min-w-[160px] flex-1" onClick={() => onStart('mixed')}>
            {t('home.startQuiz')}
          </button>
          <TextButton onClick={onLevelTest}>{t('home.levelTest')}</TextButton>
        </div>
        {today.answered >= settings.goal && <p className="t-label mt-6 text-correct">{t('home.goalDone')}</p>}
      </section>

      {/* 검정 띠: 학습 메뉴 */}
      <section className="bg-ink px-6 py-6 text-on-ink">
        {sections.map((s, i) => (
          <div key={s.key}>
            {i > 0 && <div className="h-px bg-on-ink opacity-20" />}
            <button
              onClick={s.onClick}
              disabled={s.disabled}
              className="flex w-full flex-col items-start py-8 text-left disabled:cursor-default"
            >
              <span lang="en" className={`t-heading ${s.disabled ? 'opacity-40' : ''}`}>
                {s.title}
              </span>
              <span className="t-body mt-3 opacity-70">{s.desc}</span>
              <span className={`t-label mt-4 underline decoration-1 underline-offset-[6px] ${s.disabled ? 'no-underline opacity-40' : ''}`}>
                {s.disabled ? t('home.comingSoon') : `${t('home.start')} →`}
              </span>
            </button>
          </div>
        ))}
      </section>

      {/* 통계 2×2 */}
      <section className="grid grid-cols-2 bg-bg-soft">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`flex flex-col gap-3 p-5 py-8 ${i % 2 === 0 ? 'border-r border-line' : ''} ${i < 2 ? 'border-b border-line' : ''}`}
          >
            <s.icon {...ICON} aria-hidden="true" />
            <span className="t-label text-ink-muted">{s.label}</span>
            <span lang="en" className="t-heading">
              {s.value}
            </span>
          </div>
        ))}
        {/* 최근 7일 학습 여부 (각진 점) */}
        <div className="col-span-2 border-t border-line p-5 pb-10">
          <p className="t-label text-ink-muted">{t('home.last7')}</p>
          <ol className="mt-5 grid grid-cols-7 gap-2">
            {week.map((d) => (
              <li key={d.key} className="flex flex-col items-center gap-2">
                <span
                  className={`block h-3 w-3 border border-ink ${d.studied ? 'bg-ink' : ''}`}
                  aria-label={`${d.key}: ${d.studied ? '✓' : '—'}`}
                />
                <span className={`t-label ${d.isToday ? 'text-ink' : 'text-ink-muted'}`}>{d.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
