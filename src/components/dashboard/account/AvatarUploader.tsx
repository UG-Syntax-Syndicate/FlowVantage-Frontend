import { useRef, useState, type ChangeEvent } from 'react'
import { updateProfile } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../../../lib/firebase'
import { logAuditEvent } from '../../../lib/auditLog'
import { getStorageErrorMessage } from '../../../lib/storageErrors'
import { useAuth } from '../../../hooks/useAuth'
import { Avatar } from '../../common/Avatar'
import { Button } from '../../ui/button'
import { getUserAvatarUrl } from '../../../lib/avatars'

const MAX_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

function isStorageAvatarUrl(url: string | null | undefined): url is string {
  return Boolean(url && url.includes('/avatars%2F'))
}

export function AvatarUploader() {
  const { currentUser, userProfile } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'uploading' | 'removing' | null>(null)
  const [error, setError] = useState('')

  const handleSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !currentUser) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please choose a PNG, JPEG, GIF, or WEBP image.')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Image must be smaller than 2MB.')
      return
    }

    setError('')
    setBusy('uploading')
    try {
      const previousPhotoURL = userProfile?.photoURL

      const path = `avatars/${currentUser.uid}/${Date.now()}-${file.name}`
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)

      await updateProfile(currentUser, { photoURL: url })
      await updateDoc(doc(db, 'users', currentUser.uid), { photoURL: url })
      await logAuditEvent(currentUser.uid, 'profile_updated', { field: 'photoURL' })

      // Best-effort cleanup of the previous avatar file; ignore failures
      // (e.g. the old photoURL came from an OAuth provider, not Storage).
      if (isStorageAvatarUrl(previousPhotoURL)) {
        deleteObject(ref(storage, previousPhotoURL)).catch(() => {})
      }
    } catch (caught) {
      console.error('Avatar upload failed', caught)
      setError(getStorageErrorMessage(caught))
    } finally {
      setBusy(null)
    }
  }

  const handleRemove = async () => {
    if (!currentUser) return
    const previousPhotoURL = userProfile?.photoURL
    setError('')
    setBusy('removing')
    try {
      await updateProfile(currentUser, { photoURL: null })
      await updateDoc(doc(db, 'users', currentUser.uid), { photoURL: null })
      await logAuditEvent(currentUser.uid, 'profile_updated', { field: 'photoURL' })

      if (isStorageAvatarUrl(previousPhotoURL)) {
        deleteObject(ref(storage, previousPhotoURL)).catch(() => {})
      }
    } catch (caught) {
      console.error('Avatar removal failed', caught)
      setError(getStorageErrorMessage(caught))
    } finally {
      setBusy(null)
    }
  }

  const hasCustomPhoto = Boolean(userProfile?.photoURL)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Avatar
        photoURL={getUserAvatarUrl(userProfile?.photoURL, userProfile?.id ?? currentUser?.uid ?? 'user')}
        name={userProfile?.name}
        size={72}
      />
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={busy !== null} onClick={() => inputRef.current?.click()}>
            {busy === 'uploading' ? 'Uploading…' : '+ Change Image'}
          </Button>
          {hasCustomPhoto && (
            <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={handleRemove}>
              {busy === 'removing' ? 'Removing…' : 'Remove Image'}
            </Button>
          )}
        </div>
        <p className="text-xs text-slate-500">We support PNGs, JPEGs and GIFs under 2MB</p>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleSelect}
        />
      </div>
    </div>
  )
}
