'use client'

import Link from 'next/link'
import { Icon } from '@/components/Icon'

// text on desktop, icon on phone

export function EditAction({ href, onClick }: { href?: string; onClick?: () => void }) {
  const inner = (
    <>
      <span className="act-txt">EDITAR</span>
      <span className="act-ico" aria-hidden="true"><Icon.Edit /></span>
    </>
  )
  if (href) {
    return <Link href={href} className="mono accent act-btn" aria-label="Editar">{inner}</Link>
  }
  return <button type="button" className="mono accent act-btn" aria-label="Editar" onClick={onClick}>{inner}</button>
}

export function DeleteAction({ onClick, disabled, title }: { onClick: () => void; disabled?: boolean; title?: string }) {
  return (
    <button
      type="button"
      className="mono act-btn act-danger"
      aria-label="Eliminar"
      title={title}
      onClick={onClick}
      data-disabled={disabled ? 'true' : undefined}
    >
      <span className="act-txt">ELIMINAR</span>
      <span className="act-ico" aria-hidden="true"><Icon.Trash /></span>
    </button>
  )
}
