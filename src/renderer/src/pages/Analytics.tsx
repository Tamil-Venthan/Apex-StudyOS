import { useEffect, useState } from 'react'
import { useSubjectStore, Topic } from '@renderer/stores/useSubjectStore'
import { useCourseStore } from '@renderer/stores/useCourseStore'

import { motion } from 'framer-motion'
import {
  BookOpen,
  GraduationCap,
  TrendingUp,
  Star,
  Target,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Calendar,
  Clock,
  Flame,
  BarChart3
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { useAnalyticsStore, StudySession } from '@renderer/stores/useAnalyticsStore'

// Helper function to get daily data (last 7 days)
function getDailyData(sessions: StudySession[]): { day: string; hours: number }[] {
  const dailyData: { day: string; hours: number }[] = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' } as const)
    // Use local date string for comparison to avoid timezone issues (same as getWeeklyData)
    const localDateStr = date.toLocaleDateString('en-CA') // YYYY-MM-DD in local time

    const daySeconds = sessions
      .filter((s) => new Date(s.completedAt).toLocaleDateString('en-CA') === localDateStr)
      .reduce((sum, s) => sum + s.duration, 0)

    dailyData.push({
      day: dayName,
      hours: daySeconds / 3600
    })
  }

  return dailyData
}

// Helper function to get productive hours data
function getProductiveHoursData(sessions: StudySession[]): { hour: string; sessions: number }[] {
  const hourCounts: Record<number, number> = {}

  // Initialize all hours
  for (let i = 0; i < 24; i++) {
    hourCounts[i] = 0
  }

  // Count sessions by hour
  sessions.forEach((session) => {
    const hour = new Date(session.completedAt).getHours()
    hourCounts[hour]++
  })

  // Convert to chart data
  return Object.entries(hourCounts)
    .map(([hour, count]) => ({
      hour: `${hour.padStart(2, '0')}:00`,
      sessions: count
    }))
    .filter((item) => item.sessions > 0) // Only show hours with activity
}

export default function Analytics(): React.JSX.Element {
  const { subjects, fetchSubjects } = useSubjectStore()
  const { courses, fetchCourses } = useCourseStore()

  const { stats, sessions, fetchStats, fetchSessions, getWeeklyData, calculateStreak } =
    useAnalyticsStore()
  const [loading, setLoading] = useState(true)
  const [timeView, setTimeView] = useState<'daily' | 'weekly'>('weekly')

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      await Promise.all([
        fetchSubjects(),
        fetchCourses(),

        fetchStats('user-1'),
        fetchSessions('user-1', 365) // Last 365 days for heatmap
      ])
      setLoading(false)
    }
    loadData()
  }, [fetchSubjects, fetchCourses, fetchStats, fetchSessions])

  const streak = calculateStreak()

  // Calculate statistics
  const totalSubjects = subjects.length
  const totalCourses = courses.length

  const totalTopics = subjects.reduce(
    (acc, s) => acc + (s.modules?.reduce((a, m) => a + (m.topics?.length || 0), 0) || 0),
    0
  )
  const completedTopics = subjects.reduce(
    (acc, s) =>
      acc +
      (s.modules?.reduce(
        (a, m) => a + (m.topics?.filter((t: Topic) => t.completed).length || 0),
        0
      ) || 0),
    0
  )

  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

  const importantTopics = subjects.reduce(
    (acc, s) =>
      acc +
      (s.modules?.reduce(
        (a, m) => a + (m.topics?.filter((t: Topic) => t.isImportant).length || 0),
        0
      ) || 0),
    0
  )

  // Data for Charts
  const subjectProgressData = subjects
    .map((s) => {
      const sTopics = s.modules?.reduce((acc, m) => acc + (m.topics?.length || 0), 0) || 0
      const sCompleted =
        s.modules?.reduce(
          (acc, m) => acc + (m.topics?.filter((t) => t.completed).length || 0),
          0
        ) || 0
      return {
        name: s.name,
        completed: sCompleted,
        remaining: sTopics - sCompleted,
        color: s.color
      }
    })
    .filter((d) => d.completed + d.remaining > 0)

  const attendanceData = courses
    .map((c) => ({
      name: c.name,
      attended: c.attendedClasses,
      missed: c.totalClasses - c.attendedClasses,
      color: c.color
    }))
    .filter((d) => d.attended + d.missed > 0)

  // Format time helper
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  // Calculate daily activity for heatmap (last 365 days)
  const getHeatmapData = (): { date: Date; count: number; level: number }[] => {
    const data: { date: Date; count: number; level: number }[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 364; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const localDateStr = date.toLocaleDateString('en-CA')

      const minutes = sessions
        .filter((s) => new Date(s.completedAt).toLocaleDateString('en-CA') === localDateStr)
        .reduce((sum, s) => sum + s.duration / 60, 0)

      let level = 0
      if (minutes > 0) level = 1
      if (minutes >= 30) level = 2
      if (minutes >= 60) level = 3
      if (minutes >= 120) level = 4

      data.push({ date, count: minutes, level })
    }
    return data
  }

  const heatmapData = getHeatmapData()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics & Study Time</h1>
        <p className="text-muted-foreground mt-1">
          Track your study progress, sessions, and insights
        </p>
      </div>

      {/* Study Time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 bg-opacity-10">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Focus Time</p>
            <p className="text-3xl font-bold">{formatTime(stats?.totalFocusMinutes || 0)}</p>
            <p className="text-xs text-muted-foreground">
              {stats?.sessionsThisWeek || 0} sessions this week
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 rounded-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 bg-opacity-10">
              <Target className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Sessions</p>
            <p className="text-3xl font-bold">{stats?.totalSessions?.toString() || '0'}</p>
            <p className="text-xs text-muted-foreground">
              {stats?.sessionsToday || 0} completed today
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 bg-opacity-10">
              <Flame className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Study Streak</p>
            <p className="text-3xl font-bold">{`${streak} ${streak === 1 ? 'day' : 'days'}`}</p>
            <p className="text-xs text-muted-foreground">
              {streak > 0 ? 'Keep it going! 🔥' : 'Start today!'}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 rounded-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 bg-opacity-10">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Overall Progress</p>
            <p className="text-3xl font-bold">{overallProgress}%</p>
            <p className="text-xs text-muted-foreground">Topics completed</p>
          </div>
        </motion.div>
      </div>

      {/* Activity Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card p-6 rounded-xl overflow-hidden"
      >
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Study Consistency</h2>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[800px]">
            <div className="flex gap-1">
              {Array.from({ length: 53 }).map((_, weekIndex) => (
                <div key={weekIndex} className="grid grid-rows-7 gap-1">
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const dataIndex = weekIndex * 7 + dayIndex
                    if (dataIndex >= heatmapData.length) return null

                    const day = heatmapData[dataIndex]
                    const colors = [
                      'bg-white/5',
                      'bg-green-900/40',
                      'bg-green-700/60',
                      'bg-green-500/80',
                      'bg-green-400'
                    ]

                    return (
                      <div
                        key={dayIndex}
                        className={`w-3 h-3 rounded-sm ${colors[day.level]} transition-colors hover:ring-1 hover:ring-white/50`}
                        title={`${day.date.toLocaleDateString()}: ${Math.round(day.count)} minutes`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
            <div className="flex justify-end items-center gap-2 mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-white/5" />
                <div className="w-3 h-3 rounded-sm bg-green-900/40" />
                <div className="w-3 h-3 rounded-sm bg-green-700/60" />
                <div className="w-3 h-3 rounded-sm bg-green-500/80" />
                <div className="w-3 h-3 rounded-sm bg-green-400" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Study Time Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6 rounded-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Study Time Trends</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeView('daily')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeView === 'daily'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimeView('weekly')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeView === 'weekly'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>

        {(() => {
          const chartData = timeView === 'weekly' ? getWeeklyData() : getDailyData(sessions)
          return chartData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="#ffffff50"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#ffffff50"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    label={{
                      value: 'Hours',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: '#ffffff50' }
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e1e1e',
                      borderRadius: '8px',
                      border: 'none'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#studyGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No study data available for the selected period
            </div>
          )
        })()}
      </motion.div>

      {/* Productive Hours Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6 rounded-xl"
      >
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-semibold">Most Productive Hours</h3>
        </div>

        {(() => {
          const hourlyData = getProductiveHoursData(sessions)
          return hourlyData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    stroke="#ffffff50"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#ffffff50"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    label={{
                      value: 'Sessions',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: '#ffffff50' }
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{
                      backgroundColor: '#1e1e1e',
                      borderRadius: '8px',
                      border: 'none'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="sessions" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No session data available
            </div>
          )
        })()}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Progress Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.55 }}
          className="glass-card p-6 rounded-xl min-h-[400px]"
        >
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Subject Completion Breakdown</h3>
          </div>

          {subjectProgressData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectProgressData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="completed"
                  >
                    {subjectProgressData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e1e1e',
                      borderRadius: '8px',
                      border: 'none'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </motion.div>

        {/* Attendance Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6 rounded-xl min-h-[400px]"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChartIcon className="w-5 h-5 text-secondary" />
            <h3 className="text-lg font-semibold">Class Attendance Overview</h3>
          </div>

          {attendanceData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#ffffff50"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{
                      backgroundColor: '#1e1e1e',
                      borderRadius: '8px',
                      border: 'none'
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="attended"
                    name="Attended"
                    fill="#4ade80"
                    radius={[4, 4, 0, 0]}
                    stackId="a"
                  />
                  <Bar
                    dataKey="missed"
                    name="Missed/Pending"
                    fill="#ffffff20"
                    radius={[4, 4, 0, 0]}
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="glass-card p-6 rounded-xl"
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Recent Sessions</h2>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium mb-1">No sessions yet</p>
              <p className="text-sm">Complete a Pomodoro timer session to see it here</p>
            </div>
          ) : (
            sessions
              .slice(0, 10)
              .map((session) => <SessionRow key={session.id} session={session} />)
          )}
        </div>
      </motion.div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: BookOpen,
            title: 'Total Subjects',
            value: totalSubjects,
            desc: 'Active subjects'
          },
          {
            icon: GraduationCap,
            title: 'Active Courses',
            value: totalCourses,
            desc: 'Online courses'
          },
          {
            icon: Star,
            title: 'Important Topics',
            value: importantTopics,
            desc: 'Flagged for review'
          },
          {
            icon: Target,
            title: 'Completed Topics',
            value: completedTopics,
            desc: `${totalTopics} total topics`
          }
        ].map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 + index * 0.05 }}
            className="glass-card p-5 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/5 rounded-lg">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold mb-0.5">{item.value}</div>
                <div className="text-sm font-medium mb-0.5">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Session Row Component
interface SessionRowProps {
  session: {
    id: string
    completedAt: Date
    duration: number
    subject?: { name: string; color: string }
  }
}

function SessionRow({ session }: SessionRowProps): React.JSX.Element {
  const formatDate = (date: Date): string => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const dateStr = new Date(date).toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (dateStr === todayStr) return 'Today'
    if (dateStr === yesterdayStr) return 'Yesterday'
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
    >
      <div
        className="w-1 h-12 rounded-full"
        style={{ backgroundColor: session.subject?.color || '#3B82F6' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{session.subject?.name || 'General Study'}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            {Math.round(session.duration / 60)} min
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDate(session.completedAt)} at {formatTime(session.completedAt)}
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-xs text-primary">✓ Completed</div>
      </div>
    </motion.div>
  )
}
