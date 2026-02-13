import { useState, useEffect } from 'react'
import { Minus, Square, X, Copy } from 'lucide-react'

export default function TitleBar(): React.JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const checkMaximized = async (): Promise<void> => {
      const maximized = await window.electron.ipcRenderer.invoke('window:isMaximized')
      setIsMaximized(maximized)
    }

    checkMaximized()

    // Optional: Listen for resize events if we added an event from main process,
    // but checking on click is usually enough for simple controls.
    // For a more robust solution, we'd emit 'window:resize' from main.
    const handleResize = (): void => {
      checkMaximized()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleMinimize = (): void => {
    window.electron.ipcRenderer.send('window:minimize')
  }

  const handleMaximize = (): void => {
    window.electron.ipcRenderer.send('window:maximize')
    setIsMaximized(!isMaximized)
  }

  const handleClose = (): void => {
    window.electron.ipcRenderer.send('window:close')
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 h-8 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-between px-4 select-none border-b border-border dark:border-white/5"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span>Apex StudyOS</span>
      </div>

      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="h-full w-10 flex items-center justify-center hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
          title="Minimize"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-full w-10 flex items-center justify-center hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <Copy className="w-4 h-4" /> : <Square className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={handleClose}
          className="h-full w-10 flex items-center justify-center hover:bg-red-500/80 hover:text-white transition-colors text-muted-foreground"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
