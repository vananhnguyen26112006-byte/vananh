import { useEffect, useMemo, useState } from 'react'
import { LANGS, LEVELS, detectLang, makeT } from '../i18n/index.js'
import { OptionList, ProgressBar, TextButton } from '../components/ui.jsx'

const GOALS = [10, 20, 30]

// 첫 실행: 언어 → 수준 → 하루 목표 (한 화면에 질문 하나)
export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const [lang, setLang] = useState(detectLang)
  const [level, setLevel] = useState(null)
  const [goal, setGoal] = useState(20)
  const [takeTest, setTakeTest] = useState(false) // "레벨 테스트 보기"를 골랐는지
  const t = useMemo(() => makeT(lang), [lang])

  // 고르는 즉시 그 언어의 글꼴로 보이게
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const canNext = step === 0 ? Boolean(lang) : step === 1 ? Boolean(level) || takeTest : Boolean(goal)

  function next() {
    if (step < 2) setStep(step + 1)
    else onDone({ lang, level: takeTest ? null : level, goal }, takeTest)
  }

  return (
    <div className="flex flex-1 flex-col">
      <ProgressBar value={(step + 1) / 3} />

      <div key={step} className="anim-fade flex-1 px-6 pb-40 pt-16">
        <p className="t-label t-label-rule text-ink-muted">{t('onboarding.step', { n: step + 1 })}</p>

        {step === 0 && (
          <>
            <h1 className="t-heading mt-8">{t('onboarding.languageTitle')}</h1>
            <p className="t-body mt-4 text-ink-muted">{t('onboarding.languageHint')}</p>
            <div className="mt-12">
              <OptionList
                value={lang}
                onChange={setLang}
                options={LANGS.map((l) => ({ value: l.code, label: l.name, lang: l.code }))}
              />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="t-heading mt-8">{t('onboarding.levelTitle')}</h1>
            <div className="mt-12">
              <OptionList
                value={takeTest ? null : level}
                onChange={(v) => {
                  setLevel(v)
                  setTakeTest(false)
                }}
                options={LEVELS.map((lv) => ({ value: lv.code, label: `${lv.code} · ${t(`levels.${lv.code}`)}`, sub: lv.cefr }))}
              />
            </div>
            <p className="t-body mt-10 text-ink-muted">{t('onboarding.levelHint')}</p>
            <TextButton
              className="mt-1"
              onClick={() => {
                setTakeTest(true)
                setStep(2)
              }}
            >
              {t('onboarding.takeTest')}
            </TextButton>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="t-heading mt-8">{t('onboarding.goalTitle')}</h1>
            <div className="mt-12">
              <OptionList
                value={goal}
                onChange={setGoal}
                options={GOALS.map((g) => ({ value: g, label: t('onboarding.goalUnit', { n: g }) }))}
              />
            </div>
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-[430px] items-center gap-6 bg-bg px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        {step > 0 && (
          <TextButton arrow={false} onClick={() => setStep(step - 1)}>
            ← {t('onboarding.back')}
          </TextButton>
        )}
        <button className="btn-primary flex-1" disabled={!canNext} onClick={next}>
          {step < 2 ? t('onboarding.next') : t('onboarding.start')}
        </button>
      </div>
    </div>
  )
}
