import { useState } from 'react'
import { X, Upload, AlertCircle, CheckCircle, FileText } from 'lucide-react'

interface ImportModulesDialogProps {
  open: boolean
  onClose: () => void
  subjectId: string
  onSubmit: (data: {
    subjectId: string
    name: string
    order: number
  }) => Promise<{ success: boolean } | void>
  currentModuleCount: number
}

export default function ImportModulesDialog({
  open,
  onClose,
  subjectId,
  onSubmit,
  currentModuleCount
}: ImportModulesDialogProps): React.JSX.Element | null {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  if (!open) return null

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if it's a CSV file
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError('Please select a CSV or TXT file')
      return
    }

    setFileName(file.name)
    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setText(content)
    }
    reader.onerror = () => {
      setError('Failed to read file')
      setFileName(null)
    }
    reader.readAsText(file)
  }

  // Parse CSV or simple text format
  const parseInput = (input: string): Array<{ name: string; topics?: Array<{ name: string }> }> => {
    const lines = input.split('\n').filter((line) => line.trim().length > 0)
    const moduleMap = new Map<string, Array<{ name: string }>>()

    for (const line of lines) {
      // Check if line contains a comma (CSV format)
      if (line.includes(',')) {
        const [moduleName, topicName] = line.split(',').map((s) => s.trim())
        if (moduleName && topicName) {
          if (!moduleMap.has(moduleName)) {
            moduleMap.set(moduleName, [])
          }
          moduleMap.get(moduleName)!.push({ name: topicName })
        }
      } else {
        // Simple format - just module names
        const moduleName = line.trim()
        if (moduleName && !moduleMap.has(moduleName)) {
          moduleMap.set(moduleName, [])
        }
      }
    }

    // Convert map to array
    return Array.from(moduleMap.entries()).map(([name, topics]) => ({
      name,
      topics: topics.length > 0 ? topics : undefined
    }))
  }

  const handleImport = async (): Promise<void> => {
    if (!text.trim()) return

    setLoading(true)
    setError(null)

    try {
      const modules = parseInput(text)

      if (modules.length === 0) {
        setError('No valid modules found in input')
        setLoading(false)
        return
      }

      // Check if we have CSV format (modules with topics)
      const hasTopics = modules.some((m) => m.topics && m.topics.length > 0)

      if (hasTopics) {
        // Use bulk import API
        const result = await window.electron.ipcRenderer.invoke('modules:bulkImport', {
          subjectId,
          modules,
          startOrder: currentModuleCount + 1
        })

        if (!result.success) {
          setError(result.error || 'Failed to import modules')
          return
        }
      } else {
        // Use simple import (backward compatible)
        setProgress({ current: 0, total: modules.length })
        let orderCounter = currentModuleCount + 1

        for (let i = 0; i < modules.length; i++) {
          const result = await onSubmit({
            subjectId,
            name: modules[i].name,
            order: orderCounter++
          })

          if (result && !result.success) {
            throw new Error('Failed to create module')
          }

          setProgress((prev) => ({ ...prev, current: i + 1 }))
          await new Promise((resolve) => setTimeout(resolve, 50))
        }
      }

      // Success
      setText('')
      onClose()
    } catch {
      setError('Failed to import. Please check your format and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-8 rounded-2xl max-w-2xl w-full relative animate-in max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Upload className="w-6 h-6 text-primary" />
          Import Modules & Topics
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Paste your data below. Supports both simple text and CSV format.
        </p>

        <div className="space-y-4">
          {/* Format Instructions */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-3">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-blue-400 mt-0.5" />
              <div className="flex-1 text-sm">
                <div className="font-medium text-blue-400 mb-2">Supported Formats:</div>
                <div className="space-y-3 text-muted-foreground">
                  <div>
                    <div className="font-medium text-white/90 mb-1">
                      Simple Format (Modules Only):
                    </div>
                    <pre className="bg-black/20 p-2 rounded text-xs font-mono">
                      {`Module 1: Introduction\nModule 2: Advanced Topics\nModule 3: Final Review`}
                    </pre>
                  </div>
                  <div>
                    <div className="font-medium text-white/90 mb-1">
                      CSV Format (Modules + Topics):
                    </div>
                    <pre className="bg-black/20 p-2 rounded text-xs font-mono">
                      {`Algebra, Introduction to Variables\nAlgebra, Linear Equations\nCalculus, Limits\nCalculus, Derivatives`}
                    </pre>
                    <div className="text-xs mt-1 italic">
                      Format: Module Name, Topic Name (one per line)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* File Upload Button */}
          <div className="flex items-center gap-3">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                disabled={loading}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm">
                <Upload className="w-4 h-4" />
                {fileName ? `Selected: ${fileName}` : 'Choose CSV File'}
              </div>
            </label>
            {fileName && (
              <button
                onClick={() => {
                  setText('')
                  setFileName(null)
                }}
                disabled={loading}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="relative">
            <div className="absolute -top-3 left-3 px-2 bg-[#0a0e27] text-xs text-muted-foreground">
              Or paste text below
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
              placeholder={`Module 1: Introduction\n\nOr use CSV format:\nAlgebra, Variables\nAlgebra, Equations...`}
              rows={12}
              className="w-full px-4 py-3 bg-background border border-border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none font-mono text-sm"
            />
          </div>

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
                {progress.total > 0 && (
                  <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                )}
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 animate-pulse"
                  style={{
                    width:
                      progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '100%'
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {progress.total > 0
                  ? `Imported ${progress.current} of ${progress.total} modules`
                  : 'Processing your import...'}
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
                  Import Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
