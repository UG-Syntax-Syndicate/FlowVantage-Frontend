import { useMemo, useState } from 'react'
import { ChevronDown, ArrowUpDown, Trash2, Upload, UserPlus, X } from 'lucide-react'
import { PageHeaderBar } from '../../components/dashboard/PageHeaderBar'
import { ContactRow } from '../../components/contacts/ContactRow'
import { ContactDetailModal } from '../../components/contacts/ContactDetailModal'
import { ImportContactsModal } from '../../components/contacts/ImportContactsModal'
import { AddContactModal } from '../../components/contacts/AddContactModal'
import { ComposeMailModal } from '../../components/email/ComposeMailModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Checkbox } from '../../components/ui/checkbox'
import { Button } from '../../components/ui/button'
import { TableRowsSkeleton } from '../../components/common/skeletons/TableRowsSkeleton'
import { Pagination, type PageSize } from '../../components/common/Pagination'
import { ALL_PROJECTS, ProjectFilterSelect } from '../../components/common/ProjectFilterSelect'
import { useBulkDeleteContacts, useContacts, useDeleteContact } from '../../hooks/useProjectsData'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { showToast } from '../../lib/toast'
import type { Contact } from '../../types/project'

type SortField = 'company' | 'contactName' | 'phone' | 'email' | 'status'
type SortDir = 'asc' | 'desc'

const COLUMNS: { key: SortField; label: string }[] = [
  { key: 'company', label: 'Company' },
  { key: 'contactName', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
]

export function ContactsPage() {
  const { data: contacts = [], isLoading } = useContacts()
  const deleteContact = useDeleteContact()
  const bulkDeleteContacts = useBulkDeleteContacts()

  const [searchQuery, setSearchQuery] = useState('')
  const [nicheFilter, setNicheFilter] = useState<string>('All niches')
  const [projectFilter, setProjectFilter] = useState<string>(ALL_PROJECTS)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [viewingContactId, setViewingContactId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | 'new' | null>(null)
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)
  const [emailingContact, setEmailingContact] = useState<Contact | null>(null)
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false)

  const niches = useMemo(() => ['All niches', ...Array.from(new Set(contacts.map((c) => c.niche))).sort()], [contacts])

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return contacts.filter((c) => {
      if (nicheFilter !== 'All niches' && c.niche !== nicheFilter) return false
      if (projectFilter !== ALL_PROJECTS && c.projectId !== projectFilter) return false
      if (!query) return true
      return `${c.company} ${c.contactName} ${c.email}`.toLowerCase().includes(query)
    })
  }, [contacts, nicheFilter, projectFilter, searchQuery])

  const sorted = useMemo(() => {
    if (!sortField) return filtered
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => a[sortField].localeCompare(b[sortField]) * dir)
  }, [filtered, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setEditingContact('new')}>
              <UserPlus size={14} strokeWidth={2} />
              Add Contact
            </Button>
            <Button type="button" size="sm" onClick={() => setImporting(true)}>
              <Upload size={14} strokeWidth={2} />
              Import Contacts
            </Button>
          </div>
        }
      />

      <div className="rounded-2xl border border-line bg-white shadow-[0px_10px_40px_10px_rgba(152,150,163,0.16)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex items-center gap-4">
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

            <ProjectFilterSelect
              value={projectFilter}
              onChange={(value) => updateFilters(() => setProjectFilter(value))}
            />
          </div>
          <span className="text-xs text-slate-400">{sorted.length} contacts</span>
        </div>

        {/* The checkboxes had no action behind them - selecting rows did
            nothing at all. This is where a selection becomes useful. */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-line bg-accent-50/60 px-5 py-3">
            <span className="text-sm font-medium text-slate-700">
              {selectedIds.size} selected
            </span>
            <button
              type="button"
              onClick={() => setConfirmingBulkDelete(true)}
              className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
            >
              <Trash2 size={13} strokeWidth={2} />
              Delete {selectedIds.size === 1 ? 'contact' : `${selectedIds.size} contacts`}
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              <X size={13} strokeWidth={2} />
              Clear selection
            </button>
          </div>
        )}

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
              {isLoading ? (
                <TableRowsSkeleton rows={8} columns={9} />
              ) : (
                pageItems.map((contact) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    selected={selectedIds.has(contact.id)}
                    onToggleSelect={() => toggleSelectOne(contact.id)}
                    onView={() => setViewingContactId(contact.id)}
                    onEdit={() => setEditingContact(contact)}
                    onDelete={() => setDeletingContact(contact)}
                    onEmail={() => setEmailingContact(contact)}
                  />
                ))
              )}
            </TableBody>
          </Table>
          {!isLoading && pageItems.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">No contacts match your filters.</p>
          )}
        </div>

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => updateFilters(() => setPageSize(size))}
        />
      </div>

      {viewingContact && (
        <ContactDetailModal
          contact={viewingContact}
          onClose={() => setViewingContactId(null)}
          onEdit={() => {
            setEditingContact(viewingContact)
            setViewingContactId(null)
          }}
          onDelete={() => {
            setDeletingContact(viewingContact)
            setViewingContactId(null)
          }}
          onEmail={() => {
            setEmailingContact(viewingContact)
            setViewingContactId(null)
          }}
        />
      )}
      {importing && <ImportContactsModal onClose={() => setImporting(false)} />}
      {emailingContact && (
        <ComposeMailModal
          defaultTo={emailingContact.email}
          contactName={emailingContact.contactName}
          onClose={() => setEmailingContact(null)}
        />
      )}
      {editingContact && (
        <AddContactModal
          contact={editingContact === 'new' ? undefined : editingContact}
          onClose={() => setEditingContact(null)}
        />
      )}

      <ConfirmDialog
        open={confirmingBulkDelete}
        title={`Delete ${selectedIds.size} ${selectedIds.size === 1 ? 'contact' : 'contacts'}?`}
        description={`${selectedIds.size === 1 ? 'This contact' : 'These contacts'} will be removed from your workspace. This cannot be undone.`}
        confirmLabel={`Delete ${selectedIds.size === 1 ? 'contact' : 'contacts'}`}
        danger
        loading={bulkDeleteContacts.isPending}
        onCancel={() => setConfirmingBulkDelete(false)}
        onConfirm={async () => {
          try {
            const result = await bulkDeleteContacts.mutateAsync([...selectedIds])
            // The server skips ids that were not the caller's or had already
            // gone, so report what actually happened rather than assuming.
            showToast(
              'success',
              `${result.deleted} ${result.deleted === 1 ? 'contact' : 'contacts'} deleted`,
              result.skipped > 0
                ? `${result.skipped} could not be deleted — they may have been removed already.`
                : undefined,
            )
            setSelectedIds(new Set())
            setConfirmingBulkDelete(false)
          } catch {
            showToast('error', 'Could not delete these contacts')
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingContact)}
        title="Delete this contact?"
        description={
          deletingContact
            ? `${deletingContact.contactName} will be removed from your contacts. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete contact"
        danger
        loading={deleteContact.isPending}
        onCancel={() => setDeletingContact(null)}
        onConfirm={async () => {
          if (!deletingContact) return
          try {
            await deleteContact.mutateAsync(deletingContact.id)
            showToast('success', 'Contact deleted')
            // Drop it from the selection too, or the count keeps counting it.
            setSelectedIds((prev) => {
              const next = new Set(prev)
              next.delete(deletingContact.id)
              return next
            })
            setDeletingContact(null)
          } catch {
            showToast('error', 'Could not delete this contact')
          }
        }}
      />
    </div>
  )
}
