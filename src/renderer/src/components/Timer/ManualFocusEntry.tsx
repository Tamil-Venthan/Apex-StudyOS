import { useState, useEffect } from 'react'
import { X, Clock, Plus, BookOpen, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSubjectStore } from '@renderer/stores/useSubjectStore'
import { useTimerStore } from '@renderer/stores/useTimerStore'
import { useToastStore } from '@renderer/stores/useToastStore'

interface ManualFocusEntryProps {
    open: boolean
    onClose: () => void
}

export default function ManualFocusEntry({
    open,
    onClose
}: ManualFocusEntryProps): React.JSX.Element {
    const [hours, setHours] = useState(0)
    const [minutes, setMinutes] = useState(0)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedSubjectId, setSelectedSubjectId] = useState('')
    const [notes, setNotes] = useState('')
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    const { subjects, fetchSubjects } = useSubjectStore()
    const addManualSession = useTimerStore((s) => s.addManualSession)
    const addToast = useToastStore((s) => s.addToast)

    useEffect(() => {
        if (open) {
            fetchSubjects()
            // Reset form
            setHours(0)
            setMinutes(0)
            setSelectedDate(new Date().toISOString().split('T')[0])
            setSelectedSubjectId('')
            setNotes('')
            setError('')
        }
    }, [open, fetchSubjects])

    const handleSave = async (): Promise<void> => {
        const totalSeconds = hours * 3600 + minutes * 60
        if (totalSeconds < 60) {
            setError('Please enter at least 1 minute')
            return
        }

        setSaving(true)
        setError('')

        const success = await addManualSession(
            totalSeconds,
            selectedSubjectId || undefined,
            notes || undefined,
            selectedDate
        )

        setSaving(false)

        if (success) {
            const h = Math.floor(totalSeconds / 3600)
            const m = Math.floor((totalSeconds % 3600) / 60)
            const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`
            addToast(`${timeStr} focus session added! 🎯`, 'success')
            onClose()
        } else {
            setError('Failed to save session. Please try again.')
        }
    }

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="glass-card rounded-xl p-6 w-full max-w-md"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-500/10 rounded-lg">
                                    <Plus className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Add Focus Time</h2>
                                    <p className="text-sm text-muted-foreground">Log time manually</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            {/* Duration Input */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium mb-3">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    Duration
                                </label>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="23"
                                                value={hours}
                                                onChange={(e) => {
                                                    setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))
                                                    setError('')
                                                }}
                                                className="w-full bg-white/5 border border-border dark:border-white/10 rounded-lg px-4 py-3 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                                                hrs
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-2xl font-bold text-muted-foreground">:</div>
                                    <div className="flex-1">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={minutes}
                                                onChange={(e) => {
                                                    setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))
                                                    setError('')
                                                }}
                                                className="w-full bg-white/5 border border-border dark:border-white/10 rounded-lg px-4 py-3 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                                                min
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {/* Quick duration buttons */}
                                <div className="flex gap-2 mt-3">
                                    {[
                                        { label: '15m', h: 0, m: 15 },
                                        { label: '30m', h: 0, m: 30 },
                                        { label: '1h', h: 1, m: 0 },
                                        { label: '2h', h: 2, m: 0 },
                                        { label: '3h', h: 3, m: 0 }
                                    ].map((preset) => (
                                        <button
                                            key={preset.label}
                                            onClick={() => {
                                                setHours(preset.h)
                                                setMinutes(preset.m)
                                                setError('')
                                            }}
                                            className="flex-1 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date Picker */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full bg-white/5 border border-border dark:border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground [color-scheme:dark]"
                                />
                            </div>

                            {/* Subject Selector */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                                    Subject (optional)
                                </label>
                                <select
                                    value={selectedSubjectId}
                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                    className="w-full bg-white/5 border border-border dark:border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                >
                                    <option value="">No specific subject</option>
                                    {subjects.map((subject) => (
                                        <option key={subject.id} value={subject.id} className="bg-[#1e293b]">
                                            {subject.icon} {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="What did you study?"
                                    rows={2}
                                    className="w-full bg-white/5 border border-border dark:border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-foreground placeholder:text-muted-foreground"
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-sm text-red-400 text-center"
                                >
                                    {error}
                                </motion.p>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
                                >
                                    {saving ? 'Saving...' : 'Add Session'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
