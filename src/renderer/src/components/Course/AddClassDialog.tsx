import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export interface ClassFormData {
  id?: string
  courseId: string
  title: string
  description?: string
  type: string
  videoUrl?: string
  duration?: number
  isImportant: boolean
  scheduledAt?: Date | null
  status?: string
}

interface AddClassDialogProps {
  open: boolean
  onClose: () => void
  courseId: string
  initialData?: ClassFormData
  onSubmit: (data: ClassFormData) => Promise<{ success: boolean } | void>
}

const CLASS_TYPES = [
  { value: 'recorded', label: 'Recorded' },
  { value: 'live', label: 'Live' },
  { value: 'doubt_session', label: 'Doubt Session' }
]

export default function AddClassDialog({
  open,
  onClose,
  courseId,
  initialData,
  onSubmit
}: AddClassDialogProps): React.JSX.Element | null {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('recorded')
  const [videoUrl, setVideoUrl] = useState('')
  const [duration, setDuration] = useState('')
  const [isImportant, setIsImportant] = useState(false)

  // Scheduling state
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && initialData) {
      setTitle(initialData.title)
      setDescription(initialData.description || '')
      setType(initialData.type)
      setVideoUrl(initialData.videoUrl || '')
      setDuration(initialData.duration?.toString() || '')
      setIsImportant(initialData.isImportant)

      if (initialData.scheduledAt) {
        const date = new Date(initialData.scheduledAt)
        setScheduledDate(date.toISOString().split('T')[0])
        setScheduledTime(date.toTimeString().slice(0, 5))
      } else {
        setScheduledDate('')
        setScheduledTime('')
      }
    } else if (open) {
      // Reset logic for new entry
      setTitle('')
      setDescription('')
      setType('recorded')
      setVideoUrl('')
      setDuration('')
      setIsImportant(false)
      setScheduledDate('')
      setScheduledTime('')
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!title.trim()) return

    setLoading(true)
    try {
      let scheduledAt: Date | undefined = undefined
      if (scheduledDate) {
        scheduledAt = new Date(scheduledDate)
        if (scheduledTime) {
          const [hours, minutes] = scheduledTime.split(':').map(Number)
          scheduledAt.setHours(hours, minutes)
        }
      }

      const result = await onSubmit({
        id: initialData?.id,
        courseId,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        videoUrl: videoUrl.trim() || undefined,
        duration: duration ? parseInt(duration) : undefined,
        isImportant,
        scheduledAt
      })

      if (result && result.success) {
        // Reset form on success (optional, as onClose usually triggers unmount/hide)
        onClose()
      } else if (!result) {
        // Fallback for void returns (legacy)
        onClose()
      }

      // If result.success is false, we keep dialog open.
      // Ideally show error, but store handles error state showing in parent or need to expose it here?
      // CourseStore sets error state. AddCourseDialog showed it. AddClassDialog doesn't show store error yet.
      // We should probably add error display here too.
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-8 rounded-2xl max-w-md w-full relative animate-in max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">{initialData ? 'Edit Class' : 'Add Class'}</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Class Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Lecture 1 - Introduction to Accounting"
              className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this class..."
              rows={2}
              className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-all resize-none"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Class Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
            >
              {CLASS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Schedule Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                disabled={!scheduledDate}
                className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-sm font-medium mb-2">Video URL (optional)</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium mb-2">Duration (minutes, optional)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="60"
              min="1"
              className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
            />
          </div>

          {/* Important */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="important"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-background"
            />
            <label htmlFor="important" className="text-sm font-medium cursor-pointer">
              Mark as Important ⭐
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {loading ? 'Saving...' : initialData ? 'Update Class' : 'Add Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
