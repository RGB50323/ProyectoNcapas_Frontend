// Métodos de pago por registro (OCP): el checkout renderiza el formulario dinámicamente
import type { ComponentType } from 'react'

export interface CardData {
    number: string
    expiry: string
    cvc: string
    name: string
}

export interface PaymentMethod {
    id: string
    label: string
    desc: string
    Form: ComponentType<{ cardData?: CardData; onCardChange?: (d: CardData) => void }>
    extraFee?: (subtotal: number) => number
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 12 }}>
            <div className="label">{label}</div>
            {children}
        </div>
    )
}

function CardForm({ cardData, onCardChange }: {
    cardData?: CardData
    onCardChange?: (d: CardData) => void
}) {
    const data = cardData ?? { number: '', expiry: '', cvc: '', name: '' }
    const update = (field: keyof CardData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        onCardChange?.({ ...data, [field]: e.target.value })
    }

    return (
        <div>
            <Field label="Número de tarjeta">
                <input
                    className="input"
                    placeholder="1234 5678 9012 3456"
                    value={data.number}
                    onChange={update('number')}
                    maxLength={19}
                />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Vencimiento">
                    <input
                        className="input"
                        placeholder="MM / AA"
                        value={data.expiry}
                        onChange={update('expiry')}
                        maxLength={7}
                    />
                </Field>
                <Field label="CVC">
                    <input
                        className="input"
                        placeholder="•••"
                        value={data.cvc}
                        onChange={update('cvc')}
                        maxLength={4}
                    />
                </Field>
            </div>
            <Field label="Nombre del titular">
                <input
                    className="input"
                    placeholder="Como aparece en la tarjeta"
                    value={data.name}
                    onChange={update('name')}
                />
            </Field>
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
