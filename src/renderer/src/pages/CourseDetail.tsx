import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Check, Clock, Star, Pencil, Upload, Trash2, Undo } from 'lucide-react'
import { useCourseStore, Class } from '@renderer/stores/useCourseStore'
import { motion } from 'framer-motion'
import AddClassDialog from '@renderer/components/Course/AddClassDialog'
import ImportClassesDialog from '@renderer/components/Course/ImportClassesDialog'
import ConfirmationDialog from '@renderer/components/ConfirmationDialog'

export default function CourseDetail(): React.JSX.Element | null {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    currentCourse,
    fetchCourseById,
    markClassAttended,
    markClassPending,
    createClass,
    updateClass,
    deleteClass,
    loading
  } = useCourseStore()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [classToDelete, setClassToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchCourseById(id)
    }
  }, [id, fetchCourseById])

  if (loading && !currentCourse) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-12 h-12 border-4 border-secondary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!currentCourse) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Course not found</p>
        <button
          onClick={() => navigate('/classes')}
          className="mt-4 px-4 py-2 bg-secondary text-primary-foreground rounded-lg"
        >
          Back to Courses
        </button>
      </div>
    )
  }

  const attendancePercentage =
    currentCourse.totalClasses > 0
      ? Math.round((currentCourse.attendedClasses / currentCourse.totalClasses) * 100)
      : 0

  const pendingClasses = currentCourse.classes?.filter((c) => c.status === 'pending') || []
  const attendedClasses = currentCourse.classes?.filter((c) => c.status === 'attended') || []

  const handleMarkAttended = async (classId: string): Promise<void> => {
    await markClassAttended(classId)
  }

  const handleMarkPending = async (classId: string): Promise<void> => {
    await markClassPending(classId)
  }

  const handleCreateClass = async (data: Partial<Class>): Promise<{ success: boolean }> => {
    const result = await createClass(data)
    // Removed direct setShowAddDialog(false) here because Dialog handles it based on result
    return result
  }

  const handleImportClass = async (data: Partial<Class>): Promise<{ success: boolean }> => {
    // Direct create for import
    return await createClass(data)
  }

  const handleUpdateClass = async (data: Partial<Class>): Promise<{ success: boolean }> => {
    if (editingClass) {
      const result = await updateClass(editingClass.id, data)
      if (result.success) {
        setEditingClass(null)
        // Dialog handles clear/close
      }
      return result
    }
    return { success: false }
  }

  const openEditDialog = (classItem: Class): void => {
    setEditingClass(classItem)
    setShowAddDialog(true)
  }

  const openAddDialog = (): void => {
    setEditingClass(null)
    setShowAddDialog(true)
  }

  const handleDeleteClass = (classId: string): void => {
    setClassToDelete(classId)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteClass = async (): Promise<void> => {
    if (classToDelete) {
      await deleteClass(classToDelete)
      setClassToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/classes')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="text-4xl p-3 rounded-lg"
                style={{ backgroundColor: `${currentCourse.color}20` }}
              >
                🎓
              </div>
              <div>
                <h1 className="text-3xl font-bold">{currentCourse.name}</h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  {currentCourse.platform && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      {currentCourse.platform}
                    </span>
                  )}
                  {currentCourse.instructor && <span>{currentCourse.instructor}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 text-primary-foreground rounded-lg font-medium hover:bg-white/10 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={openAddDialog}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-primary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Class
          </button>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <div className="text-sm text-muted-foreground mb-1">Attendance</div>
          <div className="text-2xl font-bold">{attendancePercentage}%</div>
          <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${attendancePercentage}%`,
                backgroundColor: currentCourse.color
              }}
            />
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="text-sm text-muted-foreground mb-1">Total Classes</div>
          <div className="text-2xl font-bold">{currentCourse.totalClasses}</div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="text-sm text-muted-foreground mb-1">Attended</div>
          <div className="text-2xl font-bold text-green-400">{currentCourse.attendedClasses}</div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="text-sm text-muted-foreground mb-1">Pending</div>
          <div className="text-2xl font-bold text-amber-400">{pendingClasses.length}</div>
        </div>
      </div>

      {/* Pending Classes */}
      {pendingClasses.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-400" />
            Pending Classes ({pendingClasses.length})
          </h2>
          <div className="space-y-2">
            {pendingClasses.map((classItem: Class, index: number) => (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-4 rounded-xl flex items-center justify-between group hover:bg-white/5 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{classItem.title}</h3>
                    {classItem.type === 'live' && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                        LIVE
                      </span>
                    )}
                    {!!classItem.isImportant && (
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {classItem.scheduledAt && (
                      <span className="text-primary font-medium">
                        {new Date(classItem.scheduledAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                    {classItem.description && (
                      <span className="line-clamp-1 opacity-80">• {classItem.description}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditDialog(classItem)}
                    className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
                    title="Edit Class"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClass(classItem.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-muted-foreground hover:text-red-400 transition-colors"
                    title="Delete Class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMarkAttended(classItem.id)}
                    disabled={loading}
                    className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Mark Attended
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Attended Classes */}
      {attendedClasses.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Check className="w-6 h-6 text-green-400" />
            Attended Classes ({attendedClasses.length})
          </h2>
          <div className="space-y-2">
            {attendedClasses.map((classItem: Class, index: number) => (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-4 rounded-xl flex items-center justify-between opacity-60"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Check className="w-5 h-5 text-green-400" />
                  <div>
                    <h3 className="font-medium">{classItem.title}</h3>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {classItem.attendedAt && (
                        <span>Attended {new Date(classItem.attendedAt).toLocaleDateString()}</span>
                      )}
                      {classItem.scheduledAt && (
                        <span>• Scheduled: {new Date(classItem.scheduledAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkPending(classItem.id)}
                    disabled={loading}
                    className="p-2 hover:bg-amber-500/20 rounded-lg text-muted-foreground hover:text-amber-400 transition-colors disabled:opacity-50"
                    title="Undo / Mark as Pending"
                  >
                    <Undo className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditDialog(classItem)}
                    className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
                    title="Edit Class"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClass(classItem.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-muted-foreground hover:text-red-400 transition-colors"
                    title="Delete Class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {currentCourse.totalClasses === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 rounded-xl text-center"
        >
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-xl font-semibold mb-2">No Classes Yet</h3>
          <p className="text-muted-foreground mb-6">
            Start tracking your course attendance by adding classes
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowImportDialog(true)}
              className="px-6 py-3 bg-white/5 text-primary-foreground rounded-lg font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Bulk Import
            </button>
            <button
              onClick={openAddDialog}
              className="px-6 py-3 bg-secondary text-primary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add First Class
            </button>
          </div>
        </motion.div>
      )}

      {/* Add/Edit Class Dialog */}
      <AddClassDialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false)
          setEditingClass(null)
        }}
        courseId={currentCourse.id}
        initialData={
          editingClass
            ? {
                id: editingClass.id,
                courseId: editingClass.courseId,
                title: editingClass.title,
                description: editingClass.description,
                type: editingClass.type,
                videoUrl: editingClass.videoUrl,
                duration: editingClass.duration,
                isImportant: editingClass.isImportant,
                scheduledAt: editingClass.scheduledAt,
                status: editingClass.status
              }
            : undefined
        }
        onSubmit={editingClass ? handleUpdateClass : handleCreateClass}
      />

      {/* Import Dialog */}
      <ImportClassesDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        courseId={currentCourse.id}
        onSubmit={handleImportClass}
      />

      {/* Delete Class Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setClassToDelete(null)
        }}
        onConfirm={confirmDeleteClass}
        title="Delete Class"
        description="Are you sure you want to delete this class? This action cannot be undone."
        confirmText="Delete Class"
        variant="danger"
      />
    </div>
  )
}
