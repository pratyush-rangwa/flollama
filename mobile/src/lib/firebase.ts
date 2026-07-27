/**
 * Native Firebase wiring (@react-native-firebase/*), not the web `firebase`
 * JS SDK used in next/src/firebase/firebase.js — the JS SDK can't drive
 * native Google Sign-In credential flows or reliable background persistence.
 *
 * @react-native-firebase auto-initializes the default app from
 * google-services.json / GoogleService-Info.plist (see app.json). Uses the
 * modular API (matching the Firebase Web SDK's v9+ shape) — the namespaced
 * API (`auth()`, `firestore()`) is deprecated as of react-native-firebase v22
 * and slated for removal, so new code should always go through here.
 */
import { getAuth } from "@react-native-firebase/auth";
import { getFirestore } from "@react-native-firebase/firestore";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

export function configureGoogleSignIn(webClientId: string) {
  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
  });
}

export const auth = getAuth();
export const firestore = getFirestore();
