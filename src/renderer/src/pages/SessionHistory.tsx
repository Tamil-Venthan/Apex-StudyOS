import { useEffect, useState, useMemo } from 'react'
import { useAnalyticsStore, StudySession } from '@renderer/stores/useAnalyticsStore'
import { useSubjectStore } from '@renderer/stores/useSubjectStore'
import { useToastStore } from '@renderer/stores/useToastStore'
import { motion, AnimatePresence } from 'framer-motion'
import {
    History,
    Clock,
    BookOpen,
    Trash2,
    Filter,
    Search,
    ChevronDown,
    Calendar
} from 'lucide-react'

export default function SessionHistory(): React.JSX.Element {
    const { sessions, fetchSessions } = useAnalyticsStore()
    const { subjects, fetchSubjects } = useSubjectStore()
    const addToast = useToastStore((s) => s.addToast)

    const [filterSubject, setFilterSubject] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'longest'>('newest')
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    useEffect(() => {
        fetchSessions('user-1', 365)
        fetchSubjects('user-1')
    }, [fetchSessions, fetchSubjects])

    const filteredSessions = useMemo(() => {
        let filtered = [...sessions]

        // Filter by subject
        if (filterSubject) {
            filtered = filtered.filter((s) => s.subject?.id === filterSubject)
        }

        // Filter by search query (notes)
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            filtered = filtered.filter(
                (s) =>
                    s.subject?.name?.toLowerCase().includes(q) ||
                    (s as StudySession & { notes?: string }).notes?.toLowerCase().includes(q)
            )
        }

        // Sort
        if (sortOrder === 'newest') {
            filtered.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        } else if (sortOrder === 'oldest') {
            filtered.sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
        } else {
            filtered.sort((a, b) => b.duration - a.duration)
        }

        return filtered
    }, [sessions, filterSubject, searchQuery, sortOrder])

    const totalFilteredTime = filteredSessions.reduce((acc, s) => acc + s.duration, 0)
    const totalH = Math.floor(totalFilteredTime / 3600)
    const totalM = Math.floor((totalFilteredTime % 3600) / 60)

    const handleDelete = async (id: string): Promise<void> => {
        try {
            const result = await window.electron.ipcRenderer.invoke('sessions:delete', id)
            if (result.success) {
                addToast('Session deleted', 'success')
                fetchSessions('user-1', 365)
            } else {
                addToast('Failed to delete session', 'error')
            }
        } catch {
            addToast('Error deleting session', 'error')
        }
        setDeleteConfirm(null)
    }

    const formatDuration = (secs: number): string => {
        const h = Math.floor(secs / 3600)
        const m = Math.floor((secs % 3600) / 60)
        return h > 0 ? `${h}h ${m}m` : `${m}m`
    }

    const formatDate = (date: Date): string => {
        const d = new Date(date)
        const today = new Date()
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)

        if (d.toDateString() === today.toDateString()) return 'Today'
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const formatTime = (date: Date): string => {
        return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <div className="p-2.5 bg-violet-500/20 rounded-xl">
                            <History className="w-7 h-7 text-violet-400" />
                        </div>
                        Session History
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {filteredSessions.length} sessions · {totalH}h {totalM}m total
                    </p>
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-4 rounded-xl flex flex-wrap gap-3 items-center"
            >
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search sessions..."
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                    />
                </div>

                {/* Subject Filter */}
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                        value={filterSubject}
                        onChange={(e) => setFilterSubject(e.target.value)}
                        className="pl-10 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground appearance-none cursor-pointer"
                    >
                        <option value="">All Subjects</option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id} className="bg-[#1e293b]">
                                {s.icon} {s.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>

                {/* Sort */}
                <div className="relative">
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'longest')}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground appearance-none cursor-pointer pr-8"
                    >
                        <option value="newest" className="bg-[#1e293b]">Newest First</option>
                        <option value="oldest" className="bg-[#1e293b]">Oldest First</option>
                        <option value="longest" className="bg-[#1e293b]">Longest First</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
            </motion.div>

            {/* Sessions List */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
            >
                <AnimatePresence>
                    {filteredSessions.length > 0 ? (
                        filteredSessions.map((session, index) => (
                            <motion.div
                                key={session.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ delay: Math.min(index * 0.03, 0.5) }}
                                className="glass-card p-4 rounded-xl hover:bg-white/5 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Subject Color Indicator */}
                                    <div
                                        className="w-1 h-12 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: session.subject?.color || '#6366f1' }}
                                    />

                                    {/* Icon */}
                                    <div className="p-2 rounded-lg bg-white/5 flex-shrink-0">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-semibold text-sm">
                                                {formatDuration(session.duration)}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">
                                                {session.type || 'focus'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            {session.subject && (
                                                <>
                                                    <BookOpen className="w-3 h-3" />
                                                    <span>{session.subject.name}</span>
                                                    <span>·</span>
                                                </>
                                            )}
                                            <Calendar className="w-3 h-3" />
                                            <span>{formatDate(session.completedAt)}</span>
                                            <span>·</span>
                                            <span>{formatTime(session.completedAt)}</span>
                                        </div>
                                    </div>

                                    {/* Delete */}
                                    {deleteConfirm === session.id ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleDelete(session.id)}
                                                className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="px-3 py-1.5 text-xs bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteConfirm(session.id)}
                                            className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all"
                                            title="Delete session"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-card p-12 rounded-xl text-center"
                        >
                            <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                            <p className="text-lg font-medium text-muted-foreground">No sessions found</p>
                            <p className="text-sm text-muted-foreground/60 mt-1">
                                {searchQuery || filterSubject
                                    ? 'Try adjusting your filters'
                                    : 'Start a focus session to see your history here'}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}
