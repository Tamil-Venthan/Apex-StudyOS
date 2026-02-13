import { X, Upload } from 'lucide-react'
import { useState } from 'react'

export interface ImportedTopic {
  moduleId: string
  name: string
  description: string
  totalDuration: number | null
  order: number
  completed: boolean
  isImportant: boolean
}

interface ImportTopicsDialogProps {
  open: boolean
  onClose: () => void
  moduleId: string
  onSubmit: (topics: ImportedTopic[]) => Promise<void>
}

export default function ImportTopicsDialog({
  open,
  onClose,
  moduleId,
  onSubmit
}: ImportTopicsDialogProps): React.JSX.Element | null {
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setImporting(true)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter((line) => line.trim())

      if (lines.length === 0) {
        throw new Error('File is empty')
      }

      // Check if first line is header (contains common CSV headers)
      const firstLine = lines[0].toLowerCase()
      const hasHeader =
        firstLine.includes('name') || firstLine.includes('topic') || firstLine.includes('title')

      const dataLines = hasHeader ? lines.slice(1) : lines

      // Parse CSV
      const topics = dataLines.map((line, index) => {
        const parts = line.split(',').map((p) => p.trim())

        return {
          moduleId,
          name: parts[0] || `Topic ${index + 1}`,
          description: parts[1] || '',
          totalDuration: parts[2] ? parseInt(parts[2]) : null,
          order: index + 1,
          completed: false,
          isImportant: false
        }
      })

      if (topics.length === 0) {
        throw new Error('No topics found in file')
      }

      await onSubmit(topics)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import topics')
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = (): void => {
    const template = `Topic Name,Description,Duration (minutes)
Introduction to React,Basic concepts and setup,45
State Management,Understanding state and props,60
Hooks Deep Dive,useState and useEffect,90`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'topics-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Import Topics</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h3 className="font-semibold mb-2 text-sm">CSV Format</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Upload a CSV file with columns: Topic Name, Description, Duration (minutes)
            </p>
            <button
              onClick={downloadTemplate}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Upload className="w-3 h-3" />
              Download Template
            </button>
          </div>

          <div>
            <label
              htmlFor="topic-file-upload"
              className="block w-full p-8 border-2 border-dashed border-border dark:border-white/20 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer text-center"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload CSV file</p>
              <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
            </label>
            <input
              id="topic-file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={importing}
              className="hidden"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {importing && (
            <div className="text-center py-4">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Importing topics...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
