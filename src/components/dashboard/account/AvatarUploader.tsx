import { useRef, useState, type ChangeEvent } from 'react'
import { updateProfile } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { Camera } from 'lucide-react'
import { db, storage } from '../../../lib/firebase'
import { logAuditEvent } from '../../../lib/auditLog'
import { getStorageErrorMessage } from '../../../lib/storageErrors'
import { useAuth } from '../../../hooks/useAuth'
import { Avatar } from '../../common/Avatar'

const MAX_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export function AvatarUploader() {
  const { currentUser, userProfile } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !currentUser) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please choose a PNG, JPEG, or WEBP image.')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Image must be smaller than 2MB.')
      return
    }

    setError('')
    setUploading(true)
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
      if (previousPhotoURL && previousPhotoURL.includes('/avatars%2F')) {
        deleteObject(ref(storage, previousPhotoURL)).catch(() => {})
      }
    } catch (caught) {
      console.error('Avatar upload failed', caught)
      setError(getStorageErrorMessage(caught))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar photoURL={userProfile?.photoURL} name={userProfile?.name} size={64} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          title="Change photo"
          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 text-white shadow-sm hover:bg-accent-600 disabled:opacity-60"
        >
          <Camera size={13} strokeWidth={2} />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleSelect}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{uploading ? 'Uploading…' : 'Profile photo'}</p>
        <p className="text-xs text-slate-500">PNG, JPEG, or WEBP. Max 2MB.</p>
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
    </div>
  )
}
