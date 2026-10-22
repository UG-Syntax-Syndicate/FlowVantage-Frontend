import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { InventoryItemInputSchema, type InventoryItem, type InventoryItemInput } from '../../types/inventory'
import { useCreateInventoryItem, useSuppliers, useUpdateInventoryItem } from '../../hooks/useInventoryData'
import { fromMinorUnits } from '../../lib/money'
import { showToast } from '../../lib/toast'

interface ItemFormModalProps {
  /** Null means "create"; an item means "edit that item". */
  item: InventoryItem | null
  onClose: () => void
}

const NO_SUPPLIER = 'none'

/**
 * Add or edit a catalogue item.
 *
 * Quantities are never entered here: stock only changes through the ledger, so
 * this form has no on-hand field at all. That is the whole reason the figures
 * on the inventory page can be trusted - there is no way to set a balance
 * directly, only to record a movement that produces one.
 */
export function ItemFormModal({ item, onClose }: ItemFormModalProps) {
  const createItem = useCreateInventoryItem()
  const updateItem = useUpdateInventoryItem()
  const { data: suppliers = [] } = useSuppliers()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InventoryItemInput>({
    resolver: zodResolver(InventoryItemInputSchema),
    defaultValues: {
      name: item?.name ?? '',
      sku: item?.sku ?? '',
      category: item?.category ?? '',
      unit: item?.unit ?? 'each',
      description: item?.description ?? '',
      // Minor units on the wire, major units in the field: nobody types "1250"
      // meaning €12.50.
      unitCost: item ? fromMinorUnits(item.unitCostMinor) : 0,
      currency: item?.currency ?? 'EUR',
      reorderThreshold: item?.reorderThreshold ?? '',
      supplierId: item?.supplierId ?? '',
    },
  })

  const pending = createItem.isPending || updateItem.isPending
  const selectedSupplier = watch('supplierId')

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (item) {
        await updateItem.mutateAsync({ itemId: item.id, input: values })
        showToast('success', 'Item updated')
      } else {
        await createItem.mutateAsync(values)
        showToast('success', 'Item added to the catalogue')
      }
      onClose()
    } catch (error) {
      // The backend returns a specific message for a duplicate SKU, which is
      // far more useful than "could not save".
      showToast('error', error instanceof Error ? error.message : 'Could not save this item')
    }
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit item' : 'Add item'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <Label>Name</Label>
            <Input {...register('name')} className="mt-1" placeholder="Scaffold board" autoFocus />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>SKU</Label>
              <Input {...register('sku')} className="mt-1" placeholder="SCF-225" />
              <p className="mt-1 text-xs text-slate-400">Optional, but unique within the workspace.</p>
            </div>
            <div>
              <Label>Category</Label>
              <Input {...register('category')} className="mt-1" placeholder="Materials" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Unit</Label>
              <Input {...register('unit')} className="mt-1" placeholder="each" />
              {errors.unit && <p className="mt-1 text-xs text-rose-600">{errors.unit.message}</p>}
            </div>
            <div>
              <Label>Unit cost</Label>
              <Input {...register('unitCost')} type="number" step="0.01" min="0" className="mt-1" />
              {errors.unitCost && <p className="mt-1 text-xs text-rose-600">{errors.unitCost.message}</p>}
            </div>
            <div>
              <Label>Currency</Label>
              <Input {...register('currency')} className="mt-1" placeholder="EUR" maxLength={3} />
              {errors.currency && <p className="mt-1 text-xs text-rose-600">{errors.currency.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Reorder threshold</Label>
              <Input {...register('reorderThreshold')} type="number" step="any" min="0" className="mt-1" placeholder="—" />
              <p className="mt-1 text-xs text-slate-400">Leave empty to not track stock levels for this item.</p>
            </div>
            <div>
              <Label>Supplier</Label>
              <Select
                value={selectedSupplier || NO_SUPPLIER}
                onValueChange={(value) => setValue('supplierId', value === NO_SUPPLIER ? '' : value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SUPPLIER}>No supplier</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea {...register('description')} rows={2} className="mt-1 resize-none" placeholder="Anything worth knowing…" />
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending} disabled={pending}>
              {item ? 'Save changes' : 'Add item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
