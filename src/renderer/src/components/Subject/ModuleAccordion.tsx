import {
  Check,
  Star,
  Plus,
  Trash2,
  Link as LinkIcon,
  FileText,
  Image,
  Video,
  ExternalLink,
  X,
  Upload
} from 'lucide-react'
import { useState } from 'react'
import { useModuleStore } from '@renderer/stores/useModuleStore'
import { Module, Topic, Resource } from '@renderer/stores/useSubjectStore'
import AddTopicDialog, { TopicFormData } from './AddTopicDialog'
import AddResourceDialog from './AddResourceDialog'
import ImportTopicsDialog, { ImportedTopic } from './ImportTopicsDialog'
import ConfirmationDialog from '@renderer/components/ConfirmationDialog'

interface ModuleAccordionProps {
  module: Module
  onRefresh: () => void
}

export default function ModuleAccordion({
  module,
  onRefresh
}: ModuleAccordionProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [showImportTopics, setShowImportTopics] = useState(false)
  const [addingResourceToTopicId, setAddingResourceToTopicId] = useState<string | null>(null)
  const [showDeleteModuleConfirm, setShowDeleteModuleConfirm] = useState(false)
  const [showDeleteTopicConfirm, setShowDeleteTopicConfirm] = useState(false)
  const [topicToDelete, setTopicToDelete] = useState<string | null>(null)

  const { updateTopic, createTopic, deleteModule, deleteTopic } = useModuleStore()

  const topics = module.topics || []
  const completedCount = topics.filter((t: Topic) => t.completed).length
  const progressPercentage = topics.length > 0 ? (completedCount / topics.length) * 100 : 0

  const handleToggleComplete = async (topicId: string, completed: boolean): Promise<void> => {
    await updateTopic(topicId, { completed: !completed })
    onRefresh()
  }

  const handleAddTopic = async (data: TopicFormData): Promise<void> => {
    // Convert TopicFormData to the format expected by createTopic (Partial<Topic> usually)
    // We might need to cast or ensure createTopic accepts TopicFormData or compatible
    // For now assuming createTopic takes Partial<Topic> where completed/watchedDuration are optional
    await createTopic(data)
    onRefresh()
  }

  const handleImportTopics = async (topics: ImportedTopic[]): Promise<void> => {
    for (const topicData of topics) {
      // Convert ImportedTopic to the format expected by createTopic
      const newTopic = {
        ...topicData,
        totalDuration: topicData.totalDuration === null ? undefined : topicData.totalDuration,
        watchedDuration: 0,
        resources: []
      }
      await createTopic(newTopic)
    }
    onRefresh()
  }

  const handleDeleteModule = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    setShowDeleteModuleConfirm(true)
  }

  const confirmDeleteModule = async (): Promise<void> => {
    await deleteModule(module.id)
    onRefresh()
  }

  const handleDeleteTopic = (topicId: string): void => {
    setTopicToDelete(topicId)
    setShowDeleteTopicConfirm(true)
  }

  const confirmDeleteTopic = async (): Promise<void> => {
    if (topicToDelete) {
      await deleteTopic(topicToDelete)
      setTopicToDelete(null)
      onRefresh()
    }
  }

  const handleAddResource = async (data: {
    topicId: string
    title: string
    type: string
    url: string
  }): Promise<void> => {
    try {
      await window.electron.ipcRenderer.invoke('resources:create', data)
      onRefresh()
    } catch (err) {
      console.error('Failed to create resource', err)
    }
  }

  const handleDeleteResource = async (resourceId: string): Promise<void> => {
    if (confirm('Delete this resource?')) {
      try {
        await window.electron.ipcRenderer.invoke('resources:delete', resourceId)
        onRefresh()
      } catch (err) {
        console.error('Failed to delete resource', err)
      }
    }
  }

  const getResourceIcon = (type: string): React.JSX.Element => {
    switch (type) {
      case 'link':
        return <LinkIcon className="w-3 h-3" />
      case 'pdf':
        return <FileText className="w-3 h-3" />
      case 'image':
        return <Image className="w-3 h-3" />
      case 'video':
        return <Video className="w-3 h-3" />
      default:
        return <LinkIcon className="w-3 h-3" />
    }
  }

  return (
    <>
      <div className="glass-card rounded-xl relative">
        {/* Module Header */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="flex-1 text-left">
            <h3 className="text-lg font-semibold mb-1">{module.name}</h3>
            {module.description && (
              <p className="text-sm text-muted-foreground">{module.description}</p>
            )}
            <div className="mt-2 flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                {completedCount} / {topics.length} topics completed
              </span>
              <div className="flex-1 max-w-xs">
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Delete Module Button */}
            <button
              onClick={handleDeleteModule}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
              title="Delete Module"
            >
              <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-red-400" />
            </button>

            <div className="text-muted-foreground">{isExpanded ? '▼' : '▶'}</div>
          </div>
        </div>

        {/* Topics List */}
        {isExpanded && (
          <div className="border-t border-border dark:border-white/10 px-6 pb-6 pt-4 space-y-3">
            {topics.map((topic: Topic) => (
              <div
                key={topic.id}
                className={`p-3 rounded-lg border transition-colors ${
                  topic.completed
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-card/40 dark:bg-white/5 border-border dark:border-white/10 hover:bg-accent/5 dark:hover:bg-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleComplete(topic.id, !!topic.completed)}
                    className={`flex-shrink-0 w-5 h-5 mt-1 rounded border-2 transition-colors flex items-center justify-center ${
                      topic.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-border dark:border-white/30 hover:border-primary'
                    }`}
                  >
                    {!!topic.completed && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium ${topic.completed ? 'line-through opacity-60' : ''}`}
                      >
                        {topic.name}
                      </span>
                      {!!topic.isImportant && (
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      )}
                    </div>
                    {topic.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{topic.description}</p>
                    )}
                    {topic.totalDuration && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ⏱️ {topic.totalDuration} min
                      </p>
                    )}

                    {/* Resources List */}
                    {topic.resources && topic.resources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {topic.resources.map((resource: Resource) => (
                          <div
                            key={resource.id}
                            className="group flex items-center gap-2 bg-black/5 dark:bg-black/20 hover:bg-primary/20 border border-border dark:border-white/5 hover:border-primary/30 rounded-full px-2 py-1 transition-colors"
                          >
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-primary transition-colors"
                            >
                              {getResourceIcon(resource.type)}
                              <span className="truncate max-w-[150px]">{resource.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                            </a>
                            <button
                              onClick={() => handleDeleteResource(resource.id)}
                              className="p-0.5 hover:bg-white/10 rounded-full text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setAddingResourceToTopicId(topic.id)}
                      className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Add Resource"
                    >
                      <LinkIcon className="w-4 h-4 text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(topic.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete Topic"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Topic Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddTopic(true)}
                className="flex-1 p-4 border border-dashed border-border dark:border-white/20 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
              >
                <Plus className="w-4 h-4" />
                Add Topic
              </button>
              <button
                onClick={() => setShowImportTopics(true)}
                className="flex-1 p-4 border border-dashed border-border dark:border-white/20 rounded-lg hover:border-blue-500 hover:bg-blue-500/5 transition-colors flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-blue-400"
              >
                <Upload className="w-4 h-4" />
                Import Topics
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs rendered outside accordion - fixes z-index issues */}
      <AddTopicDialog
        open={showAddTopic}
        onClose={() => setShowAddTopic(false)}
        moduleId={module.id}
        topicCount={topics.length}
        onSubmit={handleAddTopic}
      />

      <ImportTopicsDialog
        open={showImportTopics}
        onClose={() => setShowImportTopics(false)}
        moduleId={module.id}
        onSubmit={handleImportTopics}
      />

      {addingResourceToTopicId && (
        <AddResourceDialog
          open={!!addingResourceToTopicId}
          onClose={() => setAddingResourceToTopicId(null)}
          topicId={addingResourceToTopicId}
          onSubmit={handleAddResource}
        />
      )}

      {/* Delete Module Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteModuleConfirm}
        onClose={() => setShowDeleteModuleConfirm(false)}
        onConfirm={confirmDeleteModule}
        title="Delete Module"
        description={`Are you sure you want to delete "${module.name}" and all its topics? This action cannot be undone.`}
        confirmText="Delete Module"
        variant="danger"
      />

      {/* Delete Topic Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteTopicConfirm}
        onClose={() => {
          setShowDeleteTopicConfirm(false)
          setTopicToDelete(null)
        }}
        onConfirm={confirmDeleteTopic}
        title="Delete Topic"
        description="Are you sure you want to delete this topic? This action cannot be undone."
        confirmText="Delete Topic"
        variant="danger"
      />
    </>
  )
}
