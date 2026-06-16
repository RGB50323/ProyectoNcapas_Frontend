'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import CrudResource from '@/components/admin/CrudResource'
import { admin, type AdminCoupon, type DiscountTypeInfo } from '@/lib/admin'

export default function AdminCouponsPage() {
  const { session } = useAuth()
  const [types, setTypes] = useState<DiscountTypeInfo[]>([])

  useEffect(() => {
    if (session) admin.listDiscountTypes(session).then(setTypes).catch(() => setTypes([]))
  }, [session])

  const usesValue = (t: string) => types.find((x) => x.value === t)?.usesValue ?? true
  const labelFor = (t: string) => types.find((x) => x.value === t)?.label ?? t

  return (
    <CrudResource<AdminCoupon>
      eyebrow="◆ VENTAS"
      title="CUPONES"
      noun="cupón"
      getId={(c) => c.id}
      rowLabel={(c) => c.code}
      load={admin.listCoupons}
      create={admin.createCoupon}
      update={admin.updateCoupon}
      remove={admin.deleteCoupon}
      columns={[
        { header: 'Código', cell: (c) => <span className="mono">{c.code}</span> },
        { header: 'Etiqueta', cell: (c) => c.label },
        { header: 'Tipo', cell: (c) => labelFor(c.type) },
        { header: 'Valor', cell: (c) => (usesValue(c.type) ? <span className="mono">{c.value}</span> : '—') },
        { header: 'Usos', cell: (c) => <span className="mono mute">{c.usesCount}{c.maxUses ? ` / ${c.maxUses}` : ''}</span> },
        { header: 'Activo', cell: (c) => (c.active ? <span className="pill green">SÍ</span> : <span className="pill gray">NO</span>) },
      ]}
      fields={[
        { name: 'code', label: 'Código', required: true, placeholder: 'KLAB10' },
        { name: 'label', label: 'Etiqueta', required: true },
        { name: 'type', label: 'Tipo de descuento', type: 'select', required: true, options: types.map((t) => ({ value: t.value, label: t.label })) },
        { name: 'value', label: 'Valor', type: 'number', step: '0.01', required: true, hidden: (f) => !usesValue(f.type) },
        { name: 'minOrderAmount', label: 'Monto mínimo (opcional)', type: 'number', step: '0.01' },
        { name: 'maxUses', label: 'Usos máximos (opcional)', type: 'number', step: '1' },
        { name: 'expiresAt', label: 'Expira (opcional)', type: 'datetime' },
        { name: 'active', label: 'Activo', type: 'checkbox' },
      ]}
    />
  )
}
