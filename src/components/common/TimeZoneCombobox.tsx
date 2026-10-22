import { useState } from 'react'
import { Check, ChevronsUpDown, Globe } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command'
import { Button } from '../ui/button'
import { cn } from 'cn'
import { listIanaTimeZones } from '../../lib/timezone'

interface TimeZoneComboboxProps {
  value: string
  onChange: (timeZone: string) => void
  disabled?: boolean
}

/** Searchable ~400-entry IANA timezone picker. Client-side only - nothing here is persisted, it only affects the UTC instant computed from a wall-clock date+time. */
export function TimeZoneCombobox({ value, onChange, disabled }: TimeZoneComboboxProps) {
  const [open, setOpen] = useState(false)
  const zones = listIanaTimeZones()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Globe className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{value.replace(/_/g, ' ')}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search timezone..." />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {zones.map((zone) => (
                <CommandItem
                  key={zone}
                  value={zone}
                  onSelect={() => {
                    onChange(zone)
                    setOpen(false)
                  }}
                >
                  <Check className={cn('size-4', zone === value ? 'opacity-100' : 'opacity-0')} />
                  {zone.replace(/_/g, ' ')}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
