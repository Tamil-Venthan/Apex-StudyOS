import { motion } from 'framer-motion'
import { Award, Lock } from 'lucide-react'
import { useAchievementsStore, ACHIEVEMENTS } from '@renderer/stores/useAchievementsStore'

export default function AchievementsSection(): React.JSX.Element {
  const { unlockedIds } = useAchievementsStore()

  return (
    <div className="glass-card p-6 rounded-xl">
      <div className="flex items-center gap-2 mb-6">
        <Award className="w-5 h-5 text-yellow-500" />
        <h2 className="text-xl font-semibold">Achievements</h2>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 ml-auto">
          {unlockedIds.length} / {ACHIEVEMENTS.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {ACHIEVEMENTS.map((achievement, index) => {
          const isUnlocked = unlockedIds.includes(achievement.id)

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative p-4 rounded-xl border transition-all ${
                isUnlocked
                  ? 'bg-white/5 border-white/10 hover:border-yellow-500/30'
                  : 'bg-black/20 border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-yellow-500/10' : 'bg-white/5'}`}>
                  {isUnlocked ? (
                    <achievement.icon className={`w-5 h-5 ${achievement.color}`} />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              <div>
                <h3
                  className={`font-semibold mb-1 ${
                    isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {achievement.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {achievement.description}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
