import { useEffect, useState, useRef, useCallback } from 'react'
import { useSubjectStore } from '@renderer/stores/useSubjectStore'
import { useTimerPreferences } from '@renderer/stores/useTimerPreferences'
import { useTimerStore } from '@renderer/stores/useTimerStore'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, SkipForward, Settings, Maximize2, Minimize2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { soundManager } from '@renderer/utils/soundManager'
import TimerSettings from '@renderer/components/Timer/TimerSettings'
import TimerStats from '@renderer/components/Timer/TimerStats'
import WeeklyChart from '@renderer/components/Timer/WeeklyChart'

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

// Timer durations now come from preferences

export default function Timer(): React.JSX.Element {
  const { preferences, updatePreferences } = useTimerPreferences()
  const {
    isRunning,
    timeLeft,
    mode,
    totalWorkTime,
    sessions,
    // currentSession,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode: setMode,
    fetchTodaySessions
  } = useTimerStore()

  // Local state for UI only
  // const [totalWorkTime, setTotalWorkTime] = useState(0) // Now from store
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const { subjects, fetchSubjects } = useSubjectStore()

  // Timer tick is handled globally in MainLayout
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null)

  // Fetch subjects and sessions on mount
  useEffect(() => {
    fetchSubjects()
    fetchTodaySessions()
    // Request notification permission on mount
    if (preferences.notificationsEnabled && 'Notification' in window) {
      Notification.requestPermission()
    }
  }, [fetchSubjects, fetchTodaySessions, preferences.notificationsEnabled])

  // Sync timer with preferences on mount
  useEffect(() => {
    // If timer is not running, ensure it displays the correct duration from preferences
    if (!isRunning) {
      const currentModeDuration =
        mode === 'focus'
          ? preferences.focusDuration
          : mode === 'shortBreak'
            ? preferences.shortBreakDuration
            : preferences.longBreakDuration

      // Only reset if mismatched (avoids unnecessary re-renders or resets if already correct)
      // But we must assume if we just loaded, we want the preference.
      // Actually, since resetTimer writes to the store, we should just call it once on mount.
      // But we need to handle the case where we navigate away and back?
      // The store persists across navigation in memory.
      // If we want to persist across RELOADS, the store state is reset to default (25*60) unless we use persistence middleware.
      // Since useTimerStore doesn't use persist middleware, it resets on reload.
      // So on mount, we should sync with preferences.

      resetTimer(currentModeDuration)
    }
    // We only want to run this once on mount, or when mode changes?
    // Actually, getDuration logic already handles mode changes.
    // This effect is specifically for INITIAL LOAD.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array for mount only

  // Sound playback using preferences
  const playSound = useCallback((): void => {
    if (preferences.soundEnabled) {
      soundManager.playSound(preferences.soundType, preferences.soundVolume)
    }
  }, [preferences.soundEnabled, preferences.soundType, preferences.soundVolume])

  // Helper to get duration for a mode from preferences
  const getDuration = useCallback(
    (timerMode: TimerMode): number => {
      const durations = {
        focus: preferences.focusDuration,
        shortBreak: preferences.shortBreakDuration,
        longBreak: preferences.longBreakDuration
      }
      return durations[timerMode]
    },
    [preferences]
  )

  const switchMode = useCallback(
    (newMode: TimerMode): void => {
      setMode(newMode, getDuration(newMode))
    },
    [setMode, getDuration]
  )

  // Timer completion handler
  const handleTimerComplete = useCallback(async (): Promise<void> => {
    // Timer is already paused by store when it hits 0
    playSound()

    // Celebration check
    if (mode === 'focus' && preferences.celebrationEnabled && confettiCanvasRef.current) {
      console.log('🎉 Firing celebration confetti!')
      const myConfetti = confetti.create(confettiCanvasRef.current, {
        resize: true,
        useWorker: true
      })
      myConfetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
    }

    // Notifications
    if (preferences.notificationsEnabled) {
      const title = mode === 'focus' ? 'Focus Session Complete! 🎯' : 'Break Time Over! ⏰'
      const body =
        mode === 'focus'
          ? 'Great work! Time for a well-deserved break.'
          : 'Break finished. Ready to focus again?'

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon.png' })
      }
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.send('show-notification', { title, body })
      }
    }

    // Save Session properly using store action
    if (mode === 'focus') {
      try {
        // End the current session (updates DB with endTime and duration)
        await useTimerStore.getState().endSession()

        // Refresh sessions to show immediately
        await fetchTodaySessions()
      } catch (error) {
        console.error('Failed to save session:', error)
      }
    }

    // Auto-switch modes
    if (mode === 'focus') {
      if ((sessions.length + 1) % 4 === 0) {
        switchMode('longBreak')
      } else {
        switchMode('shortBreak')
      }
    } else {
      switchMode('focus')
    }
  }, [mode, sessions.length, preferences, playSound, switchMode, fetchTodaySessions])

  // Effect: Handle Completion (Store timer hits 0)
  useEffect(() => {
    if (timeLeft === 0 && !isRunning) {
      handleTimerComplete()
    }
  }, [timeLeft, isRunning, handleTimerComplete])

  // Ref to track previous durations to avoid resetting on other state changes
  const prevDurations = useRef({
    focus: preferences.focusDuration,
    shortBreak: preferences.shortBreakDuration,
    longBreak: preferences.longBreakDuration
  })

  // Effect: Update timer if preferences change while not running
  useEffect(() => {
    // Check if focus duration changed
    if (prevDurations.current.focus !== preferences.focusDuration) {
      if (!isRunning && mode === 'focus') {
        resetTimer(preferences.focusDuration)
      }
      prevDurations.current.focus = preferences.focusDuration
    }

    // Check if short break duration changed
    if (prevDurations.current.shortBreak !== preferences.shortBreakDuration) {
      if (!isRunning && mode === 'shortBreak') {
        resetTimer(preferences.shortBreakDuration)
      }
      prevDurations.current.shortBreak = preferences.shortBreakDuration
    }

    // Check if long break duration changed
    if (prevDurations.current.longBreak !== preferences.longBreakDuration) {
      if (!isRunning && mode === 'longBreak') {
        resetTimer(preferences.longBreakDuration)
      }
      prevDurations.current.longBreak = preferences.longBreakDuration
    }
  }, [
    preferences.focusDuration,
    preferences.shortBreakDuration,
    preferences.longBreakDuration,
    isRunning,
    mode,
    resetTimer
  ])

  const handlePlayPause = useCallback((): void => {
    if (isRunning) {
      pauseTimer()
    } else {
      startTimer(selectedSubjectId)
    }
  }, [isRunning, startTimer, pauseTimer, selectedSubjectId])

  const handleReset = useCallback((): void => {
    resetTimer(getDuration(mode))
  }, [resetTimer, getDuration, mode])

  const handleSkip = useCallback((): void => {
    // Skip means we finish the current session early or skip the break
    if (mode === 'focus') {
      const newSessionCount = sessions.length + 1
      // setSessionCount removed
      switchMode(newSessionCount % 4 === 0 ? 'longBreak' : 'shortBreak')
    } else {
      switchMode('focus')
    }
  }, [mode, sessions.length, switchMode])

  const toggleFullscreen = useCallback((): void => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }, [])

  // Effect to handle Escape key or browser exit fullscreen
  useEffect(() => {
    const handleFullscreenChange = (): void => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault() // Prevent scrolling
          handlePlayPause()
          break
        case 'KeyR':
          handleReset()
          break
        case 'KeyS':
          handleSkip()
          break
        case 'KeyF':
          toggleFullscreen()
          break
        case 'KeyM':
          updatePreferences({ soundEnabled: !preferences.soundEnabled })
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    handlePlayPause,
    handleReset,
    handleSkip,
    toggleFullscreen,
    preferences.soundEnabled,
    updatePreferences
  ])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const maxDuration = getDuration(mode)
  const progress = ((maxDuration - timeLeft) / maxDuration) * 100

  const modeConfig = {
    focus: {
      title: 'Focus Time',
      emoji: '🎯',
      color: 'from-blue-500 to-purple-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    shortBreak: {
      title: 'Short Break',
      emoji: '☕',
      color: 'from-green-500 to-teal-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30'
    },
    longBreak: {
      title: 'Long Break',
      emoji: '🌴',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30'
    }
  }

  const currentConfig = modeConfig[mode]

  return (
    <div className="space-y-6 relative">
      <canvas
        ref={confettiCanvasRef}
        className="fixed inset-0 pointer-events-none z-[9999] w-full h-full"
      />
      {/* Header - Hidden in Fullscreen unless hovered or via overlay logic in future */}
      {!isFullscreen && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pomodoro Timer</h1>
            <p className="text-muted-foreground mt-1">Stay focused and productive</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all hover:scale-105"
              title="Fullscreen Mode"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all hover:scale-105"
              title="Timer Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards - Hidden in Fullscreen */}
      {!isFullscreen && (
        <TimerStats totalFocusTime={totalWorkTime} sessionsCompleted={sessions.length} />
      )}

      {/* Main Timer Card */}
      <div
        className={`transition-all duration-500 ${
          isFullscreen
            ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl p-8'
            : 'glass-card p-8 rounded-xl'
        }`}
      >
        {isFullscreen && (
          <div className="absolute top-6 right-6 flex gap-2 z-50">
            <button
              onClick={() => setShowSettings(true)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              title="Exit Fullscreen"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className={`max-w-2xl mx-auto space-y-8 ${isFullscreen ? 'scale-125' : ''}`}>
          {/* Subject Selector */}
          <div className="flex justify-center">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-white/5 border border-border dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
            >
              <option value="">No specific subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id} className="bg-[#1e293b]">
                  {subject.icon} {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => switchMode('focus')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === 'focus'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-muted-foreground'
              }`}
            >
              🎯 Focus
            </button>
            <button
              onClick={() => switchMode('shortBreak')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === 'shortBreak'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-muted-foreground'
              }`}
            >
              ☕ Short Break
            </button>
            <button
              onClick={() => switchMode('longBreak')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === 'longBreak'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-muted-foreground'
              }`}
            >
              🌴 Long Break
            </button>
          </div>

          {/* Circular Timer Display */}
          <div className="flex flex-col items-center">
            <motion.div
              className="relative w-80 h-80"
              animate={
                isRunning && preferences.glowEffectEnabled ? { scale: [1, 1.02, 1] } : { scale: 1 }
              }
              transition={{
                repeat: isRunning && preferences.glowEffectEnabled ? Infinity : 0,
                duration: 2,
                ease: 'easeInOut'
              }}
            >
              {/* Animated glow when running */}
              {isRunning && preferences.glowEffectEnabled && (
                <motion.div
                  className="absolute inset-0 rounded-full blur-3xl opacity-20"
                  style={{
                    background: `linear-gradient(135deg, rgb(99, 102, 241), rgb(139, 92, 246))`
                  }}
                  animate={{ opacity: [0.15, 0.3, 0.15] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                />
              )}
              {/* Background Circle */}
              <svg className="w-full h-full transform -rotate-90 relative z-10">
                <circle
                  cx="160"
                  cy="160"
                  r="140"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-white/5"
                />
                {/* Progress Circle */}
                <motion.circle
                  cx="160"
                  cy="160"
                  r="140"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 880 }}
                  animate={{ strokeDashoffset: 880 - (880 * progress) / 100 }}
                  style={{
                    strokeDasharray: 880
                  }}
                  transition={{ duration: 0.5 }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop
                      offset="0%"
                      className={`${currentConfig.color.split(' ')[0].replace('from-', 'text-')}`}
                      stopColor="currentColor"
                    />
                    <stop
                      offset="100%"
                      className={`${currentConfig.color.split(' ')[2]}`}
                      stopColor="currentColor"
                    />
                  </linearGradient>
                </defs>
              </svg>

              {/* Timer Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <div className="text-6xl mb-2">{currentConfig.emoji}</div>
                <div className="text-6xl font-bold font-mono">{formatTime(timeLeft)}</div>
                <div className="text-lg text-muted-foreground mt-2">{currentConfig.title}</div>
              </div>
            </motion.div>
          </div>

          {/* Session Counter */}
          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              Session {sessions.length + 1} • {4 - (sessions.length % 4)} until long break
            </div>
            <div className="flex gap-1 justify-center mt-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < sessions.length % 4 ? 'bg-primary' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3 justify-center">
            <motion.button
              onClick={handleReset}
              whileHover={{ scale: 1.1, rotate: -15 }}
              whileTap={{ scale: 0.9 }}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-colors shadow-lg"
              title="Reset"
            >
              <RotateCcw className="w-6 h-6" />
            </motion.button>
            <motion.button
              onClick={handlePlayPause}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-6 rounded-full transition-all shadow-xl ${
                isRunning
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
                  : `bg-gradient-to-br ${currentConfig.color} text-white`
              }`}
            >
              {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </motion.button>
            <motion.button
              onClick={handleSkip}
              whileHover={{ scale: 1.1, x: 3 }}
              whileTap={{ scale: 0.9 }}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-colors shadow-lg"
              title="Skip"
            >
              <SkipForward className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-2xl">🎯</div>
            <h3 className="font-semibold">Focus Session</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            25 minutes of deep, focused work on your studies
          </p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-2xl">☕</div>
            <h3 className="font-semibold">Short Break</h3>
          </div>
          <p className="text-sm text-muted-foreground">5 minutes to rest and recharge</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-2xl">🌴</div>
            <h3 className="font-semibold">Long Break</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            15 minutes after 4 sessions to fully relax
          </p>
        </div>
      </div>

      {/* Weekly History Chart */}
      {!isFullscreen && <WeeklyChart refreshKey={sessions.length} />}

      {/* Timer Settings Modal */}
      <TimerSettings open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
