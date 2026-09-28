import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import type { Priority } from '../../types/project'

const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high', 'urgent']

interface PriorityToggleGroupProps {
  value: Priority
  onChange: (priority: Priority) => void
}

/** Shared single-select priority picker used by both the project and task creation modals. */
export function PriorityToggleGroup({ value, onChange }: PriorityToggleGroupProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => next && onChange(next as Priority)}
      className="flex-wrap justify-start"
    >
      {PRIORITY_OPTIONS.map((priority) => (
        <ToggleGroupItem key={priority} value={priority} className="capitalize">
          {priority}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
