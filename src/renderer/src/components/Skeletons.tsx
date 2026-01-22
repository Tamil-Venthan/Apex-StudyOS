import { motion } from 'framer-motion'

interface SkeletonCardProps {
  count?: number
}

export function SkeletonCard(): React.JSX.Element {
  return (
    <div className="glass-card p-6 rounded-xl">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-white/10 rounded w-3/4"></div>
        <div className="h-3 bg-white/5 rounded w-1/2"></div>
        <div className="h-2 bg-white/10 rounded-full w-full"></div>
        <div className="flex gap-2">
          <div className="h-3 bg-white/5 rounded w-16"></div>
          <div className="h-3 bg-white/5 rounded w-16"></div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonCards({ count = 3 }: SkeletonCardProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <SkeletonCard />
        </motion.div>
      ))}
    </div>
  )
}

export function SkeletonList(): React.JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card p-4 rounded-xl"
        >
          <div className="animate-pulse flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-3/4"></div>
              <div className="h-3 bg-white/5 rounded w-1/2"></div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
