import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, Truck } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import {
  LocationInputSchema,
  SupplierInputSchema,
  type LocationInput,
  type SupplierInput,
} from '../../types/inventory'
import {
  useCreateLocation,
  useCreateSupplier,
  useInventoryLocations,
  useSuppliers,
} from '../../hooks/useInventoryData'
import { showToast } from '../../lib/toast'

interface LocationsSuppliersSheetProps {
  onClose: () => void
}

const LOCATION_KINDS = [
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'site', label: 'Site' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'other', label: 'Other' },
] as const

function LocationsSection() {
  const { data: locations = [] } = useInventoryLocations()
  const createLocation = useCreateLocation()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LocationInput>({
    resolver: zodResolver(LocationInputSchema),
    defaultValues: { name: '', kind: 'warehouse', address: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createLocation.mutateAsync(values)
      showToast('success', 'Location added')
      reset({ name: '', kind: values.kind, address: '' })
    } catch {
      showToast('error', 'Could not add this location')
    }
  })

  return (
    <section className="flex flex-col gap-3 px-5 py-4">
      <div className="flex items-center gap-2">
        <MapPin size={15} strokeWidth={2} className="text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900">Locations</h3>
      </div>
      <p className="text-xs text-slate-400">
        Where stock physically sits — a warehouse, a site, a van. Transfers move stock between them.
      </p>

      {locations.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {locations.map((location) => (
            <li key={location.id} className="rounded-xl border border-line px-3 py-2">
              <p className="text-sm text-slate-900">{location.name}</p>
              <p className="text-xs text-slate-400 capitalize">
                {[location.kind, location.address].filter(Boolean).join(' · ')}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Name</Label>
            <Input {...register('name')} className="mt-1" placeholder="Main warehouse" />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
          </div>
          <div>
            <Label>Kind</Label>
            <Select value={watch('kind')} onValueChange={(value) => setValue('kind', value as LocationInput['kind'])}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_KINDS.map((kind) => (
                  <SelectItem key={kind.value} value={kind.value}>
                    {kind.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Address</Label>
          <Input {...register('address')} className="mt-1" placeholder="Optional" />
        </div>
        <Button type="submit" size="sm" loading={createLocation.isPending} disabled={createLocation.isPending}>
          Add location
        </Button>
      </form>
    </section>
  )
}

function SuppliersSection() {
  const { data: suppliers = [] } = useSuppliers()
  const createSupplier = useCreateSupplier()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierInput>({
    resolver: zodResolver(SupplierInputSchema),
    defaultValues: { name: '', email: '', phone: '', notes: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createSupplier.mutateAsync(values)
      showToast('success', 'Supplier added')
      reset({ name: '', email: '', phone: '', notes: '' })
    } catch {
      showToast('error', 'Could not add this supplier')
    }
  })

  return (
    <section className="flex flex-col gap-3 border-t border-line px-5 py-4">
      <div className="flex items-center gap-2">
        <Truck size={15} strokeWidth={2} className="text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900">Suppliers</h3>
      </div>
      <p className="text-xs text-slate-400">Who stock is bought from. Attach one to an item to keep reordering quick.</p>

      {suppliers.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {suppliers.map((supplier) => (
            <li key={supplier.id} className="rounded-xl border border-line px-3 py-2">
              <p className="text-sm text-slate-900">{supplier.name}</p>
              <p className="text-xs text-slate-400">
                {[supplier.email, supplier.phone].filter(Boolean).join(' · ') || 'No contact details'}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3">
        <div>
          <Label>Name</Label>
          <Input {...register('name')} className="mt-1" placeholder="Acme Supplies" />
          {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Email</Label>
            <Input {...register('email')} type="email" className="mt-1" placeholder="orders@acme.com" />
            {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
          </div>
          <div>
            <Label>Phone</Label>
            <Input {...register('phone')} className="mt-1" placeholder="+31 20 000 0000" />
          </div>
        </div>
        <Button type="submit" size="sm" loading={createSupplier.isPending} disabled={createSupplier.isPending}>
          Add supplier
        </Button>
      </form>
    </section>
  )
}

/**
 * Locations and suppliers in one panel.
 *
 * Both are small reference lists that only exist to be picked from elsewhere,
 * so they get one side sheet rather than two pages in the nav - and keeping the
 * add form inline means someone who discovers mid-transfer that they need a
 * second location can create it without losing their place.
 */
export function LocationsSuppliersSheet({ onClose }: LocationsSuppliersSheetProps) {
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="border-b border-line px-5 py-4">
          <SheetTitle className="text-base font-semibold text-slate-900">Locations &amp; suppliers</SheetTitle>
          <SheetDescription className="text-xs text-slate-400">
            Reference lists the rest of inventory picks from.
          </SheetDescription>
        </SheetHeader>

        <LocationsSection />
        <SuppliersSection />
      </SheetContent>
    </Sheet>
  )
}
