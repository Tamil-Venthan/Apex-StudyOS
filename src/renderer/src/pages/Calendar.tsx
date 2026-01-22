import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  GraduationCap,
  Flame,
  X
} from 'lucide-react'
import { useSubjectStore } from '@renderer/stores/useSubjectStore'
import { useCourseStore, Class } from '@renderer/stores/useCourseStore'
import { useAnalyticsStore } from '@renderer/stores/useAnalyticsStore'
import { useSettingsStore } from '@renderer/stores/useSettingsStore'

type EventType = 'class' | 'session' | 'deadline' | 'exam'

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: EventType
  color: string
}

export default function Calendar(): React.JSX.Element {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const { subjects, fetchSubjects } = useSubjectStore()
  const { courses, fetchCourses } = useCourseStore()
  const { sessions, fetchSessions } = useAnalyticsStore()
  const { examDate, examName } = useSettingsStore()

  // Initial Fetch
  useEffect(() => {
    fetchSubjects('user-1')
    fetchCourses('user-1')
    fetchSessions('user-1')
  }, [fetchSubjects, fetchCourses, fetchSessions])

  // Generate Calendar Grid
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  })

  // Aggregate Events
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const events: CalendarEvent[] = []
    const checkDate = new Date(date).toDateString()

    // 1. Exam Date
    if (examDate && new Date(examDate).toDateString() === checkDate) {
      events.push({
        id: 'exam',
        title: examName || 'Exam Day',
        date: new Date(examDate),
        type: 'exam',
        color: 'bg-red-500'
      })
    }

    // 2. Classes (Pending & Attended)
    courses.forEach((course) => {
      // Logic for batches/classes would go here.
      // For now, let's mock using "classes" array if it had dates.
      // Since specific class scheduling isn't fully robust in dummy data,
      // we'll visualize attended classes based on 'attendedAt' if available,
      // or scheduledAt.
      course.classes?.forEach((cls: Class) => {
        // Using any to bypass strict type check for now if scheduledAt is missing on type
        if (cls.scheduledAt) {
          const classDate = new Date(cls.scheduledAt)
          // Compare dates by resetting time to midnight to avoid potential timezone/formatting issues
          const classDateStr = classDate.toDateString()

          if (classDateStr === checkDate) {
            events.push({
              id: cls.id,
              title: cls.title,
              date: classDate,
              type: 'class',
              color: 'bg-purple-500'
            })
          }
        }
      })
    })

    // 3. Subject Deadlines
    subjects.forEach((subject) => {
      if (subject.targetDate && new Date(subject.targetDate).toDateString() === checkDate) {
        events.push({
          id: `deadline-${subject.id}`,
          title: `${subject.name} Target`,
          date: new Date(subject.targetDate),
          type: 'deadline',
          color: 'bg-amber-500'
        })
      }
    })

    // 5. Study Sessions (History)
    sessions.forEach((session) => {
      if (new Date(session.completedAt).toDateString() === checkDate) {
        // Avoid duplicate dots for multiple sessions, maybe just show one generic "Studied" event or aggregate
        // For simplicity, we add one event per session but UI can group them
        events.push({
          id: session.id,
          title: `${Math.round(session.duration / 60)}m Study`,
          date: new Date(session.completedAt),
          type: 'session',
          color: 'bg-green-500'
        })
      }
    })

    return events
  }

  const handlePrevMonth = (): void => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = (): void => setCurrentDate(addMonths(currentDate, 1))
  const handleToday = (): void => setCurrentDate(new Date())

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-mono">{format(currentDate, 'MMMM yyyy')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 glass-card rounded-xl overflow-hidden flex flex-col">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-border dark:border-white/10 bg-white/5">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-medium text-muted-foreground uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
          {calendarDays.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isDayToday = isToday(day)
            const events = getEventsForDate(day)

            // Group sessions to avoid clutter
            const sessionCount = events.filter((e) => e.type === 'session').length
            const otherEvents = events.filter((e) => e.type !== 'session')

            return (
              <div
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={`
                            min-h-[100px] border-b border-r border-border dark:border-white/5 p-2 transition-all hover:bg-white/5 cursor-pointer relative
                            ${!isCurrentMonth ? 'bg-black/20 opacity-50' : ''}
                            ${selectedDate && isSameDay(day, selectedDate) ? 'bg-primary/10 ring-1 ring-inset ring-primary' : ''}
                        `}
              >
                <div
                  className={`
                            text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1
                            ${isDayToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}
                        `}
                >
                  {format(day, 'd')}
                </div>

                {/* Events Markers */}
                <div className="space-y-1">
                  {otherEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`
                                        text-[10px] px-1.5 py-0.5 rounded-sm truncate flex items-center gap-1
                                        ${event.type === 'exam' ? 'bg-red-500/20 text-red-200 border border-red-500/30' : ''}
                                        ${event.type === 'deadline' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' : ''}
                                        ${event.type === 'class' ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30' : ''}
                                    `}
                      title={event.title}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${event.color}`}></span>
                      {event.title}
                    </div>
                  ))}

                  {/* Session Compact View */}
                  {sessionCount > 0 && (
                    <div className="text-[10px] px-1.5 py-0.5 rounded-sm bg-green-500/10 text-green-300 border border-green-500/20 flex items-center gap-1">
                      <Clock className="w-2 h-2" />
                      {sessionCount} Sessions
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card p-6 rounded-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedEvent.color}/20`}>
                    {selectedEvent.type === 'exam' && <GraduationCap className="w-5 h-5" />}
                    {selectedEvent.type === 'class' && <BookOpen className="w-5 h-5" />}
                    {selectedEvent.type === 'deadline' && <Flame className="w-5 h-5" />}

                    {selectedEvent.type === 'session' && <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{selectedEvent.type}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {selectedEvent.date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                {selectedEvent.type === 'exam' && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-200">
                      📚 Your {selectedEvent.title} is scheduled for this day. Make sure you&apos;re
                      well prepared!
                    </p>
                  </div>
                )}

                {selectedEvent.type === 'session' && (
                  <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-green-200">✅ Study session completed</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Date Info Panel */}
      <AnimatePresence>
        {selectedDate && !selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedDate(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card p-6 rounded-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{format(selectedDate, 'MMMM d, yyyy')}</h3>
                  <p className="text-sm text-muted-foreground">{format(selectedDate, 'EEEE')}</p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {(() => {
                const dayEvents = getEventsForDate(selectedDate)
                return (
                  <div className="space-y-4">
                    {dayEvents.length > 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''} on this day
                        </p>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              onClick={() => {
                                setSelectedDate(null)
                                setSelectedEvent(event)
                              }}
                              className={`p-3 rounded-lg ${event.color}/10 border border-${event.color.replace('bg-', '')}/20 hover:bg-white/5 cursor-pointer transition-colors`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${event.color}`}></span>
                                <span className="font-medium">{event.title}</span>
                              </div>
                              <p className="text-xs text-muted-foreground capitalize mt-1 ml-4">
                                {event.type}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-muted-foreground mb-4">
                          No events scheduled for this day
                        </p>
                      </div>
                    )}
                  </div>
                )
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
