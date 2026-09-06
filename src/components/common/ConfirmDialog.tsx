import { useState, type ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import { Input } from '../ui/input'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel?: string
  confirmationPhrase?: string
  danger?: boolean
  loading?: boolean
  error?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmationPhrase,
  danger = false,
  loading = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typedPhrase, setTypedPhrase] = useState('')

  const phraseMatches = !confirmationPhrase || typedPhrase === confirmationPhrase

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {confirmationPhrase && (
          <Input
            type="text"
            value={typedPhrase}
            onChange={(event) => setTypedPhrase(event.target.value)}
            placeholder={`Type "${confirmationPhrase}" to confirm`}
          />
        )}

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!phraseMatches || loading}
            onClick={onConfirm}
            className={danger ? 'bg-rose-600 text-white hover:bg-rose-500' : ''}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
