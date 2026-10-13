import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { AllocationInputSchema, type AllocationInput, type InventoryItem } from '../../types/inventory'
import { useCreateAllocation } from '../../hooks/useInventoryData'
import { useProjects } from '../../hooks/useProjectsData'
import { showToast } from '../../lib/toast'

interface ReserveStockModalProps {
  items: InventoryItem[]
  initialItemId?: string
  initialProjectId?: string
  onClose: () => void
}

/**
 * Reserves stock for a project.
 *
 * A reservation is intent, not consumption: it moves no stock, it just stops
 * two projects both planning to use the last of something. The available figure
 * shown here is on-hand minus what is already reserved, which is the same
 * number the server checks against on submit.
 */
export function ReserveStockModal({ items, initialItemId, initialProjectId, onClose }: ReserveStockModalProps) {
  const createAllocation = useCreateAllocation()
  const { data: projects = [] } = useProjects()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AllocationInput>({
    resolver: zodResolver(AllocationInputSchema),
    defaultValues: {
      itemId: initialItemId ?? items[0]?.id ?? '',
      projectId: initialProjectId ?? '',
      quantity: 1,
      note: '',
    },
  })

  const itemId = watch('itemId')
  const selectedItem = items.find((item) => item.id === itemId)

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createAllocation.mutateAsync(values)
      showToast('success', 'Stock reserved for the project')
      onClose()
    } catch (error) {
      // The backend's message names the available quantity, which is the one
      // thing the user needs to know when this fails.
      showToast('error', error instanceof Error ? error.message : 'Could not reserve this stock')
    }
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reserve stock for a project</DialogTitle>
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
                {selectedItem.available} {selectedItem.unit} available ({selectedItem.onHand} on hand,{' '}
                {selectedItem.allocated} already reserved)
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Project</Label>
              <Select value={watch('projectId')} onValueChange={(value) => setValue('projectId', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pick a project" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && <p className="mt-1 text-xs text-rose-600">{errors.projectId.message}</p>}
            </div>
            <div>
              <Label>Quantity</Label>
              <Input {...register('quantity')} type="number" step="any" min="0" className="mt-1" />
              {errors.quantity && <p className="mt-1 text-xs text-rose-600">{errors.quantity.message}</p>}
            </div>
          </div>

          <div>
            <Label>Note</Label>
            <Textarea {...register('note')} rows={2} className="mt-1 resize-none" placeholder="What it is earmarked for…" />
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createAllocation.isPending} disabled={createAllocation.isPending}>
              Reserve
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
