import { useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { PageHeaderBar } from '../../components/dashboard/PageHeaderBar'
import { ContactRow } from '../../components/contacts/ContactRow'
import { ContactDetailModal } from '../../components/contacts/ContactDetailModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Checkbox } from '../../components/ui/checkbox'
import { useContacts } from '../../hooks/useProjectsData'
import type { Contact } from '../../types/project'

type SortField = 'company' | 'contactName' | 'email' | 'status'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE_OPTIONS = [8, 10, 12] as const

const COLUMNS: { key: SortField; label: string }[] = [
  { key: 'company', label: 'Company' },
  { key: 'contactName', label: 'Contact' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
]

function buildPageList(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const result: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push('ellipsis')
    result.push(p)
    prev = p
  }
  return result
}

export function ContactsPage() {
  const { data: contacts = [], isLoading } = useContacts()

  const [searchQuery, setSearchQuery] = useState('')
  const [nicheFilter, setNicheFilter] = useState<string>('All niches')
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10)
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [viewingContactId, setViewingContactId] = useState<string | null>(null)

  const niches = useMemo(() => ['All niches', ...Array.from(new Set(contacts.map((c) => c.niche))).sort()], [contacts])

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return contacts.filter((c) => {
      if (nicheFilter !== 'All niches' && c.niche !== nicheFilter) return false
      if (!query) return true
      return `${c.company} ${c.contactName} ${c.email}`.toLowerCase().includes(query)
    })
  }, [contacts, nicheFilter, searchQuery])

  const sorted = useMemo(() => {
    if (!sortField) return filtered
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => a[sortField].localeCompare(b[sortField]) * dir)
  }, [filtered, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const pageList = buildPageList(currentPage, totalPages)

  const allOnPageSelected = pageItems.length > 0 && pageItems.every((c) => selectedIds.has(c.id))

  const viewingContact: Contact | undefined = contacts.find((c) => c.id === viewingContactId)

  function updateFilters(update: () => void) {
    update()
    setPage(1)
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function toggleSelectAllOnPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) {
        pageItems.forEach((c) => next.delete(c.id))
      } else {
        pageItems.forEach((c) => next.add(c.id))
      }
      return next
    })
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <PageHeaderBar
        title="Contacts"
        subtitle="Every client, vendor, and partner in one place."
        searchPlaceholder="Search for a contact..."
        searchValue={searchQuery}
        onSearchChange={(value) => updateFilters(() => setSearchQuery(value))}
      />

      <div className="rounded-2xl border border-line bg-white shadow-[0px_10px_40px_10px_rgba(152,150,163,0.16)]">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 text-base font-semibold text-slate-900 outline-none">
              {nicheFilter}
              <ChevronDown size={16} strokeWidth={2} className="text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuRadioGroup value={nicheFilter} onValueChange={(value) => updateFilters(() => setNicheFilter(value))}>
                {niches.map((niche) => (
                  <DropdownMenuRadioItem key={niche} value={niche} className="px-2 py-1.5">
                    {niche}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-xs text-slate-400">{sorted.length} contacts</span>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow className="border-b border-line text-left text-xs font-medium text-slate-400 hover:bg-transparent">
                <TableHead className="w-10 pl-4">
                  <Checkbox checked={allOnPageSelected} onCheckedChange={toggleSelectAllOnPage} aria-label="Select all" />
                </TableHead>
                {COLUMNS.map((col) => (
                  <TableHead key={col.key}>
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={`flex items-center gap-1 font-medium hover:text-slate-600 ${sortField === col.key ? 'text-slate-700' : ''}`}
                    >
                      {col.label}
                      <ArrowUpDown size={12} strokeWidth={2} />
                    </button>
                  </TableHead>
                ))}
                <TableHead className="font-medium">Niche</TableHead>
                <TableHead className="font-medium">Tags</TableHead>
                <TableHead className="font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  selected={selectedIds.has(contact.id)}
                  onToggleSelect={() => toggleSelectOne(contact.id)}
                  onView={() => setViewingContactId(contact.id)}
                />
              ))}
            </TableBody>
          </Table>
          {isLoading && <p className="py-10 text-center text-sm text-slate-400">Loading contacts…</p>}
          {!isLoading && pageItems.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">No contacts match your filters.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
          <div className="flex items-center gap-1.5">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => updateFilters(() => setPageSize(size))}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                  pageSize === size ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {size} rows
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            {pageList.map((p, i) =>
              p === 'ellipsis' ? (
                <span key={`e${i}`} className="px-1.5 text-xs text-slate-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium ${
                    p === currentPage ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {viewingContact && <ContactDetailModal contact={viewingContact} onClose={() => setViewingContactId(null)} />}
    </div>
  )
}
