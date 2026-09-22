export class PromiseTimeoutError extends Error {
  constructor(message = 'Operation timed out') {
    super(message)
    this.name = 'PromiseTimeoutError'
  }
}

/**
 * Rejects with a {@link PromiseTimeoutError} if `promise` hasn't settled within
 * `ms`. Firestore/Storage calls made while offline queue and wait indefinitely
 * for connectivity instead of rejecting, so anything awaiting them directly can
 * hang forever with no error — this guarantees the caller's await always
 * returns.
 */
export function promiseWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new PromiseTimeoutError()), ms)
    promise.then(
      (value) => {
        clearTimeout(timeoutId)
        resolve(value)
      },
      (error) => {
        clearTimeout(timeoutId)
        reject(error)
      },
    )
  })
}
