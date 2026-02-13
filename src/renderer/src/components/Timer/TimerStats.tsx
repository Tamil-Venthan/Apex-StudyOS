import { Clock, Target, TrendingUp, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface TimerStatsProps {
  totalFocusTime: number // in seconds
  sessionsCompleted: number
}

export default function TimerStats({
  totalFocusTime,
  sessionsCompleted
}: TimerStatsProps): React.JSX.Element {
  const [todayStats, setTodayStats] = useState({
    focusMinutes: 0,
    sessions: 0,
    streak: 0
  })

  useEffect(() => {
    // Fetch today's stats from database
    const fetchStats = async (): Promise<void> => {
      try {
        const result = await window.electron.ipcRenderer.invoke('sessions:getToday', 'user-1')
        if (result.success) {
          const sessions = result.data
          const totalMinutes = sessions.reduce(
            (acc: number, s: { duration?: number }) => acc + (s.duration || 0),
            0
          )
          setTodayStats({
            focusMinutes: Math.floor(totalMinutes / 60), // Convert seconds to minutes
            sessions: sessions.length,
            streak: sessions.length > 0 ? Math.floor(sessions.length / 4) + 1 : 0
          })
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }

    fetchStats()
  }, [totalFocusTime, sessionsCompleted])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const stats = [
    {
      icon: Clock,
      label: 'Focus Time Today',
      value: `${todayStats.focusMinutes} min`,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      icon: Target,
      label: 'Sessions Completed',
      value: todayStats.sessions.toString(),
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      icon: TrendingUp,
      label: 'Current Streak',
      value: `${todayStats.streak} ${todayStats.streak === 1 ? 'cycle' : 'cycles'}`,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      icon: Calendar,
      label: 'Active Timer',
      value: formatTime(totalFocusTime),
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
