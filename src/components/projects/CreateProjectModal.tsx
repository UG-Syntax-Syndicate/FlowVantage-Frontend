import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, X } from 'lucide-react'
import { CreateProjectInputSchema, type CreateProjectInput } from '../../types/project'
import { useAttachProjectToFolder, useContacts, useCreateMeeting, useCreateProject, useFolders } from '../../hooks/useProjectsData'
import { useAuth } from '../../hooks/useAuth'
import { useWorkspace } from '../../hooks/useWorkspace'
import { useWorkspaceMembers } from '../../hooks/useWorkspacesData'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Popover, PopoverContent, PopoverAnchor } from '../ui/popover'
import { Command, CommandGroup, CommandItem, CommandList } from '../ui/command'
import { PriorityToggleGroup } from '../common/PriorityToggleGroup'
import { DatePickerField } from '../common/DatePickerField'
import { TimeZoneCombobox } from '../common/TimeZoneCombobox'
import { showToast } from '../../lib/toast'
import { convertImageToWebp, validateImageFile } from '../../lib/images'
import { getBrowserTimeZone, zonedDateTimeToUtcIso } from '../../lib/timezone'

interface CreateProjectModalProps {
  onClose: () => void
  /** Called right after a successful create, before onClose - e.g. to navigate to the new project's list. */
  onCreated?: () => void
}

export function CreateProjectModal({ onClose, onCreated }: CreateProjectModalProps) {
  const { currentUser } = useAuth()
  const { activeWorkspace } = useWorkspace()
  const { data: workspaceMembers = [] } = useWorkspaceMembers(activeWorkspace?.id)
  const { data: allFolders = [] } = useFolders()
  const { data: contacts = [] } = useContacts()
  const createProject = useCreateProject()
  const attachProjectToFolder = useAttachProjectToFolder()
  const createMeeting = useCreateMeeting()
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([])
  const workspaceFolders = allFolders.filter((f) => f.workspaceId === activeWorkspace?.id)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProjectInputSchema),
    defaultValues: {
      name: '',
      description: '',
      image: null,
      memberIds: [],
      visibility: 'private',
      priority: 'medium',
      client: '',
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    },
  })

  useEffect(() => {
    if (activeWorkspace) setValue('workspaceId', activeWorkspace.id)
  }, [activeWorkspace, setValue])

  const selectedImage = watch('image')
  const selectedMemberIds = watch('memberIds')
  const visibility = watch('visibility')
  const priority = watch('priority') ?? 'medium'
  const clientValue = watch('client') ?? ''
  const projectName = watch('name')
  // Everyone but yourself, since the creator is always added as the project
  // owner automatically.
  const otherMembers = workspaceMembers.filter((member) => member.userId !== currentUser?.uid)

  // -- Client free-text-with-suggestions combobox -----------------------
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false)
  const clientSuggestions = useMemo(() => {
    const names = new Set<string>()
    for (const contact of contacts) {
      const label = contact.company || contact.contactName
      if (label) names.add(label)
    }
    return Array.from(names)
      .filter((name) => name !== clientValue && name.toLowerCase().includes(clientValue.toLowerCase()))
      .slice(0, 8)
  }, [contacts, clientValue])

  // -- Optional kickoff-meeting section ----------------------------------
  const [scheduleMeeting, setScheduleMeeting] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingLocation, setMeetingLocation] = useState('')
  const [meetingDateStr, setMeetingDateStr] = useState(new Date().toISOString().slice(0, 10))
  const [meetingStartTimeStr, setMeetingStartTimeStr] = useState('09:00')
  const [meetingEndTimeStr, setMeetingEndTimeStr] = useState('09:30')
  const [meetingTimeZone, setMeetingTimeZone] = useState(getBrowserTimeZone)

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) {
      showToast('error', validationError)
      return
    }
    try {
      setValue('image', await convertImageToWebp(file))
    } catch {
      showToast('error', 'Could not read that image')
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const project = await createProject.mutateAsync(values)
      // Folders only make sense once the project exists (attach is a
      // project-scoped endpoint) - fire these after create, same as the
      // cover image upload flow for a brand-new project.
      const postCreateWork: Promise<unknown>[] = selectedFolderIds.map((folderId) =>
        attachProjectToFolder.mutateAsync({ projectId: project.id, folderId }),
      )
      if (scheduleMeeting) {
        postCreateWork.push(
          createMeeting.mutateAsync({
            title: meetingTitle.trim() || `${project.name} kickoff`,
            location: meetingLocation.trim() || undefined,
            startTime: zonedDateTimeToUtcIso(meetingDateStr, meetingStartTimeStr, meetingTimeZone),
            endTime: zonedDateTimeToUtcIso(meetingDateStr, meetingEndTimeStr, meetingTimeZone),
            projectId: project.id,
          }),
        )
      }
      await Promise.all(postCreateWork)
      showToast('success', 'Project created')
      onCreated?.()
      onClose()
    } catch {
      showToast('error', 'Could not create project')
    }
  })

  function toggleMember(id: string) {
    const next = selectedMemberIds.includes(id)
      ? selectedMemberIds.filter((memberId) => memberId !== id)
      : [...selectedMemberIds, id]
    setValue('memberIds', next)
  }

  function toggleFolder(id: string) {
    setSelectedFolderIds((prev) => (prev.includes(id) ? prev.filter((folderId) => folderId !== id) : [...prev, id]))
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <Label>Name</Label>
            <Input {...register('name')} className="mt-1" placeholder="e.g. Website Relaunch" />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              {...register('description')}
              rows={2}
              className="mt-1 resize-none"
              placeholder="What is this project about?"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <div className="mt-2">
                <PriorityToggleGroup value={priority} onChange={(next) => setValue('priority', next)} />
              </div>
            </div>
            <div>
              <Label>Client</Label>
              <Popover open={clientPopoverOpen && clientSuggestions.length > 0} onOpenChange={setClientPopoverOpen}>
                <PopoverAnchor asChild>
                  <Input
                    {...register('client')}
                    className="mt-1"
                    placeholder="e.g. Acme Inc."
                    autoComplete="off"
                    onFocus={() => setClientPopoverOpen(true)}
                    onBlur={() => setTimeout(() => setClientPopoverOpen(false), 120)}
                  />
                </PopoverAnchor>
                <PopoverContent
                  className="w-(--radix-popover-trigger-width) p-0"
                  align="start"
                  onOpenAutoFocus={(event) => event.preventDefault()}
                >
                  <Command shouldFilter={false}>
                    <CommandList>
                      <CommandGroup>
                        {clientSuggestions.map((name) => (
                          <CommandItem
                            key={name}
                            value={name}
                            onSelect={() => {
                              setValue('client', name)
                              setClientPopoverOpen(false)
                            }}
                          >
                            {name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label>Cover image</Label>
            {selectedImage ? (
              <div className="relative mt-2 h-28 w-full overflow-hidden rounded-lg">
                <img src={selectedImage} alt="Cover preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setValue('image', null)}
                  aria-label="Remove image"
                  className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label className="mt-2 flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-input text-muted-foreground hover:border-primary hover:text-primary">
                <ImagePlus size={20} strokeWidth={1.7} />
                <span className="text-xs font-medium">Upload a cover image</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
            {!selectedImage && (
              <p className="mt-1 text-xs text-slate-400">
                PNG, JPEG, GIF, or WEBP. Max 5MB — converted to WEBP. No image? We&apos;ll assign a default gradient
                cover.
              </p>
            )}
          </div>

          {otherMembers.length > 0 && (
            <div>
              <Label>Members</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {otherMembers.map((member) => (
                  <button
                    type="button"
                    key={member.userId}
                    onClick={() => toggleMember(member.userId)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      selectedMemberIds.includes(member.userId)
                        ? 'border-primary bg-accent-50 text-primary'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {workspaceFolders.length > 0 && (
            <div>
              <Label>Folders</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {workspaceFolders.map((f) => (
                  <button
                    type="button"
                    key={f.id}
                    onClick={() => toggleFolder(f.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      selectedFolderIds.includes(f.id)
                        ? 'border-primary bg-accent-50 text-primary'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!activeWorkspace?.isPersonal && (
            <div>
              <Label>Visibility</Label>
              <RadioGroup
                value={visibility}
                onValueChange={(next) => setValue('visibility', next as CreateProjectInput['visibility'])}
                className="mt-2 grid-cols-2"
              >
                <label
                  className={`flex cursor-pointer flex-col gap-1 rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${
                    visibility === 'private' ? 'border-primary bg-accent-50 text-primary' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <RadioGroupItem value="private" />
                    Private
                  </span>
                  <span className="font-normal text-slate-400">Only invited members can see it</span>
                </label>
                <label
                  className={`flex cursor-pointer flex-col gap-1 rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${
                    visibility === 'workspace' ? 'border-primary bg-accent-50 text-primary' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <RadioGroupItem value="workspace" />
                    Workspace
                  </span>
                  <span className="font-normal text-slate-400">Anyone in the workspace can see it</span>
                </label>
              </RadioGroup>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start date</Label>
              <div className="mt-1">
                <DatePickerField value={watch('startDate')} onChange={(iso) => setValue('startDate', iso)} />
              </div>
            </div>
            <div>
              <Label>Due date</Label>
              <div className="mt-1">
                <DatePickerField
                  value={watch('dueDate')}
                  onChange={(iso) => setValue('dueDate', iso)}
                  minDate={watch('startDate')}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-input p-3">
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-medium">Also schedule a kickoff meeting</span>
                <span className="block text-xs text-slate-400">Adds an event to the calendar, linked to this project.</span>
              </span>
              <Switch checked={scheduleMeeting} onCheckedChange={setScheduleMeeting} />
            </label>

            {scheduleMeeting && (
              <div className="mt-3 flex flex-col gap-3">
                <div>
                  <Label>Meeting title</Label>
                  <Input
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder={projectName ? `${projectName} kickoff` : 'Kickoff meeting'}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={meetingLocation}
                    onChange={(e) => setMeetingLocation(e.target.value)}
                    placeholder="e.g. Zoom link or room name (optional)"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Date</Label>
                  <div className="mt-1">
                    <DatePickerField
                      value={new Date(`${meetingDateStr}T00:00:00`).toISOString()}
                      onChange={(iso) => setMeetingDateStr(iso.slice(0, 10))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Start time</Label>
                    <Input
                      type="time"
                      value={meetingStartTimeStr}
                      onChange={(e) => setMeetingStartTimeStr(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>End time</Label>
                    <Input
                      type="time"
                      value={meetingEndTimeStr}
                      onChange={(e) => setMeetingEndTimeStr(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Timezone</Label>
                  <div className="mt-1">
                    <TimeZoneCombobox value={meetingTimeZone} onChange={setMeetingTimeZone} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createProject.isPending || createMeeting.isPending}
              disabled={createProject.isPending || createMeeting.isPending}
            >
              {createProject.isPending ? 'Creating…' : 'Create project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
