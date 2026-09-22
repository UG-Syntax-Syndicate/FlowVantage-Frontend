/**
 * Parses contact export files (Outlook/Google-style CSV, Dutch CRM CSV
 * variants, vCard 2.1/3.0) into a common shape for the contacts import
 * feature. Hand-written rather than a dependency: every format here is
 * simple enough (delimited text or a line-based vCard block) that a small
 * parser is both sufficient and easier to adapt to a new export's quirks
 * than a general-purpose library would be.
 */

export interface ParsedContact {
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  role: string
  notes: string
}

/**
 * Fields an AI provider is allowed to map a CSV header to - mirrors the
 * backend's TARGET_FIELDS (src/modules/ai/services/csvMapping.service.js).
 */
export type MappableField = 'firstName' | 'lastName' | 'email' | 'phone' | 'company' | 'role' | 'notes'

export interface HeaderMappingSuggestion {
  header: string
  mappedField: MappableField | null
  confidence?: number
}

/**
 * RFC4180-ish delimited-text parser: handles a configurable delimiter and
 * double-quoted fields (including an escaped `""` inside a quoted field and
 * a delimiter/newline embedded inside quotes). The naive `text.split(',')`
 * approach used elsewhere in this codebase (src/lib/documents.ts, for a
 * generic document preview) breaks on exactly the quoted-with-commas rows
 * some of these exports contain.
 */
export function parseDelimitedText(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    pushField()
    rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      pushField()
    } else if (char === '\r') {
      // Skip - the following \n (or end of field) closes the row.
    } else if (char === '\n') {
      pushRow()
    } else {
      field += char
    }
  }

  // Final row, if the file doesn't end with a newline.
  if (field.length > 0 || row.length > 0) {
    pushRow()
  }

  return rows.filter((r) => r.some((cell) => cell.trim().length > 0))
}

/** Whichever of `,`/`;` appears more often in the header line wins. */
function detectDelimiter(headerLine: string): string {
  const commaCount = (headerLine.match(/,/g) || []).length
  const semicolonCount = (headerLine.match(/;/g) || []).length
  return semicolonCount > commaCount ? ';' : ','
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase()
}

/**
 * First header (case-insensitive) matching any of `candidates`, or -1.
 * Tries an exact match first (e.g. "Notes"), then falls back to a substring
 * match (e.g. "Additional Notes", "Notes:") so real-world export headers
 * that aren't byte-identical to a candidate still get picked up.
 */
function findColumn(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader)
  for (const candidate of candidates) {
    const index = normalized.indexOf(candidate)
    if (index !== -1) return index
  }
  for (const candidate of candidates) {
    const index = normalized.findIndex((header) => header.includes(candidate))
    if (index !== -1) return index
  }
  return -1
}

function cell(row: string[], index: number): string {
  return index === -1 ? '' : (row[index] ?? '').trim()
}

/**
 * Splits a combined display name into first/last. Handles the
 * "Lastname, I. (Firstname)" pattern one of the sample Dutch exports uses
 * (the parenthesized name is the actual first name; anything before the
 * comma is the last name), then falls back to a plain first-space split.
 */
function splitDisplayName(name: string): { firstName: string; lastName: string } {
  const trimmed = name.trim()
  if (!trimmed) return { firstName: '', lastName: '' }

  const parenMatch = trimmed.match(/\(([^)]+)\)/)
  const commaIndex = trimmed.indexOf(',')
  if (parenMatch && commaIndex !== -1) {
    return {
      firstName: parenMatch[1].trim(),
      lastName: trimmed.slice(0, commaIndex).trim(),
    }
  }

  if (commaIndex !== -1) {
    return {
      lastName: trimmed.slice(0, commaIndex).trim(),
      firstName: trimmed.slice(commaIndex + 1).replace(/\./g, '').trim(),
    }
  }

  const spaceIndex = trimmed.lastIndexOf(' ')
  if (spaceIndex === -1) {
    return { firstName: trimmed, lastName: '' }
  }
  return { firstName: trimmed.slice(0, spaceIndex).trim(), lastName: trimmed.slice(spaceIndex + 1).trim() }
}

const ALIAS_CANDIDATES: Record<Exclude<MappableField, 'firstName' | 'lastName'> | 'combinedName', string[]> = {
  combinedName: ['naam', 'name', 'full name', 'display name'],
  email: ['e-mail address', 'email', 'e-mail', 'e-mailadres', 'emailadres'],
  phone: [
    'mobile phone',
    'business phone',
    'home phone',
    'primary phone',
    'phone',
    'telefoonnummer',
    'telefoon',
    'mobiel',
    'mobiele',
  ],
  company: ['company', 'bedrijf', 'van'],
  role: ['job title', 'title', 'functie', 'role'],
  notes: ['notes', 'note', 'opmerkingen', 'comments', 'comment', 'remarks'],
}

/** Splits a CSV's first line into raw headers and the parsed data rows, without resolving column mapping yet. */
export function readCsvHeadersAndRows(text: string): { headers: string[]; rows: string[][] } {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  const delimiter = detectDelimiter(firstLine)
  const parsed = parseDelimitedText(text, delimiter)
  if (parsed.length === 0) return { headers: [], rows: [] }
  return { headers: parsed[0], rows: parsed.slice(1) }
}

/**
 * Resolves which column index each target field should read from. Prefers
 * a validated AI-suggested header (exact header match, known field) when
 * given one; falls back to the hardcoded alias list otherwise - so import
 * keeps working even when the AI call fails or is skipped entirely.
 */
function resolveColumnMapping(headers: string[], aiSuggestions?: HeaderMappingSuggestion[]) {
  const normalizedHeaders = headers.map(normalizeHeader)
  const aiFieldToColumn = new Map<MappableField, number>()
  if (aiSuggestions) {
    for (const suggestion of aiSuggestions) {
      if (!suggestion.mappedField) continue
      // Normalized comparison, not a raw case-sensitive indexOf - the model
      // can retrim/re-case a header when echoing it back in JSON.
      const index = normalizedHeaders.indexOf(normalizeHeader(suggestion.header))
      if (index !== -1 && !aiFieldToColumn.has(suggestion.mappedField)) {
        aiFieldToColumn.set(suggestion.mappedField, index)
      }
    }
  }

  const columnFor = (field: MappableField, fallbackCandidates: string[]): number =>
    aiFieldToColumn.get(field) ?? findColumn(headers, fallbackCandidates)

  return {
    firstNameCol: columnFor('firstName', ['first name', 'voornaam']),
    lastNameCol: columnFor('lastName', ['last name', 'achternaam']),
    combinedNameCol: findColumn(headers, ALIAS_CANDIDATES.combinedName),
    emailCol: columnFor('email', ALIAS_CANDIDATES.email),
    phoneCol: columnFor('phone', ALIAS_CANDIDATES.phone),
    companyCol: columnFor('company', ALIAS_CANDIDATES.company),
    roleCol: columnFor('role', ALIAS_CANDIDATES.role),
    notesCol: columnFor('notes', ALIAS_CANDIDATES.notes),
  }
}

/**
 * Parses a CSV export into ParsedContact rows. Column names are matched
 * case-insensitively against every alias this function knows (or against an
 * optional AI-suggested mapping, preferred when present), so an
 * Outlook-style export (separate First/Last Name columns) and a Dutch CRM
 * export (a single combined name column, different header language) both
 * resolve to the same shape.
 */
export function parseContactsCsv(text: string, aiSuggestions?: HeaderMappingSuggestion[]): ParsedContact[] {
  const { headers, rows: dataRows } = readCsvHeadersAndRows(text)
  if (headers.length === 0) return []

  const { firstNameCol, lastNameCol, combinedNameCol, emailCol, phoneCol, companyCol, roleCol, notesCol } =
    resolveColumnMapping(headers, aiSuggestions)

  return dataRows.map((row) => {
    let firstName = cell(row, firstNameCol)
    let lastName = cell(row, lastNameCol)

    if (!firstName && !lastName && combinedNameCol !== -1) {
      const split = splitDisplayName(cell(row, combinedNameCol))
      firstName = split.firstName
      lastName = split.lastName
    }

    return {
      firstName,
      lastName,
      email: cell(row, emailCol),
      phone: cell(row, phoneCol),
      company: cell(row, companyCol),
      role: cell(row, roleCol),
      notes: cell(row, notesCol),
    }
  })
}

/**
 * Parses a vCard 2.1/3.0 file (one or more BEGIN:VCARD...END:VCARD blocks)
 * into ParsedContact rows. Prefers the structured N field
 * (family;given;additional;prefix;suffix) over FN (the free-text formatted
 * name) since it's unambiguous about which part is the first/last name;
 * falls back to splitting FN when N is missing or empty.
 */
export function parseContactsVcf(text: string): ParsedContact[] {
  const blocks = text.split(/BEGIN:VCARD/i).slice(1)

  return blocks.map((block) => {
    const lines = block.split(/\r?\n/).map((line) => line.trim())

    let familyName = ''
    let givenName = ''
    let formattedName = ''
    let email = ''
    let phone = ''
    let company = ''
    let role = ''
    let notes = ''

    for (const line of lines) {
      const colonIndex = line.indexOf(':')
      if (colonIndex === -1) continue

      const rawKey = line.slice(0, colonIndex)
      const value = line.slice(colonIndex + 1).trim()
      const key = rawKey.split(';')[0].toUpperCase()

      if (key === 'N') {
        const parts = value.split(';')
        familyName = (parts[0] || '').trim()
        givenName = (parts[1] || '').trim()
      } else if (key === 'FN') {
        formattedName = value
      } else if (key === 'EMAIL' && !email) {
        email = value
      } else if (key === 'TEL' && !phone) {
        phone = value
      } else if (key === 'ORG' && !company) {
        company = value.split(';')[0]
      } else if (key === 'TITLE' && !role) {
        role = value
      } else if (key === 'NOTE' && !notes) {
        notes = value.replace(/\\n/g, '\n')
      }
    }

    let firstName = givenName
    let lastName = familyName
    if (!firstName && !lastName && formattedName) {
      const split = splitDisplayName(formattedName)
      firstName = split.firstName
      lastName = split.lastName
    }

    return { firstName, lastName, email, phone, company, role, notes }
  })
}

export function isVcfFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.vcf') || file.type === 'text/vcard' || file.type === 'text/x-vcard'
}

/**
 * A row with no name at all (a phone's address-book export routinely has
 * entries saved as just a number, with no name ever typed in) would
 * otherwise have to be dropped - first_name is required to create a
 * contact. Falling back to the email's local part, then the phone number
 * itself, rescues those instead of silently discarding them.
 */
function fallbackName(contact: ParsedContact): string {
  if (contact.email) return contact.email.split('@')[0]
  return contact.phone
}

/** Applies the no-name fallback and drops rows that are still unusable. Shared by parseContactFile and any caller that already has raw text (e.g. an AI-assisted mapping). */
export function finalizeParsedContacts(parsed: ParsedContact[]): ParsedContact[] {
  return parsed
    .map((contact) =>
      contact.firstName || contact.lastName ? contact : { ...contact, firstName: fallbackName(contact) },
    )
    .filter((contact) => contact.firstName || contact.lastName)
}

/**
 * Reads and parses a contacts export file, auto-detecting CSV vs vCard from
 * its extension/type. `aiSuggestions` (CSV only) is an optional AI-derived
 * header mapping, preferred over the hardcoded alias list when given.
 */
export async function parseContactFile(file: File, aiSuggestions?: HeaderMappingSuggestion[]): Promise<ParsedContact[]> {
  const text = await file.text()
  const parsed = isVcfFile(file) ? parseContactsVcf(text) : parseContactsCsv(text, aiSuggestions)
  return finalizeParsedContacts(parsed)
}
