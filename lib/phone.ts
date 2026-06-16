export function formatSvPhone(input: string): string {
  let digits = input.replace(/\D/g, '')
  if (digits.startsWith('503')) digits = digits.slice(3)
  digits = digits.slice(0, 8)
  const a = digits.slice(0, 4)
  const b = digits.slice(4, 8)
  return '+503 ' + (b ? `${a}-${b}` : a)
}

export function cleanPhone(input: string): string {
  return input.replace(/[^\d+]/g, '')
}

export function hasLocalNumber(input: string): boolean {
  return cleanPhone(input).replace(/^\+/, '').length > 3
}

export function isValidPhone(input: string): boolean {
  return /^\+?[0-9]{8,15}$/.test(cleanPhone(input))
}
