// Métodos de pago por registro (OCP): el checkout renderiza el formulario dinámicamente
import type { ComponentType } from 'react'

export interface PaymentMethod {
  id: string
  label: string
  desc: string
  Form: ComponentType
  extraFee?: (subtotal: number) => number
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="label">{label}</div>
      <input className="input" defaultValue={value} />
    </div>
  )
}

function CardForm() {
  return (
    <div>
      <Field label="Número de tarjeta" value="4242 4242 4242 4242" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Vencimiento" value="04 / 28" />
        <Field label="CVC" value="•••" />
      </div>
      <Field label="Nombre del titular" value="MARIO SANDOVAL" />
    </div>
  )
}

function BankForm() {
  return (
    <div className="card" style={{ padding: 20, background: 'var(--bg-0)' }}>
      <div className="mono mute" style={{ marginBottom: 12 }}>TRANSFERIR A</div>
      <div style={{ fontFamily: 'var(--font-mono)', lineHeight: 2 }}>
        <div>BENEFICIARIO: K LAB COMERCIO S.A.</div>
        <div>CUENTA: HN44 BAC 0001 4429 0011</div>
        <div>SWIFT: BAMCHNTGXXX</div>
        <div>REFERENCIA: KL-48217</div>
      </div>
    </div>
  )
}

function CodForm() {
  return (
    <div className="card" style={{ padding: 20, background: 'var(--bg-0)' }}>
      <div className="display" style={{ fontSize: 14 }}>Paga en efectivo al recibir.</div>
      <div className="mute" style={{ marginTop: 8, fontSize: 13 }}>
        Disponible dentro de San Salvador y zonas aledañas. Se requiere verificación de identidad
        al momento de la entrega. El sello de autenticación debe estar intacto al recibir.
      </div>
    </div>
  )
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'card', label: 'Tarjeta', desc: 'Visa, Mastercard, Amex', Form: CardForm },
  { id: 'bank', label: 'Transferencia', desc: 'SWIFT · 1 día hábil', Form: BankForm },
  { id: 'cod', label: 'Contra entrega', desc: 'Solo El Salvador · +$4', Form: CodForm, extraFee: () => 4 },
]
