'use client'

import { useEffect, useState } from 'react'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number
  onChange: (n: number) => void
  float?: boolean
}

export default function NumberField({ value, onChange, float, className = 'input', ...rest }: Props) {
  const [text, setText] = useState(() => String(value))

  // Re-sync only when the external number truly differs from what's typed
  useEffect(() => {
    if (Number(text === '' ? NaN : text) !== value) setText(String(value))
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.replace(/^(-?)0+(?=\d)/, '$1') // strip leading zeros
    setText(raw)
    if (raw === '' || raw === '-' || raw === '.') return
    const n = float ? parseFloat(raw) : parseInt(raw, 10)
    if (!Number.isNaN(n)) onChange(n)
  }

  function handleBlur() {
    if (text === '' || text === '-' || text === '.') {
      setText('0')
      onChange(0)
    }
  }

  return (
    <input
      {...rest}
      type="number"
      className={className}
      value={text}
      onChange={handle}
      onBlur={handleBlur}
    />
  )
}
