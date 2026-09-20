import { useCallback, useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'

/** Matches the aspect-[3/1] applied to both ProjectCard's thumbnail and this page's banner. */
export const PROJECT_COVER_ASPECT_RATIO = 3 / 1

interface ImageCropModalProps {
  file: File
  onCancel: () => void
  onCropped: (file: File) => void
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load image'))
    image.src = src
  })
}

/** Draws the chosen crop rectangle onto a canvas and returns it as a File, same name/type as the source. */
async function getCroppedFile(imageSrc: string, area: Area, fileName: string, mimeType: string): Promise<File> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(area.width)
  canvas.height = Math.round(area.height)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not supported')

  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType))
  if (!blob) throw new Error('Could not encode the cropped image')
  return new File([blob], fileName, { type: mimeType })
}

/**
 * Lets the user reposition/zoom a picked image before it becomes a project
 * cover, instead of leaving `background-position: center` to silently decide
 * what's visible. The crop output still goes through the existing
 * optimizeImage()/convertImageToWebp() pipeline unchanged - this only adds a
 * step in front of it.
 */
export function ImageCropModal({ file, onCancel, onCropped }: ImageCropModalProps) {
  const [imageUrl] = useState(() => URL.createObjectURL(file))
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => () => URL.revokeObjectURL(imageUrl), [imageUrl])

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    setSaving(true)
    try {
      const cropped = await getCroppedFile(imageUrl, croppedAreaPixels, file.name, file.type || 'image/jpeg')
      onCropped(cropped)
    } catch {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onCancel()}>
      <DialogContent className="max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Adjust cover image</DialogTitle>
        </DialogHeader>

        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-slate-900">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={PROJECT_COVER_ASPECT_RATIO}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="flex items-center gap-3 px-1">
          <span className="text-xs font-medium text-slate-500">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="h-1.5 flex-1 accent-accent-500"
            aria-label="Zoom"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !croppedAreaPixels}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
