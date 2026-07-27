/**
 * Native Firebase wiring (@react-native-firebase/*), not the web `firebase`
 * JS SDK used in next/src/firebase/firebase.js — the JS SDK can't drive
 * native Google Sign-In credential flows or reliable background persistence.
 *
 * @react-native-firebase auto-initializes the default app from
 * google-services.json / GoogleService-Info.plist (see app.json), so there's
 * no initializeApp() call here — just the module handles other files import.
 */
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

export function configureGoogleSignIn(webClientId: string) {
  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
  });
}

export { auth, firestore };
