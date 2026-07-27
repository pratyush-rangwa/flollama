import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme, useColorScheme } from "nativewind";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import { ThemeColors, ThemeMode, getColors } from "@/theme";

const STORAGE_KEY = "flollama:theme";

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setColorScheme } = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = (await AsyncStorage.getItem(STORAGE_KEY)) as ThemeMode | null;
      const initial = saved ?? (Appearance.getColorScheme() === "light" ? "light" : "dark");
      setMode(initial);
      setColorScheme(initial);
      setReady(true);
    })();
  }, []);

  const setTheme = (next: ThemeMode) => {
    setMode(next);
    setColorScheme(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const toggleTheme = () => setTheme(mode === "dark" ? "light" : "dark");

  if (!ready) return null;

  return (
    <ThemeContext.Provider
      value={{
        mode,
        isDark: mode === "dark",
        colors: getColors(mode),
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

// Escape hatch for non-component call sites (rare — prefer useTheme()).
export function setAppColorScheme(mode: ThemeMode) {
  colorScheme.set(mode);
}
