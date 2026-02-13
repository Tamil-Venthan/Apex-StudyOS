import { useEffect, useState } from 'react'
import { Download, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface UpdateInfo {
  version: string
  [key: string]: unknown
}

export default function UpdateChecker(): React.JSX.Element {
  const [updateStatus, setUpdateStatus] = useState<string>('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Listen for update events
    window.electron.autoUpdater.on('update-checking', () => {
      setUpdateStatus('checking')
      setError(null)
    })

    window.electron.autoUpdater.on('update-available', (info) => {
      setUpdateStatus('available')
      setUpdateInfo(info as UpdateInfo)
    })

    window.electron.autoUpdater.on('update-not-available', () => {
      setUpdateStatus('not-available')
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
      // Cleanup listeners
      window.electron.autoUpdater.removeAllListeners('update-checking')
      window.electron.autoUpdater.removeAllListeners('update-available')
      window.electron.autoUpdater.removeAllListeners('update-not-available')
      window.electron.autoUpdater.removeAllListeners('update-download-progress')
      window.electron.autoUpdater.removeAllListeners('update-downloaded')
      window.electron.autoUpdater.removeAllListeners('update-error')
    }
  }, [])

  const handleCheckForUpdates = async (): Promise<void> => {
    await window.electron.autoUpdater.checkForUpdates()
  }

  const handleDownloadUpdate = async (): Promise<void> => {
    await window.electron.autoUpdater.downloadUpdate()
  }

  const handleInstallUpdate = (): void => {
    window.electron.autoUpdater.installUpdate()
  }

  return (
    <div className="glass-card p-6 rounded-xl">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Download className="w-5 h-5" />
        Software Updates
      </h3>

      {/* Check for Updates Button */}
      {updateStatus === 'idle' && (
        <button
          onClick={handleCheckForUpdates}
          className="px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-lg text-sm font-medium transition-colors"
        >
          Check for Updates
        </button>
      )}

      {/* Checking Status */}
      {updateStatus === 'checking' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Checking for updates...
        </div>
      )}

      {/* Update Available */}
      {updateStatus === 'available' && updateInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
        >
          <h4 className="font-semibold mb-2 text-blue-400">Update Available!</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Version {updateInfo.version} is available. You are currently on version 1.0.0.
          </p>
          <button
            onClick={handleDownloadUpdate}
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-sm font-medium transition-colors"
          >
            Download Update
          </button>
        </motion.div>
      )}

      {/* Downloading */}
      {updateStatus === 'downloading' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
        >
          <h4 className="font-semibold mb-2">Downloading Update...</h4>
          <div className="w-full bg-white/5 rounded-full h-2 mb-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">{Math.round(downloadProgress)}% complete</p>
        </motion.div>
      )}

      {/* Update Downloaded */}
      {updateStatus === 'downloaded' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
        >
          <h4 className="font-semibold mb-2 text-green-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Update Ready!
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            The update has been downloaded. Restart the app to install.
          </p>
          <button
            onClick={handleInstallUpdate}
            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-sm font-medium transition-colors"
          >
            Install and Restart
          </button>
        </motion.div>
      )}

      {/* No Updates Available */}
      {updateStatus === 'not-available' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
        >
          <p className="text-sm text-green-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            You&apos;re up to date!
          </p>
        </motion.div>
      )}

      {/* Error */}
      {updateStatus === 'error' && error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
        >
          <p className="text-sm text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        </motion.div>
      )}
    </div>
  )
}
