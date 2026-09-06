/**
 * Stand-in for a realtime push channel (Firestore `onSnapshot`, a WebSocket, etc).
 * projectsApi calls `emit()` after every mutation; hooks subscribe the same way
 * they will subscribe to the real backend, so swapping the transport later is a
 * one-file change, not a rewrite of the data layer.
 */
type Listener = () => void

const listeners = new Set<Listener>()

export function emitProjectsChanged(): void {
  listeners.forEach((listener) => listener())
}

export function subscribeToProjectsChanged(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
