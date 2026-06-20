// React wrapper around the MathLive <math-field> web component.
// Created imperatively (uncontrolled) and synced via the `input` event — the
// recommended way to integrate the web component with React.

import { useEffect, useRef } from 'react'
import { MathfieldElement } from 'mathlive'

interface Props {
  value: string
  onChange: (latex: string) => void
  invalid?: boolean
}

export function MathField({ value, onChange, invalid }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const mfRef = useRef<MathfieldElement | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const mf = new MathfieldElement()
    mfRef.current = mf
    mf.value = value
    mf.style.width = '100%'
    mf.mathVirtualKeyboardPolicy = 'auto'
    const handler = () => onChangeRef.current(mf.value)
    mf.addEventListener('input', handler)
    host.current?.appendChild(mf)
    return () => {
      mf.removeEventListener('input', handler)
      mf.remove()
      mfRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync external value changes (e.g. loading a shared graph).
  useEffect(() => {
    const mf = mfRef.current
    if (mf && mf.value !== value) mf.value = value
  }, [value])

  return <div ref={host} data-invalid={invalid ? 'true' : undefined} className="gd-mathhost" />
}
