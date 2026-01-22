import { useState } from 'react'
import { X, Upload, AlertCircle, CheckCircle, Info } from 'lucide-react'

interface ClassFormData {
  courseId: string
  title: string
  type: string
  isImportant: boolean
  scheduledAt?: Date
}

interface ImportClassesDialogProps {
  open: boolean
  onClose: () => void
  courseId: string
  onSubmit: (data: ClassFormData) => Promise<{ success: boolean } | void>
}

export default function ImportClassesDialog({
  open,
  onClose,
  courseId,
  onSubmit
}: ImportClassesDialogProps): React.JSX.Element | null {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleImport = async (): Promise<void> => {
    if (!text.trim()) return

    setLoading(true)
    setError(null)

    // Split by newlines and filter empty lines
    const lines = text.split('\n').filter((line) => line.trim().length > 0)

    if (lines.length === 0) {
      setError('No valid classes found in text')
      setLoading(false)
      return
    }

    setProgress({ current: 0, total: lines.length })

    try {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        // Skip if seemingly empty
        if (!line) continue

        // Parse format: Title | Date | Time
        // Example: Class 1 | 2024-02-01 | 10:00
        const parts = line.split('|').map((p) => p.trim())

        const title = parts[0]
        let scheduledAt: Date | undefined = undefined

        if (parts.length >= 2) {
          // Try parse date
          const dateStr = parts[1]
          const timeStr = parts[2] || '00:00' // Default time if missing

          try {
            // Combine date and time
            const dateTimeStr = `${dateStr}T${timeStr}`
            const date = new Date(dateTimeStr)

            if (!isNaN(date.getTime())) {
              scheduledAt = date
            }
          } catch {
            // Ignore date errors, just import as unscheduled
          }
        }

        const result = await onSubmit({
          courseId,
          title: title,
          type: 'recorded', // Default type
          isImportant: false,
          scheduledAt
        })

        if (!result || !result.success) {
          throw new Error('Failed to create class')
        }

        setProgress((prev) => ({ ...prev, current: i + 1 }))
        // Small delay
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      setText('')
      onClose()
    } catch {
      setError('Failed to import some classes. Please check format.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-8 rounded-2xl max-w-2xl w-full relative animate-in">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Upload className="w-6 h-6 text-primary" />
          Bulk Import Classes
        </h2>

        <div className="mb-6 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-secondary mb-1">Format Guide</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Enter each class on a new line using this format:
              </p>
              <code className="text-xs bg-black/30 p-2 rounded block font-mono">
                Class Title | YYYY-MM-DD | HH:MM
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                Example:{' '}
                <span className="font-mono text-white/70">
                  Introduction to Physics | 2026-03-15 | 10:30
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            placeholder={`Lecture 1: Basics | 2026-03-10 | 09:00\nLecture 2: Advanced | 2026-03-12 | 14:00\nLecture 3: Review`}
            rows={10}
            className="w-full px-4 py-3 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none font-mono text-sm"
          />

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing...</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Imported {progress.current} of {progress.total} classes
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading || !text.trim()}
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>Importing...</>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Import Classes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
