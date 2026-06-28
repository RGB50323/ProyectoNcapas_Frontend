'use client'

import CrudResource from '@/components/admin/CrudResource'
import { admin, type AdminShipping } from '@/lib/admin'

export default function AdminShippingPage() {
  return (
    <CrudResource<AdminShipping>
      eyebrow="◆ VENTAS"
      title="MÉTODOS DE ENVÍO"
      noun="método"
      getId={(s) => s.id}
      rowLabel={(s) => s.name}
      load={admin.listShipping}
      create={admin.createShipping}
      update={admin.updateShipping}
      remove={admin.deleteShipping}
      columns={[
        { header: 'Nombre', cell: (s) => s.name },
        { header: 'Tarifa', cell: (s) => <span className="mono">${s.fee}</span> },
        { header: 'Entrega', cell: (s) => <span className="mono mute">{s.eta}</span> },
        { header: 'Activo', cell: (s) => (s.active ? <span className="pill green">SÍ</span> : <span className="pill gray">NO</span>) },
      ]}
      fields={[
        { name: 'name', label: 'Nombre', required: true },
        { name: 'fee', label: 'Tarifa', type: 'number', step: '0.01', required: true },
        { name: 'eta', label: 'Tiempo estimado', required: true, placeholder: '3–5 días' },
        { name: 'active', label: 'Activo', type: 'checkbox' },
      ]}
    />
  )
}
