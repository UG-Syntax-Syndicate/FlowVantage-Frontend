import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

// Local dev only: routes Auth calls to a local emulator (see `npm run
// emulators`) so test sign-ups never touch the real Firebase project.
// Firestore is deliberately NOT emulated - a signup still writes a real
// users/{uid} doc and audit-log entries there. Storage isn't used at all
// (images upload straight to Cloudinary - see src/lib/cloudinaryUpload.ts).
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
}

export const googleProvider = new GoogleAuthProvider()

export const microsoftProvider = new OAuthProvider('microsoft.com')
microsoftProvider.setCustomParameters({ prompt: 'select_account', tenant: 'common' })
