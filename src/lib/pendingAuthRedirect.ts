// A signup submission is a multi-step async chain (create user, write the
// Firestore profile doc, send the verification email) that finishes well
// after Firebase's onAuthStateChanged already reports the new user as
// signed in. PublicOnlyRoute reacts to that as soon as it happens, before
// SignupPage's own post-submit navigate() call would run — so it needs to
// know the intended destination up front, set synchronously before the
// signup call starts, rather than racing an async navigate() against it.
//
// peekPendingAuthRedirect() is read directly in PublicOnlyRoute's render
// body, so it must stay a pure, non-mutating read — React (Strict Mode)
// double-invokes render functions to catch impurities, and a "consume on
// read" implementation would return the value on the first call and null on
// the second, corrupting the redirect. Clearing happens separately, from an
// effect on the destination page once it has actually mounted there.
let pendingRedirect: string | null = null

export function setPendingAuthRedirect(path: string): void {
  pendingRedirect = path
}

export function peekPendingAuthRedirect(): string | null {
  return pendingRedirect
}

export function clearPendingAuthRedirect(): void {
  pendingRedirect = null
}
