import { CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Calendar } from '../ui/calendar'
import { Button } from '../ui/button'
import { toDateOnly } from '../../lib/calendarDate'

interface DatePickerFieldProps {
  /** Current value as an ISO string; only the date portion is read/written - any time-of-day is preserved as local midnight. */
  value: string
  onChange: (iso: string) => void
  placeholder?: string
  disabled?: boolean
  /** Disallow picking a date before this one (e.g. an end date picker bounded by the chosen start date). */
  minDate?: string
}

/** Date-only Popover+Calendar field, replacing native `<input type="date">` across the app's create/edit modals. */
export function DatePickerField({ value, onChange, placeholder = 'Pick a date', disabled, minDate }: DatePickerFieldProps) {
  const selected = value ? toDateOnly(value) : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />
          {selected ? selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          disabled={minDate ? { before: toDateOnly(minDate) } : undefined}
          onSelect={(date) => date && onChange(date.toISOString())}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
