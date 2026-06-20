// Small styled form primitives — "Estación Pro" steel aesthetic.

import type { ReactNode } from 'react'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="gd-group mx-3 mb-3 mt-3 px-3 pb-3 pt-1">
      <legend>{title}</legend>
      <div className="flex flex-col gap-2 pt-1">{children}</div>
    </fieldset>
  )
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm text-app-muted">
      <span className="min-w-0 shrink">{label}</span>
      <div className="flex shrink-0 items-center gap-1">{children}</div>
    </label>
  )
}

export function NumberField({
  value,
  onChange,
  step = 0.5,
  width = 'w-16',
}: {
  value: number
  onChange: (v: number) => void
  step?: number
  width?: string
}) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      step={step}
      onChange={(e) => {
        const v = parseFloat(e.target.value)
        if (Number.isFinite(v)) onChange(v)
      }}
      className={`gd-input ${width} px-2 py-1 text-right text-sm`}
    />
  )
}

export function RangeField({
  min,
  max,
  onChange,
}: {
  min: number
  max: number
  onChange: (min: number, max: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <NumberField value={min} onChange={(v) => onChange(v, max)} width="w-14" />
      <span className="text-app-faint">–</span>
      <NumberField value={max} onChange={(v) => onChange(min, v)} width="w-14" />
    </div>
  )
}

export function Slider({
  value,
  min,
  max,
  step = 0.01,
  onChange,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min || 1)) * 100))
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="gd-range w-28"
      style={{
        background: `linear-gradient(to right, var(--color-app-blue) 0 ${pct}%, var(--color-app-input) ${pct}% 100%)`,
      }}
    />
  )
}

export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-[18px] w-[38px] shrink-0 items-center rounded-[3px] border border-app-border"
      style={{
        background: checked ? 'linear-gradient(#3f5f94,#2c4470)' : 'var(--color-app-input)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,.4)',
      }}
    >
      <span
        className="absolute top-[1px] h-[14px] w-[14px] rounded-[2px]"
        style={{
          left: checked ? '21px' : '2px',
          background: checked
            ? 'linear-gradient(#dfe7f2,#aab6c8)'
            : 'linear-gradient(#aab6c8,#7d8aa0)',
          boxShadow: '0 1px 1px rgba(0,0,0,.5)',
          transition: 'left .15s ease',
        }}
      />
    </button>
  )
}

export function ColorField({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 w-9 cursor-pointer rounded-[3px] border border-app-border bg-transparent p-0"
    />
  )
}

export function SelectField<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (v: T) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="gd-input px-2 py-1 text-sm"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function Button({
  children,
  onClick,
  variant = 'default',
  disabled,
  full,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'primary' | 'ghost'
  disabled?: boolean
  full?: boolean
}) {
  const cls =
    variant === 'primary' ? 'gd-primary' : variant === 'ghost' ? 'text-app-muted hover:text-app-text' : 'gd-bevel'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${cls} ${
        full ? 'w-full' : ''
      }`}
    >
      {children}
    </button>
  )
}
