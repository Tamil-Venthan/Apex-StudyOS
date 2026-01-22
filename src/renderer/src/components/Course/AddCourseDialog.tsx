import { useState } from 'react'
import { X, Palette, AlertCircle } from 'lucide-react'
import { useCourseStore } from '@renderer/stores/useCourseStore'

interface AddCourseDialogProps {
  open: boolean
  onClose: () => void
}

const COLORS = [
  '#8B5CF6', // Purple (default for courses)
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#6366F1' // Indigo
]

const PLATFORMS = [
  'BCCA',
  'Tharuns Brainery',
  'Nikkhil Gupta',
  'KS Academy',
  'Shivangi Agrawal',
  'Banwar Borana',
  'ArivuPro',
  'Ara Education',
  'MEPL Classes',
  'SJC Institute',
  'Vishal Bhattad',
  'RR Academy',
  'Others'
]

export default function AddCourseDialog({
  open,
  onClose
}: AddCourseDialogProps): React.JSX.Element | null {
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState(PLATFORMS[0])
  const [instructor, setInstructor] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])

  const { createCourse, loading } = useCourseStore()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!name.trim()) return

    const result = await createCourse({
      name: name.trim(),
      platform: platform || undefined,
      instructor: instructor.trim() || undefined,
      description: description.trim() || undefined,
      color
    })

    if (result.success) {
      // Reset form and close
      setName('')
      setPlatform(PLATFORMS[0])
      setInstructor('')
      setDescription('')
      setColor(COLORS[0])
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-8 rounded-2xl max-w-md w-full relative animate-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Add Online Course</h2>

        {/* Error Message */}
        {useCourseStore.getState().error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {useCourseStore.getState().error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Course Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., CMA final - Strategic Financial Management"
              className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
              required
            />
          </div>

          {/* Platform */}
          <div>
            <label className="block text-sm font-medium mb-2">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Instructor */}
          <div>
            <label className="block text-sm font-medium mb-2">Instructor (optional)</label>
            <input
              type="text"
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              placeholder=" "
              className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the course..."
              rows={3}
              className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-all resize-none"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Choose Color
            </label>
            <div className="grid grid-cols-8 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
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
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {loading ? 'Adding...' : 'Add Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
