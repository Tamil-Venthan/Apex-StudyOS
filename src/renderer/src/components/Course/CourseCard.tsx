import { useNavigate } from 'react-router-dom'
import { GraduationCap, Trash2 } from 'lucide-react'
import { useState } from 'react'
import ConfirmationDialog from '@renderer/components/ConfirmationDialog'

interface CourseCardProps {
  id: string
  name: string
  platform?: string
  instructor?: string
  color: string
  totalClasses: number
  attendedClasses: number
  onDelete: (id: string) => void
}

export default function CourseCard({
  id,
  name,
  platform,
  instructor,
  color,
  totalClasses,
  attendedClasses,
  onDelete
}: CourseCardProps): React.JSX.Element {
  const navigate = useNavigate()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const attendancePercentage =
    totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0

  const pendingClasses = totalClasses - attendedClasses

  return (
    <div
      className="glass-card-hover p-6 rounded-xl cursor-pointer group relative overflow-hidden"
      onClick={() => navigate(`/classes/${id}`)}
      style={{ borderColor: `${color}20` }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity"
        style={{
          background: `linear-gradient(135deg, ${color}00 0%, ${color} 100%)`
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="text-3xl p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
            🎓
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowDeleteConfirm(true)
            }}
            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold mb-2 line-clamp-1">{name}</h3>

        {/* Platform & Instructor */}
        <div className="text-sm text-muted-foreground mb-4 space-y-1">
          {platform && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span>{platform}</span>
            </div>
          )}
          {instructor && <div className="line-clamp-1">{instructor}</div>}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Attendance</span>
            <span className="text-sm font-semibold">{attendancePercentage}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${attendancePercentage}%`,
                backgroundColor: color
              }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">{attendedClasses}</span>
            <span className="text-muted-foreground/70"> / {totalClasses}</span>
            <span className="text-muted-foreground ml-1">attended</span>
          </div>
          {pendingClasses > 0 && (
            <div className="flex items-center gap-1 text-amber-400">
              <GraduationCap className="w-4 h-4" />
              <span>{pendingClasses} pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => onDelete(id)}
        title="Delete Course"
        description={`Are you sure you want to delete "${name}"? This will also delete all associated classes. This action cannot be undone.`}
        confirmText="Delete Course"
        variant="danger"
      />
    </div>
  )
}
