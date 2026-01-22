import { ReactNode, useEffect } from 'react'
import Sidebar from './Sidebar'
import UpdatePopup from '../UpdatePopup'
import TitleBar from '../TitleBar'
import { useUIStore } from '@renderer/stores/useUIStore'
import { useSettingsStore } from '@renderer/stores/useSettingsStore'
import { useTimerTick } from '@renderer/stores/useTimerStore'
import { cn } from '@renderer/lib/utils'

interface MainLayoutProps {
  children: ReactNode
}

// Enable global timer tick
// moved inside

export default function MainLayout({ children }: MainLayoutProps): React.JSX.Element {
  const { isSidebarCollapsed } = useUIStore()
  const { theme, compactLayout, showAnimations, glassmorphicEffects } = useSettingsStore()

  // Enable global timer tick
  useTimerTick()

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else if (theme === 'light') {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    } else {
      // Auto: use system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (isDark) {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
      }
    }
  }, [theme])

  // Apply glassmorphic effects globally
  useEffect(() => {
    if (!glassmorphicEffects) {
      document.documentElement.classList.add('no-glass')
    } else {
      document.documentElement.classList.remove('no-glass')
    }
  }, [glassmorphicEffects])

  return (
    <div className="min-h-screen bg-background text-foreground pt-8 border border-border dark:border-white/10">
      <TitleBar />
      <Sidebar />
      <main
        className={cn(
          'transition-all ease-in-out',
          isSidebarCollapsed ? 'ml-20' : 'ml-64',
          compactLayout ? 'p-4' : 'p-8',
          showAnimations ? 'duration-300' : 'duration-0'
        )}
      >
        {children}
      </main>
      <UpdatePopup />
    </div>
  )
}
