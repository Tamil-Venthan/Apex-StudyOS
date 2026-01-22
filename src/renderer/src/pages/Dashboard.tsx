import { useEffect, useMemo } from 'react'
import { useSubjectStore, Subject, Module, Topic } from '@renderer/stores/useSubjectStore'
import { useCourseStore } from '@renderer/stores/useCourseStore'

import { useAnalyticsStore } from '@renderer/stores/useAnalyticsStore'
import { useAchievementsStore } from '@renderer/stores/useAchievementsStore'
import AchievementsSection from '@renderer/components/AchievementsSection'
import AchievementToast from '@renderer/components/AchievementToast'
import { useSettingsStore } from '@renderer/stores/useSettingsStore'

import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  GraduationCap,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  Zap,
  Flame,
  Clock3,
  AlertCircle,
  Activity
} from 'lucide-react'

export default function Dashboard(): React.JSX.Element {
  const navigate = useNavigate()
  const { subjects, fetchSubjects } = useSubjectStore()
  const { courses, fetchCourses } = useCourseStore()

  const { fetchStats, sessions, fetchSessions, calculateStreak } = useAnalyticsStore()
  const { checkAchievements } = useAchievementsStore()
  const { examName, examDate } = useSettingsStore()

  useEffect(() => {
    const init = async (): Promise<void> => {
      await Promise.all([
        fetchSubjects('user-1'),
        fetchCourses('user-1'),
        fetchStats('user-1'),
        fetchSessions('user-1')
      ])
    }
    init()
  }, [fetchSubjects, fetchCourses, fetchStats, fetchSessions])

  // Calculate analytics
  const todayStudyTime = sessions
    .filter((s) => {
      const today = new Date().toDateString()
      return new Date(s.completedAt).toDateString() === today
    })
    .reduce((acc, s) => acc + s.duration, 0)

  const hours = Math.floor(todayStudyTime / 3600)
  const minutes = Math.floor((todayStudyTime % 3600) / 60)
  const studyTimeDisplay = `${hours}h ${minutes}m`

  const streak = calculateStreak()

  // Calculate aggregate stats for achievements
  const totalStudyDuration = sessions.reduce((acc, s) => acc + s.duration, 0)
  const totalHours = totalStudyDuration / 3600
  // Ideally, find max date
  const lastSessionTime = useMemo(() => {
    return sessions.length > 0
      ? new Date(Math.max(...sessions.map((s) => new Date(s.completedAt).getTime())))
      : undefined
  }, [sessions])

  // triggered check on load/update
  useEffect(() => {
    checkAchievements({
      totalSessions: sessions.length,
      totalHours,
      streak,
      lastSessionTime
    })
  }, [sessions, streak, checkAchievements, totalHours, lastSessionTime])

  // Calculate stats
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

  const totalClasses = courses.reduce((acc, c) => acc + c.totalClasses, 0)
  const attendedClasses = courses.reduce((acc, c) => acc + c.attendedClasses, 0)
  const pendingClasses = Math.max(0, totalClasses - attendedClasses)

  const stats = [
    {
      title: 'Subjects',
      value: subjects.length,
      icon: BookOpen,
      color: 'bg-blue-500',
      action: () => navigate('/subjects')
    },
    {
      title: 'Courses',
      value: courses.length,
      icon: GraduationCap,
      color: 'bg-purple-500',
      action: () => navigate('/classes')
    },

    {
      title: 'Progress',
      value: `${overallProgress}%`,
      icon: TrendingUp,
      color: 'bg-amber-500',
      action: () => navigate('/analytics')
    }
  ]

  // Countdown Logic
  const getCountdown = (): { days: number; hours: number } | null => {
    if (!examDate) return null
    const target = new Date(examDate)
    const now = new Date()
    const diff = target.getTime() - now.getTime()

    if (diff <= 0) return { days: 0, hours: 0 }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const remhours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return { days, hours: remhours }
  }

  const countdown = getCountdown()

  return (
    <div className="space-y-6">
      <AchievementToast />
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold">Welcome to Apex Study Tracker</h1>
        <p className="text-muted-foreground text-lg">
          Your complete study companion for CMA/CA exam preparation
        </p>
      </motion.div>

      {/* Exam Countdown Hero */}
      {countdown && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Clock className="w-32 h-32" />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">{examName || 'Upcoming Exam'}</h2>
              <p className="text-muted-foreground opacity-80">
                Target Date: {new Date(examDate!).toDateString()}
              </p>
            </div>
            <div className="text-right flex gap-8 pr-4">
              <div className="text-center">
                <div className="text-5xl font-bold font-mono text-white">{countdown.days}</div>
                <div className="text-xs uppercase tracking-widest text-indigo-300 mt-1">Days</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold font-mono text-white">{countdown.hours}</div>
                <div className="text-xs uppercase tracking-widest text-indigo-300 mt-1">Hours</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={stat.action}
            className="glass-card p-6 rounded-xl cursor-pointer hover:bg-white/5 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`p-3 rounded-lg ${stat.color}/20 group-hover:${stat.color}/30 transition-colors`}
              >
                <stat.icon className={`w-6 h-6 text-white`} />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.title}</div>
          </motion.div>
        ))}
      </div>

      {/* New Widgets: Focus, Streak, Quick Start */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Focus */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Clock3 className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold text-lg">Study Time Today</h3>
          </div>
          <div className="text-4xl font-bold font-mono my-2">{studyTimeDisplay}</div>
          <p className="text-sm text-muted-foreground">Keep up the momentum!</p>
        </motion.div>

        {/* Current Streak */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="font-semibold text-lg">Current Streak</h3>
          </div>
          <div className="text-4xl font-bold font-mono my-2">{streak} Days</div>
          <p className="text-sm text-muted-foreground">You&apos;re on fire! 🔥</p>
        </motion.div>

        {/* Quick Start */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          onClick={() => navigate('/timer')}
          className="glass-card p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 cursor-pointer hover:bg-green-500/20 transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="font-semibold text-lg">Quick Start</h3>
          </div>
          <div className="text-2xl font-bold my-3 group-hover:translate-x-1 transition-transform">
            Start Focus Session &rarr;
          </div>
          <p className="text-sm text-muted-foreground">Jump right into deep work</p>
        </motion.div>
      </div>

      {/* Achievements Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <AchievementsSection />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Progress */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Subject Progress</h2>
            <button
              onClick={() => navigate('/subjects')}
              className="text-sm text-primary hover:underline"
            >
              View All
            </button>
          </div>
          {subjects.length > 0 ? (
            <div className="space-y-4">
              {subjects.slice(0, 3).map((subject: Subject) => {
                const subjectTopics =
                  subject.modules?.reduce(
                    (acc: number, m: Module) => acc + (m.topics?.length || 0),
                    0
                  ) || 0
                const subjectCompleted =
                  subject.modules?.reduce(
                    (acc: number, m: Module) =>
                      acc + (m.topics?.filter((t: Topic) => t.completed).length || 0),
                    0
                  ) || 0
                const progress = subjectTopics > 0 ? (subjectCompleted / subjectTopics) * 100 : 0

                return (
                  <div key={subject.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{subject.icon || '📚'}</span>
                        <span className="font-medium">{subject.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: subject.color
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No subjects yet</p>
              <button
                onClick={() => navigate('/subjects')}
                className="mt-3 text-primary hover:underline text-sm"
              >
                Add your first subject
              </button>
            </div>
          )}
        </motion.div>

        {/* Pending Classes */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Pending Classes
            </h2>
            <button
              onClick={() => navigate('/classes')}
              className="text-sm text-primary hover:underline"
            >
              View All
            </button>
          </div>
          {pendingClasses > 0 ? (
            <div className="space-y-3">
              <div className="text-center py-4">
                <div className="text-5xl font-bold text-amber-400 mb-2">{pendingClasses}</div>
                <p className="text-muted-foreground">Classes pending</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400">{attendedClasses}</div>
                  <div className="text-xs text-muted-foreground">Attended</div>
                </div>
                <div className="glass-card p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold">{totalClasses}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
          ) : totalClasses > 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-400" />
              <p className="text-green-400 font-semibold">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1">No pending classes</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No courses yet</p>
              <button
                onClick={() => navigate('/classes')}
                className="mt-3 text-primary hover:underline text-sm"
              >
                Add your first course
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Upcoming Deadlines & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Upcoming Deadlines
            </h2>
          </div>
          {(() => {
            interface DeadlineItem {
              id: string
              title: string
              date: Date
              daysUntil: number
              type: 'exam' | 'subject' | 'class'
              color: string
              bgColor: string
            }
            const upcomingDeadlines: DeadlineItem[] = []

            // Add exam deadline
            if (examDate) {
              const daysUntil = Math.ceil(
                (new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              )
              if (daysUntil >= 0 && daysUntil <= 30) {
                upcomingDeadlines.push({
                  id: 'exam',
                  title: examName || 'Exam',
                  date: new Date(examDate),
                  daysUntil,
                  type: 'exam',
                  color: 'text-red-400',
                  bgColor: 'bg-red-500/10'
                })
              }
            }

            // Add subject deadlines (target dates)
            subjects.forEach((subject) => {
              if (subject.targetDate) {
                const targetDate = new Date(subject.targetDate)
                const daysUntil = Math.ceil(
                  (targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                )
                if (daysUntil >= 0 && daysUntil <= 30) {
                  upcomingDeadlines.push({
                    id: `subject-${subject.id}`,
                    title: subject.name,
                    date: targetDate,
                    daysUntil,
                    type: 'subject',
                    color: daysUntil <= 7 ? 'text-amber-400' : 'text-blue-400',
                    bgColor: daysUntil <= 7 ? 'bg-amber-500/10' : 'bg-blue-500/10'
                  })
                }
              }
            })

            // Add class deadlines (scheduled classes)
            courses.forEach((course) => {
              if (course.classes) {
                course.classes.forEach((classItem) => {
                  if (classItem.scheduledAt && classItem.status !== 'attended') {
                    const scheduledDate = new Date(classItem.scheduledAt)
                    const daysUntil = Math.ceil(
                      (scheduledDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    )
                    if (daysUntil >= 0 && daysUntil <= 30) {
                      upcomingDeadlines.push({
                        id: `class-${classItem.id}`,
                        title: classItem.title,
                        date: scheduledDate,
                        daysUntil,
                        type: 'class',
                        color: daysUntil <= 3 ? 'text-purple-400' : 'text-purple-300',
                        bgColor: 'bg-purple-500/10'
                      })
                    }
                  }
                })
              }
            })

            // Sort by days until
            upcomingDeadlines.sort((a, b) => a.daysUntil - b.daysUntil)

            return upcomingDeadlines.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                {upcomingDeadlines.slice(0, 5).map((deadline) => (
                  <div
                    key={deadline.id}
                    onClick={() => {
                      if (deadline.type === 'exam') navigate('/settings')
                      else if (deadline.type === 'class') navigate('/classes')
                      else navigate('/subjects')
                    }}
                    className={`p-3 rounded-lg ${deadline.bgColor} hover:opacity-80 transition-all cursor-pointer border border-border dark:border-white/5`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {deadline.type === 'exam' ? (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          ) : deadline.type === 'class' ? (
                            <GraduationCap className="w-4 h-4 text-purple-400" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-blue-400" />
                          )}
                          <span className="font-medium">{deadline.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {deadline.date.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${deadline.color}`}>
                          {deadline.daysUntil === 0 ? 'Today!' : `${deadline.daysUntil}d`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {deadline.daysUntil === 0 ? 'Due today' : 'days left'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No upcoming deadlines</p>
              </div>
            )
          })()}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Recent Activity
            </h2>
          </div>
          {(() => {
            interface ActivityItem {
              id: string
              type: 'session' | 'topic'
              icon: typeof Clock3
              title: string
              subtitle: string
              time: Date
              color: string
              bgColor: string
            }
            const recentActivities: ActivityItem[] = []

            // Add recent study sessions
            sessions.slice(0, 5).forEach((session) => {
              const hours = Math.floor(session.duration / 3600)
              const minutes = Math.floor((session.duration % 3600) / 60)
              const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

              recentActivities.push({
                id: `session-${session.id}`,
                type: 'session',
                icon: Clock3,
                title: `Studied ${timeStr}`,
                subtitle: session.subject?.name || 'General Study',
                time: new Date(session.completedAt),
                color: 'text-green-400',
                bgColor: 'bg-green-500/10'
              })
            })

            // Sort by time (most recent first)
            recentActivities.sort((a, b) => b.time.getTime() - a.time.getTime())

            return recentActivities.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                {recentActivities.slice(0, 5).map((activity) => {
                  const timeAgo = getTimeAgo(activity.time)
                  return (
                    <div
                      key={activity.id}
                      className={`p-3 rounded-lg ${activity.bgColor} border border-border dark:border-white/5`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg ${activity.bgColor}`}>
                          <activity.icon className={`w-4 h-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{activity.title}</div>
                          <p className="text-xs text-muted-foreground truncate">
                            {activity.subtitle}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <button
                  onClick={() => navigate('/timer')}
                  className="mt-3 text-primary hover:underline text-sm"
                >
                  Start studying now
                </button>
              </div>
            )
          })()}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass-card p-4 rounded-xl"
      >
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/subjects')}
            className="p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg flex items-center gap-2 transition-colors group"
          >
            <div className="p-1.5 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
              <Plus className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-xs font-medium">Add Subject</span>
          </button>
          <button
            onClick={() => navigate('/classes')}
            className="p-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg flex items-center gap-2 transition-colors group"
          >
            <div className="p-1.5 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
              <Plus className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-xs font-medium">Add Course</span>
          </button>
          <button
            onClick={() => navigate('/analytics')}
            className="p-3 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg flex items-center gap-2 transition-colors group"
          >
            <div className="p-1.5 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-colors">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-xs font-medium">View Analytics</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString()
}
