import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import {
  useAchievementsStore,
  ACHIEVEMENTS,
  Achievement
} from '@renderer/stores/useAchievementsStore'

export default function AchievementToast(): React.JSX.Element {
  const { recentlyUnlocked, clearRecentlyUnlocked } = useAchievementsStore()
  const [currentAchievementId, setCurrentAchievementId] = useState<string | null>(null)

  useEffect(() => {
    if (recentlyUnlocked.length > 0) {
      setCurrentAchievementId(recentlyUnlocked[0])
      clearRecentlyUnlocked()
    }
    // We want to run this when recentlyUnlocked changes.
    // The clearRecentlyUnlocked action will cause a re-render with empty array,
    // which effectively stops the loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentlyUnlocked])

  const handleDismiss = (): void => {
    setCurrentAchievementId(null)
  }

  // Auto dismiss after 5 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (currentAchievementId) {
      timer = setTimeout(() => {
        handleDismiss()
      }, 5000)
    }
    return (): void => {
      if (timer) clearTimeout(timer)
    }
  }, [currentAchievementId])

  const achievement: Achievement | undefined = currentAchievementId
    ? ACHIEVEMENTS.find((a) => a.id === currentAchievementId)
    : undefined

  if (!achievement) return <></>

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, x: '-50%' }}
        animate={{ opacity: 1, y: 0, x: '-50%' }}
        exit={{ opacity: 0, y: 20, x: '-50%' }}
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="glass-card p-4 rounded-xl shadow-2xl border border-yellow-500/30 bg-black/80 backdrop-blur-md flex items-center gap-4 min-w-[320px]">
          <div className={`p-3 rounded-full bg-yellow-500/20 ${achievement.color}`}>
            <achievement.icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">
              Achievement Unlocked!
            </h4>
            <h3 className="text-white font-bold">{achievement.title}</h3>
            <p className="text-muted-foreground text-sm">{achievement.description}</p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
