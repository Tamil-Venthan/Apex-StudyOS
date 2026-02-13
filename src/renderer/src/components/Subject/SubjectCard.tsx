import { useNavigate } from 'react-router-dom'
import { BookOpen, Trash2, Power, Calendar, AlertCircle } from 'lucide-react'
import { Subject } from '@renderer/stores/useSubjectStore'
import { motion } from 'framer-motion'

interface SubjectCardProps {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  targetDate?: string
  moduleCount: number
  progress: number
  archived?: boolean
  onDelete: (id: string) => void
  onUpdate: (id: string, data: Partial<Subject>) => Promise<{ success: boolean } | void>
}

export default function SubjectCard({
  id,
  name,
  description,
  color,
  icon,
  targetDate,
  moduleCount,
  progress,
  archived,
  onDelete,
  onUpdate
}: SubjectCardProps): React.JSX.Element {
  const navigate = useNavigate()

  // Calculate due date status
  const getDueDateStatus = (): { status: string; text: string; color: string } | null => {
    if (!targetDate) return null

    const now = new Date()
    const due = new Date(targetDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return {
        status: 'overdue',
        text: `${Math.abs(diffDays)}d overdue`,
        color: 'text-red-400 bg-red-500/10 border-red-500/20'
      }
    } else if (diffDays === 0) {
      return {
        status: 'today',
        text: 'Due today',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      }
    } else if (diffDays <= 7) {
      return {
        status: 'soon',
        text: `${diffDays}d left`,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      }
    } else {
      return {
        status: 'future',
        text: `${diffDays}d left`,
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      }
    }
  }

  const dueDateStatus = getDueDateStatus()

  return (
    <div
      className="glass-card-hover rounded-xl cursor-pointer group relative overflow-hidden h-full flex flex-col border border-border dark:border-white/5 dark:hover:border-white/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl"
      onClick={() => navigate(`/subjects/${id}`)}
      style={{
        // Subtle glow based on subject color
        boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 2px 10px -2px ${color}05`
      }}
    >
      {/* Dynamic Background Gradient */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 ease-out"
        style={{
          background: `radial-gradient(circle at top right, ${color}30 0%, transparent 60%)`
        }}
      />

      {/* Top Banner / Color Strip - Optional visual flair */}
      <div
        className="h-1 w-full opacity-30 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundColor: color }}
      />

      <div className="p-6 flex flex-col flex-1 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="relative w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner overflow-hidden border border-border dark:border-white/5"
            style={{ backgroundColor: `${color}15` }}
          >
            <div className="absolute inset-0 opacity-20" style={{ backgroundColor: color }} />
            <span className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
              {icon || '📚'}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
            <button
              onClick={async (e) => {
                e.stopPropagation()
                await onUpdate(id, { archived: !archived })
              }}
              className={`p-2 rounded-lg transition-colors ${
                archived
                  ? 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
                  : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
              }`}
              title={archived ? 'Enable Subject' : 'Disable Subject'}
            >
              <Power className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(id)
              }}
              className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 rounded-lg transition-colors"
              title="Delete Subject"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <div className="flex-1">
          <h3
            className={`text-lg font-bold mb-1.5 line-clamp-1 tracking-tight ${
              archived
                ? 'text-muted-foreground line-through decoration-white/20'
                : 'text-white group-hover:text-primary/90 transition-colors'
            }`}
          >
            {name}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground/80 mb-4 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-auto space-y-4 pt-2">
          {/* Visual Progress */}
          <div className="space-y-1.5">
            <div className="flex items-end justify-between text-xs">
              <span className="text-muted-foreground font-medium">Progress</span>
              <span className="font-bold text-white">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-black/20 rounded-full overflow-hidden border border-border dark:border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full relative"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>

          {/* Badges / Meta */}
          <div className="flex items-center justify-between pt-2 border-t border-border dark:border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 font-medium">
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                {moduleCount} {moduleCount === 1 ? 'module' : 'modules'}
              </span>
            </div>

            {targetDate && dueDateStatus && (
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${dueDateStatus.color}`}
              >
                {dueDateStatus.status === 'overdue' ? (
                  <AlertCircle className="w-3 h-3" />
                ) : (
                  <Calendar className="w-3 h-3" />
                )}
                <span>{dueDateStatus.text}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
