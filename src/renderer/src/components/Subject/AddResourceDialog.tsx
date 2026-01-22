import { useState, useEffect } from 'react'
import { X, Link as LinkIcon, FileText, Image, Video } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AddResourceDialogProps {
  open: boolean
  onClose: () => void
  topicId: string
  onSubmit: (data: { topicId: string; title: string; type: string; url: string }) => Promise<void>
}

export default function AddResourceDialog({
  open,
  onClose,
  topicId,
  onSubmit
}: AddResourceDialogProps): React.JSX.Element {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState('link')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setTitle('')
      setUrl('')
      setType('link')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return

    try {
      setIsSubmitting(true)
      await onSubmit({
        topicId,
        title: title.trim(),
        type,
        url: url.trim()
      })
      onClose()
    } catch (error) {
      console.error('Failed to add resource:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeIcon = (t: string): React.JSX.Element => {
    switch (t) {
      case 'link':
        return <LinkIcon className="w-4 h-4" />
      case 'pdf':
        return <FileText className="w-4 h-4" />
      case 'image':
        return <Image className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      default:
        return <LinkIcon className="w-4 h-4" />
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border dark:border-white/10 rounded-xl shadow-2xl z-50 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Add Resource</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Cheat Sheet, Video Tutorial"
                  className="w-full bg-background border border-border dark:border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary transition-colors"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {['link', 'pdf', 'video', 'image'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-sm transition-all ${
                        type === t
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-background border-border dark:border-white/10 text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      {getTypeIcon(t)}
                      <span className="capitalize">{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">URL / Link</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-background border border-border dark:border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary transition-colors font-mono text-sm"
                />
              </div>

              <div className="flex justify-end pt-2">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!title.trim() || !url.trim() || isSubmitting}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Resource'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
