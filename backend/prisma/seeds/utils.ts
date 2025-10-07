import { v4 as uuidv4 } from 'uuid'

/**
 * Utility functions per i seed
 */

export function generateId(): string {
  return uuidv4()
}

export function getCurrentTimestamp(): Date {
  return new Date()
}

export function extractVariablesFromTemplate(template: string): string[] {
  const matches = template.match(/{{(\w+)}}/g) || []
  return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))]
}

export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '') // Rimuovi caratteri speciali
    .trim()
    .replace(/\s+/g, '-') // Sostituisci spazi con trattini
    .replace(/-+/g, '-') // Rimuovi trattini multipli
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: currency
  }).format(amount / 100) // Converte da centesimi
}

export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export function generateRandomEmail(domain: string = 'example.com'): string {
  const names = ['mario', 'giuseppe', 'francesco', 'antonio', 'alessandro', 'andrea', 'luigi', 'marco', 'carlo', 'michele']
  const surnames = ['rossi', 'russo', 'ferrari', 'esposito', 'bianchi', 'romano', 'colombo', 'ricci', 'marino', 'greco']
  
  const name = randomChoice(names)
  const surname = randomChoice(surnames)
  const number = randomBetween(1, 999)
  
  return `${name}.${surname}${number}@${domain}`
}

export function generateRandomPhoneNumber(): string {
  const prefixes = ['320', '328', '329', '330', '331', '333', '334', '335', '336', '337', '338', '339']
  const prefix = randomChoice(prefixes)
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0')
  return `+39 ${prefix} ${number}`
}

export function generateRandomItalianAddress() {
  const streets = [
    'Via Roma', 'Via Milano', 'Via Garibaldi', 'Via Venezia', 'Via Torino',
    'Corso Italia', 'Corso Vittorio Emanuele', 'Corso Buenos Aires',
    'Piazza Duomo', 'Piazza Repubblica', 'Piazza San Marco',
    'Viale dei Pini', 'Viale Europa', 'Viale America'
  ]
  
  const cities = [
    { name: 'Roma', province: 'RM', postalCode: '00100' },
    { name: 'Milano', province: 'MI', postalCode: '20100' },
    { name: 'Napoli', province: 'NA', postalCode: '80100' },
    { name: 'Torino', province: 'TO', postalCode: '10100' },
    { name: 'Palermo', province: 'PA', postalCode: '90100' },
    { name: 'Genova', province: 'GE', postalCode: '16100' },
    { name: 'Bologna', province: 'BO', postalCode: '40100' },
    { name: 'Firenze', province: 'FI', postalCode: '50100' },
    { name: 'Catania', province: 'CT', postalCode: '95100' },
    { name: 'Venezia', province: 'VE', postalCode: '30100' }
  ]
  
  const street = randomChoice(streets)
  const number = randomBetween(1, 200)
  const city = randomChoice(cities)
  
  return {
    address: `${street} ${number}`,
    city: city.name,
    province: city.province,
    postalCode: city.postalCode
  }
}

export function generateRandomPassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+39\s\d{3}\s\d{7}$/
  return phoneRegex.test(phone)
}

export const ITALIAN_PROVINCES = [
  'AG', 'AL', 'AN', 'AO', 'AR', 'AP', 'AT', 'AV', 'BA', 'BT', 'BL', 'BN', 'BG', 'BI', 'BO', 'BZ',
  'BS', 'BR', 'CA', 'CL', 'CB', 'CI', 'CE', 'CT', 'CZ', 'CH', 'CO', 'CS', 'CR', 'KR', 'CN', 'EN',
  'FM', 'FE', 'FI', 'FG', 'FC', 'FR', 'GE', 'GO', 'GR', 'IM', 'IS', 'SP', 'AQ', 'LT', 'LE', 'LC',
  'LI', 'LO', 'LU', 'MC', 'MN', 'MS', 'MT', 'ME', 'MI', 'MO', 'MB', 'NA', 'NO', 'NU', 'OG', 'OT',
  'OR', 'PD', 'PA', 'PR', 'PV', 'PG', 'PU', 'PE', 'PC', 'PI', 'PT', 'PN', 'PZ', 'PO', 'RG', 'RA',
  'RC', 'RE', 'RI', 'RN', 'RM', 'RO', 'SA', 'VS', 'SS', 'SV', 'SI', 'SR', 'SO', 'TA', 'TE', 'TR',
  'TO', 'TP', 'TN', 'TV', 'TS', 'UD', 'VA', 'VE', 'VB', 'VC', 'VR', 'VV', 'VI', 'VT'
]

export function logStep(step: string, description: string) {
  console.log(`\n${'='.repeat(50)}`)
  console.log(`📋 ${step}: ${description}`)
  console.log('='.repeat(50))
}

export function logSuccess(message: string) {
  console.log(`✅ ${message}`)
}

export function logError(message: string, error?: any) {
  console.log(`❌ ${message}`)
  if (error) {
    console.error(error)
  }
}

export function logInfo(message: string) {
  console.log(`ℹ️  ${message}`)
}

export function createProgressBar(current: number, total: number, width: number = 20): string {
  const percentage = Math.round((current / total) * 100)
  const filled = Math.round((current / total) * width)
  const empty = width - filled
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty)
  return `[${bar}] ${percentage}% (${current}/${total})`
}
