import React, { createContext, useContext, useEffect, useState } from "react"
import { storage } from "@wxt-dev/storage"
import { APP_THEME } from "@/utils/storage.constants"

export type Theme = "dark" | "light" | "system";

type Themes = {
  dark: Theme
  light: Theme
  system: Theme
}

export const themes: Themes = {
  dark: "dark",
  light: "light",
  system: "system",
}

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    storage.getItem<Theme>(APP_THEME).then((value) => {
      setTheme(value || defaultTheme);
    });
  }, []);

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      storage.setItem(APP_THEME, theme).finally(() => {
        setTheme(theme);
      });
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
