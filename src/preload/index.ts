import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ...electronAPI,
      ipcRenderer: {
        send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
        on: (channel: string, func: (...args: unknown[]) => void) => {
          ipcRenderer.on(channel, (_, ...args) => func(...args))
        },
        once: (channel: string, func: (...args: unknown[]) => void) => {
          ipcRenderer.once(channel, (_, ...args) => func(...args))
        },
        invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
        removeListener: (channel: string, func: (...args: unknown[]) => void) => {
          ipcRenderer.removeListener(channel, func)
        }
      },
      autoUpdater: {
        checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
        downloadUpdate: () => ipcRenderer.invoke('download-update'),
        installUpdate: () => ipcRenderer.invoke('install-update'),
        on(channel: string, func: (...args: unknown[]) => void) {
          const validChannels = [
            'update-checking',
            'update-available',
            'update-not-available',
            'update-download-progress',
            'update-downloaded',
            'update-error'
          ]
          if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (_event, ...args) => func(...args))
          }
        },
        removeAllListeners(channel: string) {
          ipcRenderer.removeAllListeners(channel)
        }
      }
    })
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
