import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, RefreshCw, Upload, LayoutList, KanbanSquare } from 'lucide-react'
import { useSubjectStore, Module, Topic } from '@renderer/stores/useSubjectStore'
import { useModuleStore } from '@renderer/stores/useModuleStore'
import { motion, AnimatePresence } from 'framer-motion'
import AddModuleDialog from '@renderer/components/Subject/AddModuleDialog'
import ImportModulesDialog from '@renderer/components/Subject/ImportModulesDialog'
import ModuleAccordion from '@renderer/components/Subject/ModuleAccordion'
import TopicBoard from '@renderer/components/Subject/TopicBoard'

export default function SubjectDetail(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentSubject, fetchSubjectById, loading } = useSubjectStore()
  const { createModule } = useModuleStore()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')

  const handleRefresh = async (): Promise<void> => {
    if (id) {
      setIsRefreshing(true)
      await fetchSubjectById(id)
      setTimeout(() => setIsRefreshing(false), 500) // Small delay for visual feedback
    }
  }

  useEffect(() => {
    if (id) {
      fetchSubjectById(id)
    }
  }, [id, fetchSubjectById])

  if (loading && !currentSubject) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!currentSubject) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Subject not found</p>
        <button
          onClick={() => navigate('/subjects')}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Back to Subjects
        </button>
      </div>
    )
  }

  const calculateProgress = (): number => {
    if (!currentSubject?.modules || currentSubject.modules.length === 0) return 0

    const totalTopics = currentSubject.modules.reduce(
      (acc: number, mod: Module) => acc + (mod.topics?.length || 0),
      0
    )

    if (totalTopics === 0) return 0

    const completedTopics = currentSubject.modules.reduce(
      (acc: number, mod: Module) =>
        acc + (mod.topics?.filter((t: Topic) => t.completed).length || 0),
      0
    )

    return (completedTopics / totalTopics) * 100
  }

  const progress = calculateProgress()
  const totalModules = currentSubject.modules?.length || 0
  const totalTopics =
    currentSubject.modules?.reduce(
      (acc: number, mod: Module) => acc + (mod.topics?.length || 0),
      0
    ) || 0

  const handleAddModule = async (data: {
    subjectId: string
    name: string
    order: number
  }): Promise<{ success: boolean }> => {
    const result = await createModule(data)
    // Force refresh subject to show new module and preserve existing data
    if (id && result.success) {
      await fetchSubjectById(id)
      // Double refresh with slight delay to ensure database consistency
      setTimeout(async () => {
        await fetchSubjectById(id)
      }, 300)
    }
    return result
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/subjects')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="List View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'board'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Board View"
            >
              <KanbanSquare className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl p-8 transition-all hover:shadow-2xl hover:shadow-primary/5">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(135deg, ${currentSubject.color} 0%, transparent 100%)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-center gap-5">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl shadow-xl ring-1 ring-white/10"
              style={{ backgroundColor: `${currentSubject.color}30` }}
            >
              {currentSubject.icon || '📚'}
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">{currentSubject.name}</h1>
              {currentSubject.description && (
                <p className="text-lg text-muted-foreground max-w-xl">
                  {currentSubject.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowImportDialog(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all hover:scale-105 active:scale-95 border border-border dark:border-white/10"
            >
              <Upload className="w-5 h-5" />
              <span>Import</span>
            </button>
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" />
              <span>Add Module</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Stats - Only show in List view or if desired */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4 rounded-xl">
            <div className="text-sm text-muted-foreground mb-1">Overall Progress</div>
            <div className="text-2xl font-bold">{Math.round(progress)}%</div>
            <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: currentSubject.color
                }}
              />
            </div>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <div className="text-sm text-muted-foreground mb-1">Total Modules</div>
            <div className="text-2xl font-bold">{totalModules}</div>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <div className="text-sm text-muted-foreground mb-1">Total Topics</div>
            <div className="text-2xl font-bold">{totalTopics}</div>
          </div>
        </div>
      )}

      {/* Content Section */}
      <AnimatePresence mode="wait">
        {viewMode === 'board' ? (
          <motion.div
            key="board"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <TopicBoard subject={currentSubject} onRefresh={handleRefresh} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Modules</h2>
            </div>

            {totalModules === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-12 rounded-xl text-center"
              >
                <div className="text-5xl mb-4">📖</div>
                <h3 className="text-xl font-semibold mb-2">No Modules Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start organizing this subject by adding modules
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setShowImportDialog(true)}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-primary-foreground rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Bulk Import
                  </button>
                  <button
                    onClick={() => setShowAddDialog(true)}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    + Add First Module
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {currentSubject.modules?.map((module: Module) => (
                  <ModuleAccordion key={module.id} module={module} onRefresh={handleRefresh} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <AddModuleDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        subjectId={currentSubject.id}
        moduleCount={totalModules}
        onSubmit={handleAddModule}
      />

      <ImportModulesDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        subjectId={currentSubject.id}
        currentModuleCount={totalModules}
        onSubmit={handleAddModule}
      />
    </div>
  )
}
