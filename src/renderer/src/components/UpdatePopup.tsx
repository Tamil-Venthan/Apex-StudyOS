import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react'

interface UpdateInfo {
  version: string
  [key: string]: unknown
}

export default function UpdatePopup(): React.JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<string>('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Listen for update events
    window.electron.autoUpdater.on('update-available', (info) => {
      setUpdateStatus('available')
      setUpdateInfo(info as UpdateInfo)
      setIsOpen(true)
    })

    window.electron.autoUpdater.on('update-download-progress', (progress) => {
      setUpdateStatus('downloading')
      setDownloadProgress((progress as { percent: number }).percent)
    })

    window.electron.autoUpdater.on('update-downloaded', (info) => {
      setUpdateStatus('downloaded')
      setUpdateInfo(info as UpdateInfo)
    })

    window.electron.autoUpdater.on('update-error', (errorMsg) => {
      setUpdateStatus('error')
      setError(errorMsg as string)
    })

    return () => {
      window.electron.autoUpdater.removeAllListeners('update-available')
      window.electron.autoUpdater.removeAllListeners('update-download-progress')
      window.electron.autoUpdater.removeAllListeners('update-downloaded')
      window.electron.autoUpdater.removeAllListeners('update-error')
    }
  }, [])

  const handleDownloadUpdate = async (): Promise<void> => {
    await window.electron.autoUpdater.downloadUpdate()
  }

  const handleInstallUpdate = (): void => {
    window.electron.autoUpdater.installUpdate()
  }

  const handleClose = (): void => {
    setIsOpen(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-500/10 text-blue-400">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Update Available</h3>
                  <p className="text-sm text-muted-foreground">
                    A new version of Apex StudyOS is available.
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="mt-4">
              {updateStatus === 'available' && updateInfo && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Version <span className="text-white font-medium">{updateInfo.version}</span> is
                    ready to download.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 rounded-lg font-medium hover:bg-white/5 transition-colors text-sm"
                    >
                      Later
                    </button>
                    <button
                      onClick={handleDownloadUpdate}
                      className="px-4 py-2 rounded-lg font-medium text-white bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all text-sm flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Update
                    </button>
                  </div>
                </div>
              )}

              {updateStatus === 'downloading' && (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Downloading...</span>
                    <span className="text-white font-medium">{Math.round(downloadProgress)}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="bg-blue-500 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${downloadProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>
              )}

              {updateStatus === 'downloaded' && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-green-400 font-medium">
                      Update Ready to Install
                    </span>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={handleInstallUpdate}
                      className="px-4 py-2 rounded-lg font-medium text-white bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all text-sm w-full"
                    >
                      Restart and Install
                    </button>
                  </div>
                </div>
              )}

              {updateStatus === 'error' && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-400 font-medium">Update Failed</p>
                      <p className="text-xs text-red-400/80 mt-1">{error}</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 rounded-lg font-medium hover:bg-white/5 transition-colors text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
