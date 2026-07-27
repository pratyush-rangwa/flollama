import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
  User,
} from "@react-native-firebase/auth";
import { GoogleSignin, isSuccessResponse } from "@react-native-google-signin/google-signin";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { logger } from "@/lib/logger";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  /**
   * Native equivalent of the web's signInWithPopup: get an ID token from
   * Google Sign-In natively, then hand it to Firebase as a credential.
   * signInWithPopup has no native equivalent, so this replaces it entirely.
   */
  const login = async () => {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response) || !response.data.idToken) {
      throw new Error("Google Sign-In did not return an ID token");
    }
    const credential = GoogleAuthProvider.credential(response.data.idToken);
    await signInWithCredential(auth, credential);
  };

  const logout = async () => {
    try {
      await GoogleSignin.signOut();
    } catch (err) {
      logger.warn("GoogleSignin.signOut failed (continuing to sign out of Firebase)", err);
    }
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
