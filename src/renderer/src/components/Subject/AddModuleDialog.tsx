import { useState } from 'react'
import { X } from 'lucide-react'

interface ModuleFormData {
  subjectId: string
  name: string
  description?: string
  order: number
}

interface AddModuleDialogProps {
  open: boolean
  onClose: () => void
  subjectId: string
  moduleCount: number
  onSubmit: (data: ModuleFormData) => Promise<{ success: boolean } | void>
}

export default function AddModuleDialog({
  open,
  onClose,
  subjectId,
  moduleCount,
  onSubmit
}: AddModuleDialogProps): React.JSX.Element | null {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!name.trim()) return

    setLoading(true)
    try {
      const result = await onSubmit({
        subjectId,
        name: name.trim(),
        description: description.trim() || undefined,
        order: moduleCount
      })

      if (result && result.success) {
        // Reset form and close
        setName('')
        setDescription('')
        onClose()
      }
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

        <h2 className="text-2xl font-bold mb-6">Add Module</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Module Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Chapter 1 - Investment Decisions"
              className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this module..."
              rows={3}
              className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
            />
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
              {loading ? 'Adding...' : 'Add Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
