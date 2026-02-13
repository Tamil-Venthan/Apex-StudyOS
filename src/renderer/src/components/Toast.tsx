import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useToastStore, Toast as ToastType } from '@renderer/stores/useToastStore'

const icons = {
    success: CheckCircle2,
    error: XCircle,
    info: Info
}

const colors = {
    success: {
        bg: 'bg-emerald-500/15',
        border: 'border-emerald-500/30',
        icon: 'text-emerald-400',
        bar: 'bg-emerald-400'
    },
    error: {
        bg: 'bg-red-500/15',
        border: 'border-red-500/30',
        icon: 'text-red-400',
        bar: 'bg-red-400'
    },
    info: {
        bg: 'bg-blue-500/15',
        border: 'border-blue-500/30',
        icon: 'text-blue-400',
        bar: 'bg-blue-400'
    }
}

function ToastItem({ toast }: { toast: ToastType }): React.JSX.Element {
    const removeToast = useToastStore((s) => s.removeToast)
    const Icon = icons[toast.type]
    const color = colors[toast.type]

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl min-w-[280px] max-w-[380px] ${color.bg} ${color.border}`}
        >
            <Icon className={`w-5 h-5 flex-shrink-0 ${color.icon}`} />
            <span className="text-sm font-medium text-foreground flex-1">{toast.message}</span>
            <button
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {/* Progress bar */}
            <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: (toast.duration || 3000) / 1000, ease: 'linear' }}
                className={`absolute bottom-0 left-0 right-0 h-0.5 origin-left ${color.bar}`}
            />
        </motion.div>
    )
}

export default function ToastContainer(): React.JSX.Element {
    const toasts = useToastStore((s) => s.toasts)

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} />
                ))}
            </AnimatePresence>
        </div>
    )
}
