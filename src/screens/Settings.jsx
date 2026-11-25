import { useState } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { LANGS, LEVELS } from '../i18n/index.js'
import { speechSupported } from '../lib/speech.js'
import { aiUsedToday, DEVICE_DAILY_LIMIT, verifyInvite } from '../lib/ai.js'
import { ICON, OptionList, TextButton } from '../components/ui.jsx'

const GOALS = [10, 20, 30]

// 설정 (PRD 7.10). 목록 → 항목을 누르면 한 화면에 질문 하나. 고르는 즉시 저장된다.
export default function Settings({ t, settings, aiAvailable, onChange, onReset, onLevelTest, onBack }) {
  const [view, setView] = useState(null) // null | 'language' | 'level' | 'goal' | 'speech' | 'theme' | 'ai' | 'invite' | 'reset'
  const [notice, setNotice] = useState('')
  const [code, setCode] = useState('')
  const [inviteState, setInviteState] = useState('idle') // idle | checking | wrong | limit | error

  const themeLabel = { system: t('settings.themeSystem'), light: t('settings.themeLight'), dark: t('settings.themeDark') }

  const fields = {
    language: {
      title: t('settings.language'),
      value: settings.lang,
      display: LANGS.find((l) => l.code === settings.lang)?.name,
      options: LANGS.map((l) => ({ value: l.code, label: l.name, lang: l.code })),
      apply: (v) => ({ lang: v }),
    },
    level: {
      title: t('settings.level'),
      value: settings.level,
      display: `${settings.level} · ${t(`levels.${settings.level}`)}`,
      options: LEVELS.map((lv) => ({ value: lv.code, label: `${lv.code} · ${t(`levels.${lv.code}`)}`, sub: lv.cefr })),
      apply: (v) => ({ level: v }),
    },
    goal: {
      title: t('settings.goal'),
      value: settings.goal,
      display: t('onboarding.goalUnit', { n: settings.goal }),
      options: GOALS.map((g) => ({ value: g, label: t('onboarding.goalUnit', { n: g }) })),
      apply: (v) => ({ goal: v }),
    },
    ...(speechSupported && {
      speech: {
        title: t('settings.speechRate'),
        value: settings.speechRate,
        display: t(`settings.${settings.speechRate}`),
        options: [
          { value: 'slow', label: t('settings.slow') },
          { value: 'normal', label: t('settings.normal') },
        ],
        apply: (v) => ({ speechRate: v }),
      },
    }),
    theme: {
      title: t('settings.theme'),
      value: settings.theme,
      display: themeLabel[settings.theme],
      options: ['system', 'light', 'dark'].map((v) => ({ value: v, label: themeLabel[v] })),
      apply: (v) => ({ theme: v }),
    },
  }

  // AI 모드 (서버가 설정돼 있을 때만 메뉴에 보임)
  if (aiAvailable) {
    fields.ai = {
      title: t('ai.mode'),
      value: settings.aiMode ? 'on' : 'off',
      display: `${settings.aiMode ? t('ai.on') : t('ai.off')} · ${t('ai.usage', { n: aiUsedToday(), max: DEVICE_DAILY_LIMIT })}`,
      options: [
        { value: 'on', label: t('ai.on') },
        { value: 'off', label: t('ai.off') },
      ],
      apply: (v) => ({ aiMode: v === 'on' }),
      intro: t('ai.desc'),
    }
  }

  async function submitInvite() {
    if (!code.trim() || inviteState === 'checking') return
    setInviteState('checking')
    const r = await verifyInvite(code.trim())
    if (r === 'ok') {
      onChange({ ...settings, aiMode: true, inviteCode: code.trim() })
      setCode('')
      setInviteState('idle')
      setView(null)
    } else setInviteState(r)
  }

  const backButton = (onClick, label) => (
    <button onClick={onClick} aria-label={label} className="-ml-3 flex h-11 w-11 items-center justify-center">
      <ArrowLeft {...ICON} />
    </button>
  )

  // 항목 상세: 한 화면에 질문 하나
  if (view && fields[view]) {
    const f = fields[view]
    return (
      <div key={view} className="anim-fade flex flex-1 flex-col px-6 pb-16 pt-4">
        {backButton(() => setView(null), t('settings.back'))}
        <p className="t-label t-label-rule mt-10 text-ink-muted">{t('settings.title')}</p>
        <h1 className="t-heading mt-8">{f.title}</h1>
        {f.intro && <p className="t-body mt-6 text-ink-muted">{f.intro}</p>}
        <div className="mt-12">
          <OptionList
            value={f.value}
            onChange={(v) => {
              // AI 모드를 처음 켤 때는 초대 코드부터
              if (view === 'ai' && v === 'on' && !settings.inviteCode) return setView('invite')
              onChange({ ...settings, ...f.apply(v) })
              setView(null)
            }}
            options={f.options}
          />
        </div>
      </div>
    )
  }

  // 초대 코드 입력 (AI 모드를 켤 때 한 번)
  if (view === 'invite') {
    const message = { wrong: t('ai.inviteWrong'), limit: t('ai.inviteLimit'), error: t('ai.inviteError') }[inviteState]
    return (
      <div className="anim-fade flex flex-1 flex-col px-6 pb-16 pt-4">
        {backButton(() => setView('ai'), t('settings.back'))}
        <p className="t-label t-label-rule mt-10 text-ink-muted">{t('ai.mode')}</p>
        <h1 className="t-heading mt-8">{t('ai.inviteTitle')}</h1>
        <p className="t-body mt-6 text-ink-muted">{t('ai.inviteHint')}</p>
        <form
          className="mt-12 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            submitInvite()
          }}
        >
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              if (inviteState !== 'checking') setInviteState('idle')
            }}
            placeholder={t('ai.invitePlaceholder')}
            aria-label={t('ai.invitePlaceholder')}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="t-body min-h-[56px] w-full border border-line bg-bg-soft px-5 text-ink outline-none focus:border-ink"
          />
          {message && (
            <p role="alert" className="t-body text-wrong">
              {message}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={!code.trim() || inviteState === 'checking'}>
            {inviteState === 'checking' ? t('ai.checking') : t('ai.verify')}
          </button>
        </form>
      </div>
    )
  }

  // 초기화 확인 (확인 창 필수)
  if (view === 'reset') {
    return (
      <div className="anim-fade flex flex-1 flex-col px-6 pb-16 pt-4">
        {backButton(() => setView(null), t('settings.back'))}
        <p className="t-label t-label-rule mt-10 text-ink-muted">{t('settings.title')}</p>
        <h1 className="t-heading mt-8">{t('settings.resetConfirmTitle')}</h1>
        <p className="t-body mt-6 text-ink-muted">{t('settings.resetConfirmBody')}</p>
        <div className="mt-12 flex flex-col items-start gap-3">
          <button
            className="btn-primary w-full"
            onClick={() => {
              onReset()
              setNotice(t('settings.resetDone'))
              setView(null)
            }}
          >
            {t('settings.confirmReset')}
          </button>
          <TextButton arrow={false} onClick={() => setView(null)}>
            {t('settings.cancel')}
          </TextButton>
        </div>
      </div>
    )
  }

  const Row = ({ label, value, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[72px] w-full items-center justify-between gap-4 border-b border-line py-4 text-left disabled:opacity-35"
    >
      <span className="flex flex-col gap-2">
        <span className="t-label text-ink-muted">{label}</span>
        {value && <span className="t-body text-ink">{value}</span>}
      </span>
      {!disabled && <ChevronRight {...ICON} className="shrink-0" aria-hidden="true" />}
    </button>
  )

  return (
    <div className="flex flex-1 flex-col px-6 pb-16 pt-4">
      {backButton(onBack, t('settings.back'))}
      <h1 className="t-heading mt-10">{t('settings.title')}</h1>

      <div className="mt-12 border-t border-line">
        {Object.entries(fields).map(([key, f]) => (
          <Row key={key} label={f.title} value={f.display} onClick={() => setView(key)} />
        ))}
        <Row label={t('settings.levelTest')} onClick={onLevelTest} />
        <Row label={t('settings.reset')} onClick={() => setView('reset')} />
      </div>

      {notice && <p className="t-body mt-6 text-ink">{notice}</p>}
      <p className="t-body mt-12 text-ink-muted">{t('settings.storageNote')}</p>
    </div>
  )
}
