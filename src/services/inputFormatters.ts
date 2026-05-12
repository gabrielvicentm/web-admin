function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

export function formatCpfInput(value: string) {
  const digits = onlyDigits(value).slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function formatCpfCnpjInput(value: string) {
  const digits = onlyDigits(value).slice(0, 14)

  if (digits.length <= 11) {
    return formatCpfInput(digits)
  }

  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

export function formatPhoneInput(value: string) {
  const digits = onlyDigits(value).slice(0, 11)

  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function formatCepInput(value: string) {
  const digits = onlyDigits(value).slice(0, 8)

  if (digits.length <= 5) {
    return digits
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function formatPlateInput(value: string) {
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)

  if (normalized.length <= 3) {
    return normalized
  }

  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`
}

export function formatRenavamInput(value: string) {
  return onlyDigits(value).slice(0, 11)
}

export function formatCnhInput(value: string) {
  return onlyDigits(value).slice(0, 11)
}
