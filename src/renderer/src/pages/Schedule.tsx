import { useEffect, useState, ReactNode } from 'react'
import { useSubjectStore } from '@renderer/stores/useSubjectStore'
import { useCourseStore } from '@renderer/stores/useCourseStore'

import { motion } from 'framer-motion'
import { Calendar, Clock, Target, BookOpen, AlertCircle, Video } from 'lucide-react'

interface TimelineItem {
  type: 'subject' | 'course' | 'class'
  title: string
  date: Date
  icon: ReactNode | string
  color: string
  description: string
  isClass?: boolean
}

export default function Schedule(): React.JSX.Element {
  const { subjects, fetchSubjects } = useSubjectStore()
  const { courses, fetchCourses } = useCourseStore()

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      await Promise.all([fetchSubjects('user-1'), fetchCourses('user-1')])
      setLoading(false)
    }
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Collect all deadlines
  const upcomingItems: TimelineItem[] = []

  // Subject target dates
  subjects.forEach((subject) => {
    if (subject.targetDate) {
      upcomingItems.push({
        type: 'subject',
        title: subject.name,
        date: new Date(subject.targetDate),
        icon: subject.icon || '📚',
        color: subject.color,
        description: 'Subject target date'
      })
    }
  })

  // Course dates
  courses.forEach((course) => {
    if (course.endDate) {
      upcomingItems.push({
        type: 'course',
        title: course.name,
        date: new Date(course.endDate),
        icon: '🎓',
        color: course.color,
        description: 'Course end date'
      })
    }

    // Class schedules
    if (course.classes) {
      course.classes.forEach((appClass) => {
        if (appClass.scheduledAt) {
          upcomingItems.push({
            type: 'class',
            title: appClass.title,
            date: new Date(appClass.scheduledAt),
            icon: <Video className="w-5 h-5" />,
            color: course.color,
            description: `${course.name} • ${appClass.type}`,
            isClass: true
          })
        }
      })
    }
  })

  // Sort by date
  upcomingItems.sort((a, b) => a.date.getTime() - b.date.getTime())

  // Group by time periods
  const now = new Date()
  const today = upcomingItems.filter((item) => {
    const itemDate = new Date(item.date)
    return (
      itemDate.getDate() === now.getDate() &&
      itemDate.getMonth() === now.getMonth() &&
      itemDate.getFullYear() === now.getFullYear()
    )
  })

  const thisWeek = upcomingItems.filter((item) => {
    const diff = item.date.getTime() - now.getTime()
    const days = diff / (1000 * 60 * 60 * 24)
    return days > 0 && days <= 7
  })

  const thisMonth = upcomingItems.filter((item) => {
    const diff = item.date.getTime() - now.getTime()
    const days = diff / (1000 * 60 * 60 * 24)
    return days > 7 && days <= 30
  })

  const later = upcomingItems.filter((item) => {
    const diff = item.date.getTime() - now.getTime()
    const days = diff / (1000 * 60 * 60 * 24)
    return days > 30
  })

  const overdue = upcomingItems.filter((item) => item.date.getTime() < now.getTime())

  // Pending classes count
  const totalClasses = courses.reduce((acc, c) => acc + c.totalClasses, 0)
  const attendedClasses = courses.reduce((acc, c) => acc + c.attendedClasses, 0)
  const pendingClasses = Math.max(0, totalClasses - attendedClasses)

  // Incomplete topics
  const totalTopics = subjects.reduce(
    (acc, s) => acc + (s.modules?.reduce((a, m) => a + (m.topics?.length || 0), 0) || 0),
    0
  )
  const completedTopics = subjects.reduce(
    (acc, s) =>
      acc +
      (s.modules?.reduce((a, m) => a + (m.topics?.filter((t) => t.completed).length || 0), 0) || 0),
    0
  )
  const pendingTopics = totalTopics - completedTopics

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
        <h1 className="text-3xl font-bold">Schedule & Timeline</h1>
        <p className="text-muted-foreground mt-1">Your upcoming deadlines and study plan</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{pendingClasses}</div>
              <div className="text-sm text-muted-foreground">Pending Classes</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{pendingTopics}</div>
              <div className="text-sm text-muted-foreground">Pending Topics</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{upcomingItems.length}</div>
              <div className="text-sm text-muted-foreground">Upcoming Deadlines</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Overdue Items */}
      {overdue.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 rounded-xl border-2 border-red-500/30"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-400" />
            Overdue ({overdue.length})
          </h2>
          <div className="space-y-2">
            {overdue.map((item, idx) => (
              <DeadlineItem key={idx} item={item} isOverdue />
            ))}
          </div>
        </motion.div>
      )}

      {/* Today */}
      {today.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 rounded-xl"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-green-400" />
            Today ({today.length})
          </h2>
          <div className="space-y-2">
            {today.map((item, idx) => (
              <DeadlineItem key={idx} item={item} />
            ))}
          </div>
        </motion.div>
      )}

      {/* This Week */}
      {thisWeek.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 rounded-xl"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-amber-400" />
            This Week ({thisWeek.length})
          </h2>
          <div className="space-y-2">
            {thisWeek.map((item, idx) => (
              <DeadlineItem key={idx} item={item} />
            ))}
          </div>
        </motion.div>
      )}

      {/* This Month */}
      {thisMonth.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6 rounded-xl"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            This Month ({thisMonth.length})
          </h2>
          <div className="space-y-2">
            {thisMonth.map((item, idx) => (
              <DeadlineItem key={idx} item={item} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Later */}
      {later.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-6 rounded-xl"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            Later ({later.length})
          </h2>
          <div className="space-y-2">
            {later.map((item, idx) => (
              <DeadlineItem key={idx} item={item} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {upcomingItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 rounded-xl text-center"
        >
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-xl font-semibold mb-2">No Upcoming Deadlines</h3>
          <p className="text-muted-foreground">
            Add target dates to subjects and courses to see them here
          </p>
        </motion.div>
      )}
    </div>
  )
}

function DeadlineItem({
  item,
  isOverdue
}: {
  item: TimelineItem
  isOverdue?: boolean
}): React.JSX.Element {
  const daysUntil = Math.ceil((item.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const dateStr = item.date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  const timeStr = item.isClass
    ? item.date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    : null

  return (
    <div
      className={`p-4 rounded-lg transition-colors ${
        isOverdue ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5 hover:bg-white/10'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="text-2xl p-2 rounded-lg flex items-center justify-center w-12 h-12"
            style={{ backgroundColor: `${item.color}20` }}
          >
            {item.icon}
          </div>
          <div className="flex-1">
            <div className="font-medium flex items-center gap-2">
              {item.title}
              {item.isClass && (
                <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                  Class
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{item.description}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-semibold ${isOverdue ? 'text-red-400' : ''}`}>
            {timeStr ? <span className="text-primary block text-lg mb-1">{timeStr}</span> : null}
            {dateStr}
          </div>
          {!isOverdue && daysUntil > 0 && (
            <div className="text-xs text-muted-foreground">
              {daysUntil <= 1 && daysUntil > 0 ? 'Tomorrow' : `in ${daysUntil} days`}
            </div>
          )}
          {isOverdue && (
            <div className="text-xs text-red-400">{Math.abs(daysUntil)} days overdue</div>
          )}
        </div>
      </div>
    </div>
  )
}
