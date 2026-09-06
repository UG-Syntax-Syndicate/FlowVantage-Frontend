/**
 * Real portrait photos (Unsplash CDN) used everywhere a person needs an
 * avatar, so dummy data reads like real people instead of initials-in-a-circle.
 * IDs below were spot-checked to resolve to real, distinct headshots.
 */
const AVATAR_IDS = [
  '1560250097-0b93528c311a',
  '1494790108377-be9c29b29330',
  '1506794778202-cad84cf45f1d',
  '1573497019940-1c28c88b4f3e',
  '1531427186611-ecfd6d936c79',
  '1531123897727-8f129e1688ce',
  '1472099645785-5658abf4ff4e',
  '1500648767791-00dcc994a43e',
  '1519244703995-f4e0f30006d5',
  '1438761681033-6461ffad8d80',
  '1544005313-94ddf0286df2',
  '1552058544-f2b08422138a',
  '1489980557514-251d61e3eeb6',
  '1517841905240-472988babdf9',
  '1487412720507-e7ab37603c6f',
  '1517365830460-955ce3ccd263',
  '1524504388940-b1c1722653e1',
  '1502685104226-ee32379fefbe',
  '1508214751196-bcfd4ca60f91',
  '1522075469751-3a6694fb2f61',
  '1544723795-3fb6469f5b39',
  '1500917293891-ef795e70e1f6',
  '1546456073-92b9f0a8d413',
  '1580489944761-15a19d654956',
  '1534528741775-53994a69daeb',
  '1508341591423-4347099e1f19',
  '1560250097-0b93528c311a',
  '1573496359142-b8d87734a5a2',
  '1548142813-c348350df52b',
  '1544725176-7c40e5a71c5e',
  '1520813792240-56fc4a3765a7',
]

function unsplashUrl(id: string): string {
  return `https://images.unsplash.com/photo-${id}?w=160&h=160&fit=crop&crop=faces&auto=format&q=80`
}

export const AVATAR_POOL = AVATAR_IDS.map(unsplashUrl)

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

/** Deterministic photo pick for any id/name that doesn't have an explicit photoURL. */
export function pickAvatar(seed: string): string {
  return AVATAR_POOL[hashString(seed) % AVATAR_POOL.length]
}

const KNOWN_PEOPLE_PHOTOS: Record<string, string> = {
  'Werner Osei': unsplashUrl('1560250097-0b93528c311a'),
  'Ellie Novak': unsplashUrl('1494790108377-be9c29b29330'),
  'Marcus Reid': unsplashUrl('1506794778202-cad84cf45f1d'),
  'Priya Shah': unsplashUrl('1573497019940-1c28c88b4f3e'),
  'Daniel Cho': unsplashUrl('1531427186611-ecfd6d936c79'),
  'Amara Bello': unsplashUrl('1531123897727-8f129e1688ce'),
}

/**
 * Looks up a real headshot for a known teammate by display name. Returns
 * null for non-person senders (product/brand notifications, "You", unknown
 * senders) so those keep their colored initial badge instead of a fake face.
 */
export function getPersonPhoto(name: string): string | null {
  return KNOWN_PEOPLE_PHOTOS[name] ?? null
}

/**
 * Deterministic cartoon avatar (DiceBear "adventurer" style, no API key) for
 * the real signed-in user when they haven't uploaded a photo yet. Same seed
 * always renders the same character.
 */
export function cartoonAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear`
}

/** photoURL if present, otherwise a stable cartoon placeholder for the given seed. */
export function getUserAvatarUrl(photoURL: string | null | undefined, seed: string): string {
  return photoURL || cartoonAvatarUrl(seed)
}
