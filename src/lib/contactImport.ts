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

/** First header (case-insensitive) matching any of `candidates`, or -1. */
function findColumn(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader)
  for (const candidate of candidates) {
    const index = normalized.indexOf(candidate)
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

/**
 * Parses a CSV export into ParsedContact rows. Column names are matched
 * case-insensitively against every alias this function knows, so an
 * Outlook-style export (separate First/Last Name columns) and a Dutch CRM
 * export (a single combined name column, different header language) both
 * resolve to the same shape.
 */
export function parseContactsCsv(text: string): ParsedContact[] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  const delimiter = detectDelimiter(firstLine)
  const rows = parseDelimitedText(text, delimiter)
  if (rows.length === 0) return []

  const headers = rows[0]
  const dataRows = rows.slice(1)

  const firstNameCol = findColumn(headers, ['first name', 'voornaam'])
  const lastNameCol = findColumn(headers, ['last name', 'achternaam'])
  const combinedNameCol = findColumn(headers, ['naam', 'name', 'full name', 'display name'])
  const emailCol = findColumn(headers, ['e-mail address', 'email', 'e-mail', 'e-mailadres', 'emailadres'])
  const phoneCol = findColumn(headers, [
    'mobile phone',
    'business phone',
    'home phone',
    'primary phone',
    'phone',
    'telefoonnummer',
    'telefoon',
    'mobiel',
    'mobiele',
  ])
  const companyCol = findColumn(headers, ['company', 'bedrijf', 'van'])
  const roleCol = findColumn(headers, ['job title', 'title', 'functie', 'role'])

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
      }
    }

    let firstName = givenName
    let lastName = familyName
    if (!firstName && !lastName && formattedName) {
      const split = splitDisplayName(formattedName)
      firstName = split.firstName
      lastName = split.lastName
    }

    return { firstName, lastName, email, phone, company, role }
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

/** Reads and parses a contacts export file, auto-detecting CSV vs vCard from its extension/type. */
export async function parseContactFile(file: File): Promise<ParsedContact[]> {
  const text = await file.text()
  const parsed = isVcfFile(file) ? parseContactsVcf(text) : parseContactsCsv(text)

  return parsed
    .map((contact) =>
      contact.firstName || contact.lastName ? contact : { ...contact, firstName: fallbackName(contact) },
    )
    .filter((contact) => contact.firstName || contact.lastName)
}
