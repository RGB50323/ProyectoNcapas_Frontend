const SV_TZ = 'America/El_Salvador'

function hasOffset(value: string): boolean {
  return /[zZ]$|[+-]\d{2}:?\d{2}$/.test(value)
}

export function formatDateTimeSV(value: string | null | undefined): string {
  if (!value) return '—'
  const iso = hasOffset(value) ? value : value + 'Z'
  return new Date(iso).toLocaleString('es-SV', {
    timeZone: SV_TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateSV(value: string | null | undefined, long = false): string {
  if (!value) return '—'
  const month = long ? 'long' : 'short'
  if (value.length <= 10) {
    return new Date(value + 'T00:00:00Z').toLocaleDateString('es-SV', {
      timeZone: 'UTC',
      day: 'numeric',
      month,
      year: 'numeric',
    })
  }
  const iso = hasOffset(value) ? value : value + 'Z'
  return new Date(iso).toLocaleDateString('es-SV', {
    timeZone: SV_TZ,
    day: 'numeric',
    month,
    year: 'numeric',
  })
}

const MONTHS_MONO = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

export function formatNaiveMono(value: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(value ?? ''))
  if (!m) return '—'
  return `${m[3]} ${MONTHS_MONO[Number(m[2]) - 1]} ${m[1]} · ${m[4]}:${m[5]}`
}
