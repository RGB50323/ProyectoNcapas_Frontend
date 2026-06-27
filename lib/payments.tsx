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

    // Solo números, máx 16 dígitos
    const handleNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 16)
        const formatted = digits.replace(/(.{4})/g, '$1 ').trim()
        onCardChange?.({ ...data, number: formatted })
    }

    // Solo números, formato automático MM / AA
    const handleExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
        let formatted = digits
        if (digits.length >= 3) {
            formatted = digits.slice(0, 2) + ' / ' + digits.slice(2)
        }
        onCardChange?.({ ...data, expiry: formatted })
    }

    // Solo números, máx 4 dígitos
    const handleCvc = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
        onCardChange?.({ ...data, cvc: digits })
    }

    return (
        <div>
            <Field label="Número de tarjeta">
                <input
                    className="input"
                    placeholder="1234 5678 9012 3456"
                    value={data.number}
                    onChange={handleNumber}
                    inputMode="numeric"
                    maxLength={19}
                />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Vencimiento">
                    <input
                        className="input"
                        placeholder="MM / AA"
                        value={data.expiry}
                        onChange={handleExpiry}
                        inputMode="numeric"
                        maxLength={7}
                    />
                </Field>
                <Field label="CVC">
                    <input
                        className="input"
                        placeholder="•••"
                        value={data.cvc}
                        onChange={handleCvc}
                        inputMode="numeric"
                        maxLength={4}
                    />
                </Field>
            </div>
            <Field label="Nombre del titular">
                <input
                    className="input"
                    placeholder="Como aparece en la tarjeta"
                    value={data.name}
                    onChange={(e) => onCardChange?.({ ...data, name: e.target.value })}
                />
            </Field>
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
    { id: 'cod', label: 'Contra entrega', desc: 'Solo El Salvador · +$4', Form: CodForm, extraFee: () => 4 },
]
