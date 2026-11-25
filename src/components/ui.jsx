import { Check } from 'lucide-react'

export const ICON = { size: 22, strokeWidth: 1.5 }

// 상단 고정 띠 (DESIGN.md: 높이 28px, 🔥 하나만 허용)
export function TopBand({ children }) {
  return (
    <div className="t-label sticky top-0 z-20 flex h-7 items-center justify-center whitespace-nowrap bg-ink px-6 text-on-ink">
      <span className="overflow-hidden text-ellipsis">{children}</span>
    </div>
  )
}

export function ProgressBar({ value }) {
  return (
    <div className="h-[2px] w-full bg-line">
      <div className="h-full bg-ink transition-[width] duration-200" style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
    </div>
  )
}

export function TextButton({ children, arrow = true, icon: Icon, className = '', ...props }) {
  return (
    <button className={`btn-text ${className}`} {...props}>
      {Icon && <Icon size={20} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />}
      <span>{children}</span>
      {arrow && <span aria-hidden="true">→</span>}
    </button>
  )
}

// 거대한 영어 단어. 긴 단어는 화면 폭에 맞게 글자 크기를 줄인다.
export function DisplayWord({ children, className = '' }) {
  const len = String(children).length || 1
  const fit = `calc((min(100vw, 430px) - 48px) / ${(len * 0.62).toFixed(2)})`
  return (
    <p lang="en" className={`t-display break-words ${className}`} style={{ fontSize: `min(clamp(64px, 22vw, 120px), ${fit})` }}>
      {children}
    </p>
  )
}

// 한 화면에 질문 하나: 선택지 목록 (온보딩·설정 공용)
export function OptionList({ options, value, onChange }) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            disabled={o.disabled}
            aria-pressed={selected}
            className={`t-body flex min-h-[56px] items-center justify-between gap-3 border px-5 py-3 text-left transition-colors disabled:opacity-35 ${
              selected ? 'border-ink bg-ink text-on-ink' : 'border-line text-ink'
            }`}
          >
            <span lang={o.lang}>{o.label}</span>
            <span className="flex shrink-0 items-center gap-3">
              {o.sub && <span className="t-label opacity-60">{o.sub}</span>}
              {selected && <Check {...ICON} aria-hidden="true" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
