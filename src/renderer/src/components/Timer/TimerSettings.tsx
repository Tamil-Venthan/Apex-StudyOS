import { useState } from 'react'
import { X, Volume2, Bell, Settings as SettingsIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTimerPreferences } from '@renderer/stores/useTimerPreferences'
import { soundManager } from '@renderer/utils/soundManager'

interface TimerSettingsProps {
  open: boolean
  onClose: () => void
}

export default function TimerSettings({ open, onClose }: TimerSettingsProps): React.JSX.Element {
  const { preferences, updatePreferences, resetToDefaults } = useTimerPreferences()
  const [localPrefs, setLocalPrefs] = useState(preferences)

  const handleSave = (): void => {
    updatePreferences(localPrefs)
    onClose()
  }

  const handleReset = (): void => {
    resetToDefaults()
    setLocalPrefs(useTimerPreferences.getState().preferences)
  }

  const handlePreviewSound = (): void => {
    soundManager.playSound(localPrefs.soundType, localPrefs.soundVolume)
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold">Timer Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Duration Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Duration Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Focus Duration: {Math.floor(localPrefs.focusDuration / 60)} minutes
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="240"
                      value={Math.floor(localPrefs.focusDuration / 60)}
                      onChange={(e) =>
                        setLocalPrefs({
                          ...localPrefs,
                          focusDuration: parseInt(e.target.value) * 60
                        })
                      }
                      className="w-full accent-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Short Break: {Math.floor(localPrefs.shortBreakDuration / 60)} minutes
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="60"
                      value={Math.floor(localPrefs.shortBreakDuration / 60)}
                      onChange={(e) =>
                        setLocalPrefs({
                          ...localPrefs,
                          shortBreakDuration: parseInt(e.target.value) * 60
                        })
                      }
                      className="w-full accent-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Long Break: {Math.floor(localPrefs.longBreakDuration / 60)} minutes
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      value={Math.floor(localPrefs.longBreakDuration / 60)}
                      onChange={(e) =>
                        setLocalPrefs({
                          ...localPrefs,
                          longBreakDuration: parseInt(e.target.value) * 60
                        })
                      }
                      className="w-full accent-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Long Break Interval: Every {localPrefs.longBreakInterval} sessions
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="8"
                      value={localPrefs.longBreakInterval}
                      onChange={(e) =>
                        setLocalPrefs({
                          ...localPrefs,
                          longBreakInterval: parseInt(e.target.value)
                        })
                      }
                      className="w-full accent-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Sound Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Sound Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Enable Sound</span>
                    <button
                      onClick={() =>
                        setLocalPrefs({ ...localPrefs, soundEnabled: !localPrefs.soundEnabled })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        localPrefs.soundEnabled ? 'bg-primary' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          localPrefs.soundEnabled ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      Volume: {localPrefs.soundVolume}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={localPrefs.soundVolume}
                      onChange={(e) =>
                        setLocalPrefs({ ...localPrefs, soundVolume: parseInt(e.target.value) })
                      }
                      disabled={!localPrefs.soundEnabled}
                      className="w-full accent-primary disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Sound Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['bell', 'chime', 'digital', 'bowl'] as const).map((sound) => (
                        <button
                          key={sound}
                          onClick={() => setLocalPrefs({ ...localPrefs, soundType: sound })}
                          disabled={!localPrefs.soundEnabled}
                          className={`p-3 rounded-lg font-medium transition-all ${
                            localPrefs.soundType === sound
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-white/5 hover:bg-white/10 disabled:opacity-50'
                          }`}
                        >
                          {sound.charAt(0).toUpperCase() + sound.slice(1)}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handlePreviewSound}
                      disabled={!localPrefs.soundEnabled}
                      className="mt-2 w-full p-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Bell className="w-4 h-4" />
                      Preview Sound
                    </button>
                  </div>
                </div>
              </div>

              {/* Behavior Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Behavior</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Auto-start Breaks</span>
                    <button
                      onClick={() =>
                        setLocalPrefs({
                          ...localPrefs,
                          autoStartBreaks: !localPrefs.autoStartBreaks
                        })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        localPrefs.autoStartBreaks ? 'bg-primary' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          localPrefs.autoStartBreaks ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Auto-start Pomodoros</span>
                    <button
                      onClick={() =>
                        setLocalPrefs({
                          ...localPrefs,
                          autoStartPomodoros: !localPrefs.autoStartPomodoros
                        })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        localPrefs.autoStartPomodoros ? 'bg-primary' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          localPrefs.autoStartPomodoros ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Desktop Notifications</span>
                    <button
                      onClick={() =>
                        setLocalPrefs({
                          ...localPrefs,
                          notificationsEnabled: !localPrefs.notificationsEnabled
                        })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        localPrefs.notificationsEnabled ? 'bg-primary' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          localPrefs.notificationsEnabled ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pulse Glow Effect</span>
                    <button
                      onClick={() =>
                        setLocalPrefs({
                          ...localPrefs,
                          glowEffectEnabled: !localPrefs.glowEffectEnabled
                        })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        localPrefs.glowEffectEnabled ? 'bg-primary' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          localPrefs.glowEffectEnabled ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion Celebration</span>
                    <button
                      onClick={() =>
                        setLocalPrefs({
                          ...localPrefs,
                          celebrationEnabled: !localPrefs.celebrationEnabled
                        })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        localPrefs.celebrationEnabled ? 'bg-primary' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          localPrefs.celebrationEnabled ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 mt-6 pt-6 border border-border dark:border-white/10">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors"
              >
                Reset to Defaults
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 rounded-lg font-medium transition-colors"
              >
                Save Settings
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
