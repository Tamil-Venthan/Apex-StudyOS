import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI & {
      autoUpdater: {
        checkForUpdates: () => Promise<void>
        downloadUpdate: () => Promise<void>
        installUpdate: () => Promise<void>
        on: (channel: string, func: (...args: unknown[]) => void) => void
        removeAllListeners: (channel: string) => void
      }
    }
    api: unknown
  }
}
