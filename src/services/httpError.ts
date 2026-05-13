import axios from 'axios'

type ApiErrorResponse = {
  message?: unknown
  error?: unknown
  errors?: unknown
}

const GENERIC_MESSAGE_PATTERN = /^(dados .*invalidos?|erro interno|nao foi possivel)/i

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function toSentenceCase(value: string) {
  if (!value) {
    return value
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function humanizeFieldName(field: string) {
  const normalized = field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim()

  const acronyms = new Set(['CPF', 'CNPJ', 'CEP', 'CNH', 'RG', 'UF', 'ID', 'KM', 'PIX'])

  return normalized
    .split(/\s+/)
    .map((part) => {
      const upper = part.toUpperCase()
      if (acronyms.has(upper)) {
        return upper
      }

      return part.toLowerCase()
    })
    .join(' ')
}

function translateValidationTag(tag: string) {
  switch (tag) {
    case 'required':
      return 'e obrigatorio.'
    case 'email':
      return 'deve ser um e-mail valido.'
    case 'min':
      return 'esta abaixo do minimo permitido.'
    case 'max':
      return 'ultrapassa o maximo permitido.'
    case 'len':
      return 'deve ter o tamanho esperado.'
    case 'uuid':
      return 'deve ser um identificador valido.'
    case 'oneof':
      return 'possui um valor invalido.'
    default:
      return `falhou na validacao "${tag}".`
  }
}

function formatValidationDetails(raw: string) {
  const matches = Array.from(raw.matchAll(/Field validation for '([^']+)' failed on the '([^']+)' tag/g))

  if (matches.length === 0) {
    return ''
  }

  return matches
    .map(([, field, tag]) => `${toSentenceCase(humanizeFieldName(field))} ${translateValidationTag(tag)}`)
    .join(' ')
}

function readStringValue(value: unknown): string {
  if (typeof value === 'string') {
    return normalizeWhitespace(value)
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => readStringValue(item))
      .filter(Boolean)
      .join(' ')
      .trim()
  }

  if (value && typeof value === 'object') {
    const nestedValue = value as Record<string, unknown>

    return [
      readStringValue(nestedValue.message),
      readStringValue(nestedValue.error),
      readStringValue(nestedValue.errors),
    ]
      .filter(Boolean)
      .join(' ')
      .trim()
  }

  return ''
}

export function getHttpErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK') {
      return 'Nao foi possivel conectar ao backend.'
    }

    const responseData = (error.response?.data ?? {}) as ApiErrorResponse
    const message = readStringValue(responseData.message)
    const detail = readStringValue(responseData.error || responseData.errors)
    const parsedDetail = formatValidationDetails(detail)

    if (parsedDetail) {
      if (!message || GENERIC_MESSAGE_PATTERN.test(message)) {
        return parsedDetail
      }

      return `${message} ${parsedDetail}`.trim()
    }

    if (detail && (!message || GENERIC_MESSAGE_PATTERN.test(message))) {
      return detail
    }

    if (message) {
      return message
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  return fallbackMessage
}
