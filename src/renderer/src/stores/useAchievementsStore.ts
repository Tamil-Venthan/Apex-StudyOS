import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Award, Zap, Flame, GraduationCap, Moon } from 'lucide-react'

export type AchievementId = 'first_step' | 'on_fire' | 'scholar' | 'night_owl' | 'focus_master'

export interface Achievement {
  id: AchievementId
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }> // Lucide icon
  color: string
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Complete your first study session',
    icon: Award,
    color: 'text-blue-400'
  },
  {
    id: 'on_fire',
    title: 'On Fire',
    description: 'Achieve a 3-day study streak',
    icon: Flame,
    color: 'text-orange-400'
  },
  {
    id: 'scholar',
    title: 'Scholar',
    description: 'Study for a total of 10 hours',
    icon: GraduationCap,
    color: 'text-purple-400'
  },
  {
    id: 'focus_master',
    title: 'Focus Master',
    description: 'Log 50+ study sessions',
    icon: Zap,
    color: 'text-amber-400'
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Complete a study session after 10 PM',
    icon: Moon,
    color: 'text-indigo-400'
  }
]

export interface AchievementsState {
  unlockedIds: AchievementId[]
  recentlyUnlocked: AchievementId[] // Queue for toast notifications
  unlockAchievement: (id: AchievementId) => void
  clearRecentlyUnlocked: () => void
  checkAchievements: (stats: {
    totalSessions: number
    totalHours: number
    streak: number
    lastSessionTime?: Date
  }) => void
}

export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      unlockedIds: [],
      recentlyUnlocked: [],
      unlockAchievement: (id) => {
        const { unlockedIds, recentlyUnlocked } = get()
        if (!unlockedIds.includes(id)) {
          set({
            unlockedIds: [...unlockedIds, id],
            recentlyUnlocked: [...recentlyUnlocked, id]
          })
          console.log(`Achievement Unlocked: ${id}`)
        }
      },
      clearRecentlyUnlocked: () => {
        set({ recentlyUnlocked: [] })
      },
      checkAchievements: (stats) => {
        const { unlockedIds, unlockAchievement } = get()

        // 1. First Step
        if (stats.totalSessions >= 1 && !unlockedIds.includes('first_step')) {
          unlockAchievement('first_step')
        }

        // 2. On Fire (Streak)
        if (stats.streak >= 3 && !unlockedIds.includes('on_fire')) {
          unlockAchievement('on_fire')
        }

        // 3. Scholar (10 Hours)
        if (stats.totalHours >= 10 && !unlockedIds.includes('scholar')) {
          unlockAchievement('scholar')
        }

        // 4. Focus Master (50 Sessions)
        if (stats.totalSessions >= 50 && !unlockedIds.includes('focus_master')) {
          unlockAchievement('focus_master')
        }

        // 5. Night Owl
        if (stats.lastSessionTime) {
          const hour = stats.lastSessionTime.getHours()
          if (hour >= 22 || hour < 4) {
            // 10 PM to 4 AM
            if (!unlockedIds.includes('night_owl')) {
              unlockAchievement('night_owl')
            }
          }
        }
      }
    }),
    {
      name: 'achievements-store',
      partialize: (state) => ({ unlockedIds: state.unlockedIds }) // Don't persist recentlyUnlocked
    }
  )
)
