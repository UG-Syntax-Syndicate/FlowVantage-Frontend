import { DatePickerField } from './DatePickerField'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface DateTimeInputRowProps {
  label: string
  dateValue: string
  timeValue: string
  onDateChange: (dateStr: string) => void
  onTimeChange: (timeStr: string) => void
  minDate?: string
}

/**
 * One "date + time" row (e.g. a task's start or a meeting's start/end).
 * Deliberately does not own a timezone picker - a single timed section (a
 * task's start+due, or a meeting's start+end) shares one TimeZoneCombobox
 * rendered once by the parent, not one per row.
 */
export function DateTimeInputRow({ label, dateValue, timeValue, onDateChange, onTimeChange, minDate }: DateTimeInputRowProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label>{label} date</Label>
        <div className="mt-1">
          <DatePickerField value={dateValue} onChange={onDateChange} minDate={minDate} />
        </div>
      </div>
      <div>
        <Label>{label} time</Label>
        <Input
          type="time"
          value={timeValue}
          onChange={(event) => onTimeChange(event.target.value)}
          className="mt-1"
        />
      </div>
    </div>
  )
}
