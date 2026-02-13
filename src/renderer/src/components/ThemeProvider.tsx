import { useEffect } from 'react'
import { useSettingsStore } from '@renderer/stores/useSettingsStore'

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const theme = useSettingsStore((state) => state.theme)

  useEffect(() => {
    // Apply theme on mount and whenever it changes
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    } else {
      // Auto: use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
      }
    }
  }, [theme])

  return <>{children}</>
}
