import { useState } from 'react'
import { X, Star } from 'lucide-react'

export interface TopicFormData {
  moduleId: string
  name: string
  description?: string
  totalDuration?: number
  isImportant: boolean
  order: number
}

interface AddTopicDialogProps {
  open: boolean
  onClose: () => void
  moduleId: string
  topicCount: number
  onSubmit: (data: TopicFormData) => Promise<void>
}

export default function AddTopicDialog({
  open,
  onClose,
  moduleId,
  topicCount,
  onSubmit
}: AddTopicDialogProps): React.JSX.Element | null {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [totalDuration, setTotalDuration] = useState('')
  const [isImportant, setIsImportant] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!name.trim()) return

    setLoading(true)
    try {
      await onSubmit({
        moduleId,
        name: name.trim(),
        description: description.trim() || undefined,
        totalDuration: totalDuration ? parseInt(totalDuration) : undefined,
        isImportant,
        order: topicCount
      })

      // Reset form and close
      setName('')
      setDescription('')
      setTotalDuration('')
      setIsImportant(false)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-8 rounded-2xl max-w-md w-full relative animate-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Add Topic</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Topic Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Securitization"
              className="w-full px-4 py-2.5 bg-background border border-border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this topic..."
              rows={2}
              className="w-full px-4 py-2.5 bg-background border border-border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Estimated Duration (minutes, optional)
            </label>
            <input
              type="number"
              value={totalDuration}
              onChange={(e) => setTotalDuration(e.target.value)}
              placeholder="60"
              min="1"
              className="w-full px-4 py-2.5 bg-background border border-border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          {/* Important */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="important-topic"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-background"
            />
            <label
              htmlFor="important-topic"
              className="text-sm font-medium cursor-pointer flex items-center gap-1"
            >
              Mark as Important
              <Star className="w-4 h-4 text-amber-400" />
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
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {loading ? 'Adding...' : 'Add Topic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
