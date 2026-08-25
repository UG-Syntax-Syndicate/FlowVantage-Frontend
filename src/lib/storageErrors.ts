const MESSAGES: Record<string, string> = {
  'storage/unauthorized': "You don't have permission to upload photos right now.",
  'storage/canceled': 'Upload was canceled.',
  'storage/quota-exceeded': 'Storage quota exceeded. Please try again later.',
  'storage/retry-limit-exceeded': 'Upload failed after multiple attempts. Check your connection and try again.',
}

export function getStorageErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    const code = (error as { code: string }).code
    if (MESSAGES[code] !== undefined) {
      return MESSAGES[code]
    }
  }

  return 'Could not upload your photo. Please try again.'
}
