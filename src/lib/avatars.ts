/**
 * Deterministic placeholder avatars (DiceBear "Clay" style, no API key) used
 * everywhere a person - contact, workspace member, email sender, or the
 * signed-in user themself - needs an avatar and hasn't uploaded a real photo.
 * Same seed always renders the same character.
 */
function clayAvatarUrl(seed: string): string {
  // The "clay" style only exists on DiceBear's v10.x API (confirmed: 404s on 9.x).
  return `https://api.dicebear.com/10.x/clay/svg?seed=${encodeURIComponent(seed)}`
}

/** Deterministic placeholder avatar for any id/name/email that doesn't have an explicit photoURL. */
export function pickAvatar(seed: string): string {
  return clayAvatarUrl(seed)
}

/** photoURL if present, otherwise a stable placeholder avatar for the given seed. */
export function getUserAvatarUrl(photoURL: string | null | undefined, seed: string): string {
  return photoURL || clayAvatarUrl(seed)
}
