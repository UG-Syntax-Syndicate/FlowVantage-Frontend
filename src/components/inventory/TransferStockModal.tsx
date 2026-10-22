import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Alert } from '../common/Alert'
import { TransferInputSchema, type InventoryItem, type TransferInput } from '../../types/inventory'
import { useInventoryLocations, useTransferStock } from '../../hooks/useInventoryData'
import { showToast } from '../../lib/toast'

interface TransferStockModalProps {
  items: InventoryItem[]
  initialItemId?: string
  onClose: () => void
}

/**
 * Moves stock between locations.
 *
 * A transfer is two ledger rows written in one transaction, so it cannot
 * half-happen - which is why it has its own endpoint rather than being two
 * movements the client fires in sequence.
 */
export function TransferStockModal({ items, initialItemId, onClose }: TransferStockModalProps) {
  const transferStock = useTransferStock()
  const { data: locations = [] } = useInventoryLocations()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransferInput>({
    resolver: zodResolver(TransferInputSchema),
    defaultValues: {
      itemId: initialItemId ?? items[0]?.id ?? '',
      fromLocationId: '',
      toLocationId: '',
      quantity: 1,
      note: '',
    },
  })

  const itemId = watch('itemId')
  const selectedItem = items.find((item) => item.id === itemId)

  const onSubmit = handleSubmit(async (values) => {
    try {
      await transferStock.mutateAsync(values)
      showToast('success', 'Stock transferred')
      onClose()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not transfer this stock')
    }
  })

  // Two locations are the minimum for a transfer to mean anything, so say that
  // rather than showing a form that cannot be submitted.
  if (locations.length < 2) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer stock</DialogTitle>
          </DialogHeader>
          <Alert variant="info">
            A transfer needs at least two locations. Add another under “Locations &amp; suppliers” first.
          </Alert>
          <div className="flex justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transfer stock</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <Label>Item</Label>
            <Select value={itemId} onValueChange={(value) => setValue('itemId', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Pick an item" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                    {item.sku ? ` · ${item.sku}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.itemId && <p className="mt-1 text-xs text-rose-600">{errors.itemId.message}</p>}
            {selectedItem && (
              <p className="mt-1 text-xs text-slate-400">
                {selectedItem.onHand} {selectedItem.unit} on hand
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>From</Label>
              <Select value={watch('fromLocationId')} onValueChange={(value) => setValue('fromLocationId', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Where it is now" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.fromLocationId && <p className="mt-1 text-xs text-rose-600">{errors.fromLocationId.message}</p>}
            </div>
            <div>
              <Label>To</Label>
              <Select value={watch('toLocationId')} onValueChange={(value) => setValue('toLocationId', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Where it is going" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.toLocationId && <p className="mt-1 text-xs text-rose-600">{errors.toLocationId.message}</p>}
            </div>
          </div>

          <div>
            <Label>Quantity</Label>
            <Input {...register('quantity')} type="number" step="any" min="0" className="mt-1" />
            {errors.quantity && <p className="mt-1 text-xs text-rose-600">{errors.quantity.message}</p>}
          </div>

          <div>
            <Label>Note</Label>
            <Textarea {...register('note')} rows={2} className="mt-1 resize-none" placeholder="Who moved it, and why…" />
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={transferStock.isPending} disabled={transferStock.isPending}>
              Transfer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
