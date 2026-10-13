/**
 * Hands a Blob to the browser as a file save.
 *
 * The object URL is revoked immediately after the synthetic click. Skipping
 * that leaks the whole blob for the lifetime of the document, which for a
 * generated report is megabytes per download - and a reporting page is somewhere
 * people click repeatedly.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'

  // Appended rather than clicked detached: Firefox ignores a click on an
  // element that is not in the document.
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
