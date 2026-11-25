import { useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { LEVELS } from '../i18n/index.js'
import { TEST_LEVELS, TEST_PER_LEVEL } from '../lib/questions.js'
import { DisplayWord, ICON, TextButton } from '../components/ui.jsx'

// 레벨 테스트 안내 화면
export function LevelTestIntro({ t, onStart, onBack }) {
  return (
    <div className="flex flex-1 flex-col px-6 pb-40 pt-4">
      {onBack ? (
        <button onClick={onBack} aria-label={t('settings.back')} className="-ml-3 flex h-11 w-11 items-center justify-center">
          <ArrowLeft {...ICON} />
        </button>
      ) : (
        <div className="h-11" />
      )}
      <p className="t-label t-label-rule mt-10 text-ink-muted">{t('levelTest.title')}</p>
      <DisplayWord className="mt-8">16</DisplayWord>
      <p className="t-body mt-8 text-ink">{t('levelTest.intro')}</p>
      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[430px] bg-bg px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        <button className="btn-primary w-full" onClick={onStart}>
          {t('levelTest.start')}
        </button>
      </div>
    </div>
  )
}

// 판정 결과: 판정 수준을 보여주고 한 단계 올리거나 내릴 수 있다
export function LevelTestResult({ t, judged, onApply }) {
  const [level, setLevel] = useState(judged.level)
  const i = TEST_LEVELS.indexOf(level)
  const cefr = LEVELS.find((l) => l.code === level)?.cefr

  return (
    <div className="flex flex-1 flex-col px-6 pb-40 pt-16">
      <p className="t-label t-label-rule text-ink-muted">{t('levelTest.resultLabel')}</p>
      <DisplayWord className="mt-8">{level}</DisplayWord>
      <p className="t-body mt-5 text-ink">
        {t(`levels.${level}`)} · <span lang="en">{cefr}</span>
      </p>
      <p className="t-body mt-1 text-ink-muted">{t('levelTest.recommend')}</p>

      <div className="mt-6 flex flex-wrap gap-x-6">
        <TextButton arrow={false} disabled={i <= 0} onClick={() => setLevel(TEST_LEVELS[i - 1])}>
          ← {t('levelTest.down')}
        </TextButton>
        <TextButton disabled={i >= TEST_LEVELS.length - 1} onClick={() => setLevel(TEST_LEVELS[i + 1])}>
          {t('levelTest.up')}
        </TextButton>
      </div>

      {/* 수준별 정답 수 */}
      <ul className="mt-12 border-t border-line">
        {TEST_LEVELS.map((l) => {
          const c = judged.perLevel[l]
          const pass = c >= 3
          return (
            <li key={l} className="flex min-h-[56px] items-center justify-between border-b border-line">
              <span className="t-body">
                <span lang="en">{l}</span> · {t(`levels.${l}`)}
              </span>
              <span className="flex items-center gap-2">
                <span lang="en" className="t-body">
                  {t('levelTest.levelRow', { c, total: TEST_PER_LEVEL })}
                </span>
                {pass ? <Check {...ICON} className="text-correct" aria-hidden="true" /> : <span className="w-[22px]" />}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[430px] bg-bg px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        <button className="btn-primary w-full" onClick={() => onApply(level)}>
          {t('levelTest.apply')}
        </button>
      </div>
    </div>
  )
}
