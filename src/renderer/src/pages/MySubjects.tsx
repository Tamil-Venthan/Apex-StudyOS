import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search } from 'lucide-react'
import { useSubjectStore, Subject } from '@renderer/stores/useSubjectStore'
import AddSubjectDialog from '@renderer/components/Subject/AddSubjectDialog'
import SubjectCard from '@renderer/components/Subject/SubjectCard'
import ConfirmationDialog from '@renderer/components/ConfirmationDialog'

export default function MySubjects(): React.JSX.Element {
  const { subjects, fetchSubjects, deleteSubject, updateSubject } = useSubjectStore()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    subjectId: string | null
    subjectName: string
  }>({
    isOpen: false,
    subjectId: null,
    subjectName: ''
  })

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  const handleDeleteRequest = (id: string): void => {
    const subject = subjects.find((s) => s.id === id)
    if (subject) {
      setDeleteConfirmation({
        isOpen: true,
        subjectId: id,
        subjectName: subject.name
      })
    }
  }

  const confirmDelete = async (): Promise<void> => {
    if (deleteConfirmation.subjectId) {
      await deleteSubject(deleteConfirmation.subjectId)
      setDeleteConfirmation({ isOpen: false, subjectId: null, subjectName: '' })
    }
  }

  // Helper to calculate progress
  const calculateProgress = (subject: Subject): number => {
    if (!subject.modules || subject.modules.length === 0) return 0
    const totalTopics = subject.modules.reduce((acc, mod) => acc + (mod.topics?.length || 0), 0)
    if (totalTopics === 0) return 0
    const completedTopics = subject.modules.reduce(
      (acc, mod) => acc + (mod.topics?.filter((t) => t.completed).length || 0),
      0
    )
    return (completedTopics / totalTopics) * 100
  }

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            My Subjects
          </h1>
          <p className="text-muted-foreground mt-1">Manage and track your learning journey</p>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-all shadow-lg hover:shadow-primary/20 hover:scale-105 active:scale-95 duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>New Subject</span>
        </button>
      </div>

      {/* Grid Content */}
      <AnimatePresence mode="wait">
        {subjects.length > 0 ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          >
            {subjects.map((subject) => (
              <motion.div
                key={subject.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                transition={{ duration: 0.3 }}
              >
                <SubjectCard
                  id={subject.id}
                  name={subject.name}
                  description={subject.description}
                  color={subject.color}
                  icon={subject.icon}
                  targetDate={subject.targetDate}
                  moduleCount={subject.modules?.length || 0}
                  progress={calculateProgress(subject)}
                  archived={subject.archived}
                  onDelete={handleDeleteRequest}
                  onUpdate={updateSubject}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No subjects found</h3>
            <p className="text-muted-foreground max-w-sm">
              You haven&apos;t created any subjects yet. Click the &quot;New Subject&quot; button to
              get started.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AddSubjectDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} />

      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, subjectId: null, subjectName: '' })}
        onConfirm={confirmDelete}
        title="Delete Subject"
        description={`Are you sure you want to delete "${deleteConfirmation.subjectName}"? This will delete all modules and topics associated with this subject. This action cannot be undone.`}
        confirmText="Delete Subject"
        variant="danger"
      />
    </div>
  )
}
