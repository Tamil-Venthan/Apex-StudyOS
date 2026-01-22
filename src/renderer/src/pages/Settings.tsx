import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Palette,
  Database,
  Info,
  Github,
  Linkedin,
  Heart,
  Download,
  Trash2,
  CheckCircle2,
  FileText,
  Table,
  Bug
} from 'lucide-react'
import { useSettingsStore } from '@renderer/stores/useSettingsStore'
import { useSubjectStore } from '@renderer/stores/useSubjectStore'
import { useAnalyticsStore } from '@renderer/stores/useAnalyticsStore'

import { ExportService } from '@renderer/services/ExportService'
import UpdateChecker from '@renderer/components/UpdateChecker'
import ConfirmationDialog from '@renderer/components/ConfirmationDialog'

export default function Settings(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'about', label: 'About', icon: Info }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences and app settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="glass-card p-6 rounded-xl">
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'appearance' && <AppearanceSettings />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'data' && <DataSettings />}
        {activeTab === 'about' && <AboutSection />}
      </div>
    </div>
  )
}

function GeneralSettings(): React.JSX.Element {
  const {
    displayName,
    email,
    examName,
    examDate,
    autoSaveNotes,
    markAttendedComplete,
    showCompletionPercentages,
    updateProfile,
    updateExamDetails,
    updatePreference
  } = useSettingsStore()
  const [name, setName] = useState(displayName)
  const [emailValue, setEmailValue] = useState(email)
  const [eName, setEName] = useState(examName || '')
  const [eDate, setEDate] = useState(examDate ? new Date(examDate).toISOString().split('T')[0] : '')

  const handleSaveProfile = (): void => {
    updateProfile(name, emailValue)
  }

  const handleSaveExam = (): void => {
    updateExamDetails(eName, eDate || null)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSaveProfile}
              className="w-full max-w-md px-4 py-2.5 bg-background border border-border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email (optional)</label>
            <input
              type="email"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              onBlur={handleSaveProfile}
              placeholder="your.email@example.com"
              className="w-full max-w-md px-4 py-2.5 bg-background border border-border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border dark:border-white/10 pt-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Exam Details
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Target Exam Name</label>
            <input
              type="text"
              value={eName}
              onChange={(e) => setEName(e.target.value)}
              onBlur={handleSaveExam}
              placeholder="e.g. CMA Final, CA Inter"
              className="w-full max-w-md px-4 py-2.5 bg-background border border-border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Exam Date</label>
            <input
              type="date"
              value={eDate}
              onChange={(e) => {
                setEDate(e.target.value)
                updateExamDetails(eName, e.target.value || null)
              }}
              className="w-full max-w-md px-4 py-2.5 bg-background border border-border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all [color-scheme:dark]"
            />
            {eDate && (
              <p className="mt-2 text-sm text-green-400">
                {Math.ceil(
                  (new Date(eDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                )}{' '}
                days remaining
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Software Updates */}
      <UpdateChecker />

      <div className="border-t border-border dark:border-white/10 pt-6">
        <h3 className="text-lg font-semibold mb-4">Preferences</h3>
        <div className="space-y-3">
          <ToggleSetting
            label="Auto-save notes"
            description="Automatically save notes as you type"
            checked={autoSaveNotes}
            onChange={(checked) => updatePreference('autoSaveNotes', checked)}
          />
          <ToggleSetting
            label="Mark attended classes as complete"
            description="Automatically mark topics complete when attending classes"
            checked={markAttendedComplete}
            onChange={(checked) => updatePreference('markAttendedComplete', checked)}
          />
          <ToggleSetting
            label="Show completion percentages"
            description="Display progress percentages on cards"
            checked={showCompletionPercentages}
            onChange={(checked) => updatePreference('showCompletionPercentages', checked)}
          />
        </div>
      </div>
    </motion.div>
  )
}

function AppearanceSettings(): React.JSX.Element {
  const { theme, compactLayout, showAnimations, glassmorphicEffects, setTheme, updateAppearance } =
    useSettingsStore()

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Theme
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ThemeCard name="Dark" active={theme === 'dark'} onClick={() => setTheme('dark')} />
          <ThemeCard name="Light" active={theme === 'light'} onClick={() => setTheme('light')} />
          <ThemeCard name="Auto" active={theme === 'auto'} onClick={() => setTheme('auto')} />
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Current theme:{' '}
          {theme === 'dark' ? 'Dark Mode' : theme === 'light' ? 'Light Mode' : 'Auto (System)'}
        </p>
      </div>

      <div className="border-t border-border dark:border-white/10 pt-6">
        <h3 className="text-lg font-semibold mb-4">Display</h3>
        <div className="space-y-3">
          <ToggleSetting
            label="Compact layout"
            description="Use smaller cards and tighter spacing"
            checked={compactLayout}
            onChange={(checked) => updateAppearance('compactLayout', checked)}
          />
          <ToggleSetting
            label="Show animations"
            description="Enable smooth transitions and animations"
            checked={showAnimations}
            onChange={(checked) => updateAppearance('showAnimations', checked)}
          />
          <ToggleSetting
            label="Glassmorphic effects"
            description="Enable blur and transparency effects"
            checked={glassmorphicEffects}
            onChange={(checked) => updateAppearance('glassmorphicEffects', checked)}
          />
        </div>
      </div>
    </motion.div>
  )
}

function NotificationSettings(): React.JSX.Element {
  const { deadlineReminders, classReminders, dailySummary, updateNotifications } =
    useSettingsStore()

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h2>

        <div className="space-y-3">
          <ToggleSetting
            label="Deadline reminders"
            description="Get notified about upcoming deadlines"
            checked={deadlineReminders}
            onChange={(checked) => updateNotifications('deadlineReminders', checked)}
          />

          <ToggleSetting
            label="Class reminders"
            description="Remind me about pending classes"
            checked={classReminders}
            onChange={(checked) => updateNotifications('classReminders', checked)}
          />
          <ToggleSetting
            label="Daily study summary"
            description="Receive a daily summary of your progress"
            checked={dailySummary}
            onChange={(checked) => updateNotifications('dailySummary', checked)}
          />
        </div>
      </div>
    </motion.div>
  )
}

function DataSettings(): React.JSX.Element {
  const [showSuccess, setShowSuccess] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [exportType, setExportType] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const { resetAllSettings, displayName, examName } = useSettingsStore()
  const { subjects } = useSubjectStore()
  const { sessions } = useAnalyticsStore()

  const handleExportPDF = (): void => {
    try {
      const doc = ExportService.generateProgressReport({
        userName: displayName,
        examName: examName,
        totalStudyTime: sessions.reduce((acc, s) => acc + s.duration, 0),
        subjects,
        sessions
      })
      ExportService.downloadPDF(doc, `study-progress-${new Date().toISOString().split('T')[0]}.pdf`)
      setShowSuccess(true)
      setExportType('PDF')
      setTimeout(() => {
        setShowSuccess(false)
        setExportType(null)
      }, 3000)
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('PDF export failed. Please try again.')
    }
  }

  const handleExportCSV = (type: 'sessions' | 'subjects'): void => {
    try {
      let csv = ''
      let filename = ''

      switch (type) {
        case 'sessions':
          csv = ExportService.exportSessionsCSV(sessions)
          filename = 'study-sessions'
          break
        case 'subjects':
          csv = ExportService.exportSubjectsCSV(subjects)
          filename = 'subjects'
          break
      }

      ExportService.downloadFile(
        csv,
        `${filename}-${new Date().toISOString().split('T')[0]}.csv`,
        'text/csv'
      )
      setShowSuccess(true)
      setExportType('CSV')
      setTimeout(() => {
        setShowSuccess(false)
        setExportType(null)
      }, 3000)
    } catch (error) {
      console.error('CSV export failed:', error)
      alert('CSV export failed. Please try again.')
    }
  }

  const handleExport = async (): Promise<void> => {
    try {
      // Get all data from stores
      const settings = localStorage.getItem('apex-settings')

      // Get database backup
      const result = await window.electron.ipcRenderer.invoke('app:createBackup')
      if (!result.success) throw new Error(result.error)

      const exportData = {
        settings: settings ? JSON.parse(settings) : {},
        database: result.data,
        exportedAt: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `apex-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setShowSuccess(true)
      setExportType('Backup')
      setTimeout(() => {
        setShowSuccess(false)
        setExportType(null)
      }, 3000)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        if (data.settings) {
          localStorage.setItem('apex-settings', JSON.stringify(data.settings))
        }

        if (data.database) {
          const result = await window.electron.ipcRenderer.invoke(
            'app:restoreBackup',
            data.database
          )
          if (!result.success) throw new Error(result.error)
        }

        setImportStatus('Data imported successfully! Reloading...')
        setTimeout(() => window.location.reload(), 1500)
      } catch (error) {
        console.error('Import failed:', error)
        setImportStatus('Failed to import file. Invalid format or database error.')
      }
    }
    reader.readAsText(file)
  }

  const handleReset = (): void => {
    setShowResetConfirm(true)
  }

  const confirmReset = async (): Promise<void> => {
    try {
      await window.electron.ipcRenderer.invoke('app:resetData')
      resetAllSettings()
      localStorage.clear()
      window.location.reload()
    } catch (error) {
      console.error('Failed to reset data:', error)
      alert('Failed to reset data. Please check console for details.')
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Management
        </h2>

        <div className="space-y-4">
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Study Progress Report
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Generate a comprehensive PDF report of your study progress
            </p>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-sm font-medium transition-colors"
            >
              Export Progress Report (PDF)
            </button>
          </div>

          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Table className="w-4 h-4 text-green-400" />
              Export Data (CSV)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Export your data in CSV format for analysis in Excel or Google Sheets
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleExportCSV('sessions')}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-sm font-medium transition-colors"
              >
                Export Sessions
              </button>
              <button
                onClick={() => handleExportCSV('subjects')}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-sm font-medium transition-colors"
              >
                Export Subjects
              </button>
            </div>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-400" />
              Backup & Restore
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Export your data for safety or import a backup file.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-sm font-medium transition-colors"
              >
                Export All Data
              </button>
              <div className="relative">
                <input
                  type="file"
                  id="import-file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
                <label
                  htmlFor="import-file"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors cursor-pointer inline-block"
                >
                  Import Backup
                </label>
              </div>
            </div>

            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm text-green-400 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {exportType} exported successfully!
              </motion.div>
            )}
            {importStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-3 text-sm flex items-center gap-2 ${importStatus.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}
              >
                <Info className="w-4 h-4" />
                {importStatus}
              </motion.div>
            )}
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              Database Location
            </h3>
            <p className="text-sm text-muted-foreground mb-2">Your data is stored locally at:</p>
            <code className="text-xs bg-black/30 px-2 py-1 rounded block overflow-x-auto">
              ./dev.db
            </code>
          </div>

          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-400">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Permanently delete all your data. This action cannot be undone.
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors text-red-400"
            >
              Reset All Data
            </button>
          </div>
        </div>
      </div>
      <ConfirmationDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={confirmReset}
        title="Reset All Data"
        description="Are you sure you want to delete all data? This includes your profile, notes, subjects, and study history. This action uses a hard reset and cannot be undone."
        confirmText="Reset Everything"
        variant="danger"
      />
    </motion.div>
  )
}

function AboutSection(): React.JSX.Element {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Hero Section */}
      <div className="relative text-center space-y-4 py-8 overflow-hidden rounded-2xl bg-gradient-to-b from-primary/10 to-transparent border border-primary/20">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="text-7xl mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">🎓</div>
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-pink-400">
            Apex StudyOS
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto mt-2">
            Your Complete Study Companion for CMA/CA Exam Preparation
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Version
            </span>
            <span className="font-mono text-sm font-bold">1.1.0</span>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          </div>
        </motion.div>
      </div>

      <div className="space-y-6">
        {/* New Features Highlight */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="group relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 p-1"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div className="relative bg-background/50 backdrop-blur-xl p-6 rounded-lg h-full">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-xl text-primary">
              <span className="text-2xl">✨</span> What&apos;s New in v1.1
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ul className="space-y-3">
                {[
                  'Immersive Fullscreen Timer Mode',
                  'Weekly Focus History Chart',
                  'Custom Soundscapes & Volume'
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3 text-sm text-foreground/80"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {item}
                  </motion.li>
                ))}
              </ul>
              <ul className="space-y-3">
                {[
                  'Keyboard Shortcuts Support',
                  'Session Completion Celebrations',
                  'Enhanced Visual Animations'
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-3 text-sm text-foreground/80"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: 'Core Features',
              icon: '📚',
              color: 'text-blue-400',
              items: [
                'Subject & Module Management',
                'Class Attendance Tracking',
                'Advanced Focus Timer'
              ]
            },
            {
              title: 'Analytics & Insights',
              icon: '📈',
              color: 'text-green-400',
              items: ['Study Time Trends', 'Productivity Heatmaps', 'Subject Progress Charts']
            },
            {
              title: 'Planning',
              icon: '📅',
              color: 'text-amber-400',
              items: ['Interactive Calendar', 'Timeline & Schedule', 'Deadline Tracking']
            },
            {
              title: 'Smart Notifications',
              icon: '🔔',
              color: 'text-purple-400',
              items: ['Deadline Alerts', 'Study Reminders', 'Streak Celebrations']
            },
            {
              title: 'Export & Backup',
              icon: '💾',
              color: 'text-pink-400',
              items: ['PDF Progress Reports', 'CSV Data Exports', 'Full Backup & Restore']
            },
            {
              title: 'Customization',
              icon: '🎨',
              color: 'text-cyan-400',
              items: ['Dark/Light Theme', 'Glassmorphic Design', 'Custom Preferences']
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * idx }}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
              className="glass-card p-5 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm transition-all duration-300"
            >
              <h3 className={`font-semibold mb-3 ${feature.color} flex items-center gap-2`}>
                <span className="text-xl">{feature.icon}</span> {feature.title}
              </h3>
              <ul className="space-y-2">
                {feature.items.map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 opacity-50" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Developer & Community */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6"
      >
        <div className="glass-card p-6 rounded-xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent flex flex-col items-center justify-center text-center group hover:border-primary/30 transition-colors">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 p-[2px] mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-2xl font-bold text-white">
              TV
            </div>
          </div>
          <h4 className="text-lg font-bold">Tamil Venthan</h4>
          <p className="text-xs text-primary mb-4"></p>
          <div className="flex gap-3">
            <a
              href="https://github.com/Tamil-Venthan"
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all hover:text-white"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://www.linkedin.com/in/tamil-venthan4/"
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg transition-all"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl border border-white/5 bg-gradient-to-br from-red-500/5 to-transparent flex flex-col items-center justify-center text-center hover:border-red-500/30 transition-colors group">
          <div className="mb-4 p-4 rounded-full bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform duration-300">
            <Bug className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold mb-1">Found an Issue?</h4>
          <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
            Help improve Apex StudyOS by reporting bugs or suggesting features
          </p>
          <a
            href="https://forms.gle/M94PsimS9pmHkfFk9"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full text-sm font-medium transition-colors"
          >
            Report Issue
          </a>
        </div>
      </motion.div>

      <div className="text-center pt-8 pb-4">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
          Made with <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" /> for CMA/CA
          Students
        </p>
        <div className="text-xs text-muted-foreground/50 mt-2">
          © 2026 Apex StudyOS. Open Source Project.
        </div>
      </div>
    </motion.div>
  )
}

interface ToggleSettingProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange
}: ToggleSettingProps): React.JSX.Element {
  const handleToggle = (): void => {
    onChange(!checked)
  }

  return (
    <div className="flex items-start justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <button
        onClick={handleToggle}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-white/20'
        }`}
      >
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full"
        />
      </button>
    </div>
  )
}

interface ThemeCardProps {
  name: string
  active: boolean
  onClick?: () => void
}

function ThemeCard({ name, active, onClick }: ThemeCardProps): React.JSX.Element {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
        active ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/30'
      }`}
    >
      <div className="font-medium mb-1">{name}</div>
      {active && <div className="text-xs text-primary">Active</div>}
    </div>
  )
}
