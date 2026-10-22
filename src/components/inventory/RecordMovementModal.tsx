import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import {
  MOVEMENT_KIND_LABELS,
  MovementInputSchema,
  RECORDABLE_MOVEMENT_KINDS,
  type InventoryItem,
  type MovementInput,
  type RecordableMovementKind,
} from '../../types/inventory'
import { useInventoryLocations, useRecordMovement } from '../../hooks/useInventoryData'
import { useProjects } from '../../hooks/useProjectsData'
import { showToast } from '../../lib/toast'

interface RecordMovementModalProps {
  items: InventoryItem[]
  /** Pre-selects an item when opened from its row. */
  initialItemId?: string
  onClose: () => void
}

const NONE = 'none'

/** Why a movement is being recorded, in the user's terms rather than the ledger's. */
const KIND_HELP: Record<RecordableMovementKind, string> = {
  receipt: 'Stock arriving from a supplier.',
  issue: 'Stock taken out, usually for a project.',
  return: 'Unused stock coming back in.',
  adjustment: 'A stock-take correction. Enter a negative number to reduce.',
  write_off: 'Damaged, lost or scrapped.',
}

/**
 * Records one ledger entry.
 *
 * The quantity field is positive for every kind except `adjustment`: the sign
 * comes from the movement kind server-side, so a client cannot increase stock
 * by sending a negative issue. An adjustment is the one genuinely two-way case
 * - a stock-take can go either direction - so it alone accepts a signed value,
 * and the help text says so.
 */
export function RecordMovementModal({ items, initialItemId, onClose }: RecordMovementModalProps) {
  const recordMovement = useRecordMovement()
  const { data: locations = [] } = useInventoryLocations()
  const { data: projects = [] } = useProjects()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MovementInput>({
    resolver: zodResolver(MovementInputSchema),
    defaultValues: {
      itemId: initialItemId ?? items[0]?.id ?? '',
      kind: 'receipt',
      quantity: 1,
      locationId: '',
      projectId: '',
      note: '',
    },
  })

  const itemId = watch('itemId')
  const kind = watch('kind')
  const selectedItem = items.find((item) => item.id === itemId)

  const onSubmit = handleSubmit(async (values) => {
    try {
      await recordMovement.mutateAsync(values)
      showToast('success', `${MOVEMENT_KIND_LABELS[values.kind]}: ${Math.abs(values.quantity)} ${selectedItem?.unit ?? ''}`.trim())
      onClose()
    } catch (error) {
      // Worth surfacing verbatim: the backend refuses to take more than is on
      // hand and says exactly how much there is.
      showToast('error', error instanceof Error ? error.message : 'Could not record this movement')
    }
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record stock movement</DialogTitle>
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
                {selectedItem.onHand} {selectedItem.unit} on hand, {selectedItem.available} available
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Movement</Label>
              <Select value={kind} onValueChange={(value) => setValue('kind', value as RecordableMovementKind)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECORDABLE_MOVEMENT_KINDS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {MOVEMENT_KIND_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                {...register('quantity')}
                type="number"
                step="any"
                min={kind === 'adjustment' ? undefined : 0}
                className="mt-1"
              />
              {errors.quantity && <p className="mt-1 text-xs text-rose-600">{errors.quantity.message}</p>}
            </div>
          </div>

          <p className="-mt-1 text-xs text-slate-400">{KIND_HELP[kind]}</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Location</Label>
              <Select
                value={watch('locationId') || NONE}
                onValueChange={(value) => setValue('locationId', value === NONE ? '' : value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unspecified</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Project</Label>
              <Select
                value={watch('projectId') || NONE}
                onValueChange={(value) => setValue('projectId', value === NONE ? '' : value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value={NONE}>No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-slate-400">Attributes the cost to a project report.</p>
            </div>
          </div>

          <div>
            <Label>Note</Label>
            <Textarea {...register('note')} rows={2} className="mt-1 resize-none" placeholder="Delivery note number, who collected it…" />
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={recordMovement.isPending} disabled={recordMovement.isPending}>
              Record movement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
