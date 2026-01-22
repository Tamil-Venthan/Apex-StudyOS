import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Subject, Topic } from '@renderer/stores/useSubjectStore'
import { useModuleStore } from '@renderer/stores/useModuleStore'
import { CheckCircle2, Circle, Clock, GripVertical } from 'lucide-react'

interface TopicBoardProps {
  subject: Subject
  onRefresh: () => void
}

interface BoardColumnProps {
  title: string
  status: 'todo' | 'done'
  topics: (Topic & { moduleName: string; moduleColor?: string })[]
  onDrop: (topicId: string, status: 'todo' | 'done') => void
  onDragStart: (e: React.DragEvent, topicId: string) => void
  draggedTopicId: string | null
  color: string
}

export default function TopicBoard({ subject, onRefresh }: TopicBoardProps): React.JSX.Element {
  const { updateTopic } = useModuleStore()
  const [draggedTopicId, setDraggedTopicId] = useState<string | null>(null)

  // Flatten topics from all modules
  const allTopics = useMemo(() => {
    const topics: (Topic & { moduleName: string; moduleColor?: string })[] = []
    subject.modules?.forEach((module) => {
      module.topics?.forEach((topic) => {
        topics.push({
          ...topic,
          moduleName: module.name,
          moduleColor: subject.color // Could differ if modules had colors
        })
      })
    })
    return topics
  }, [subject])

  const todoTopics = allTopics.filter((t) => !t.completed)
  const doneTopics = allTopics.filter((t) => t.completed)

  const handleDrop = async (topicId: string, status: 'todo' | 'done'): Promise<void> => {
    const topic = allTopics.find((t) => t.id === topicId)
    if (!topic) return

    const newCompleted = status === 'done'
    if (topic.completed !== newCompleted) {
      // Optimistic update could happen here, but we'll rely on onRefresh for now
      await updateTopic(topicId, { completed: newCompleted })
      onRefresh()
    }
    setDraggedTopicId(null)
  }

  // HTML5 DnD handlers
  const handleDragStart = (e: React.DragEvent, topicId: string): void => {
    e.dataTransfer.setData('topicId', topicId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedTopicId(topicId)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-250px)] min-h-[500px]">
      <BoardColumn
        title="To Do"
        status="todo"
        topics={todoTopics}
        onDrop={handleDrop}
        onDragStart={handleDragStart}
        draggedTopicId={draggedTopicId}
        color="bg-white/5"
      />
      <BoardColumn
        title="Completed"
        status="done"
        topics={doneTopics}
        onDrop={handleDrop}
        onDragStart={handleDragStart}
        draggedTopicId={draggedTopicId}
        color="bg-green-500/5"
      />
    </div>
  )
}

function BoardColumn({
  title,
  status,
  topics,
  onDrop,
  onDragStart,
  draggedTopicId,
  color
}: BoardColumnProps): React.JSX.Element {
  const [isOver, setIsOver] = useState(false)

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault()
    setIsOver(true)
  }

  const handleDragLeave = (): void => {
    setIsOver(false)
  }

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault()
    setIsOver(false)
    const topicId = e.dataTransfer.getData('topicId')
    if (topicId) {
      onDrop(topicId, status)
    }
  }

  return (
    <div
      className={`rounded-xl flex flex-col h-full border-2 transition-colors ${
        isOver ? 'border-primary bg-primary/5' : `border-transparent ${color}`
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-border dark:border-white/5 flex items-center justify-between sticky top-0 bg-inherit rounded-t-xl z-10 backdrop-blur-sm">
        <h3 className="font-semibold flex items-center gap-2">
          {status === 'todo' ? (
            <Circle className="w-4 h-4 text-muted-foreground" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
          {title}
          <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-xs text-muted-foreground">
            {topics.length}
          </span>
        </h3>
      </div>

      {/* Column Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <AnimatePresence>
          {topics.map((topic) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: draggedTopicId === topic.id ? 0.4 : 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={topic.id}
              draggable
              onDragStartCapture={(e: React.DragEvent) => onDragStart(e, topic.id)}
              className="group bg-card/40 dark:bg-white/5 hover:bg-accent/5 dark:hover:bg-white/10 p-3 rounded-lg border border-border dark:border-white/5 hover:border-border/80 dark:hover:border-white/20 cursor-grab active:cursor-grabbing shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground/30 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/5 text-muted-foreground truncate max-w-[150px]">
                      {topic.moduleName}
                    </span>
                    {topic.isImportant && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" title="Important" />
                    )}
                  </div>
                  <h4
                    className={`font-medium text-sm ${
                      topic.completed ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {topic.name}
                  </h4>
                  {topic.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {topic.description}
                    </p>
                  )}
                  {topic.totalDuration && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{topic.totalDuration} min</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {topics.length === 0 && (
            <div className="text-center py-10 text-muted-foreground/40 border-2 border-dashed border-border dark:border-white/5 rounded-lg">
              <p className="text-sm">No items</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
