import {
  Home,
  BookOpen,
  GraduationCap,
  BarChart3,
  Calendar,
  CalendarDays,
  Timer,
  Settings,
  Github,
  Linkedin,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@renderer/lib/utils'
import { useUIStore } from '@renderer/stores/useUIStore'
import { useSettingsStore } from '@renderer/stores/useSettingsStore'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'My Subjects', href: '/subjects', icon: BookOpen },
  { name: 'My Classes', href: '/classes', icon: GraduationCap },

  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays },
  { name: 'Timeline', href: '/schedule', icon: Calendar },
  { name: 'Timer', href: '/timer', icon: Timer },

  { name: 'Settings', href: '/settings', icon: Settings }
]

export default function Sidebar(): React.JSX.Element {
  const location = useLocation()
  const { isSidebarCollapsed, toggleSidebar } = useUIStore()
  const { displayName, examName } = useSettingsStore()

  return (
    <div
      className={cn(
        'fixed left-0 top-8 h-[calc(100vh-2rem)] glass-card border-r border-border dark:border-white/10 p-4 flex flex-col transition-all duration-300 ease-in-out z-50',
        isSidebarCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('mb-8 flex items-center', isSidebarCollapsed ? 'justify-center' : 'px-2')}>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate flex items-center gap-2">
          {isSidebarCollapsed ? (
            <GraduationCap className="w-8 h-8 text-primary" />
          ) : (
            <>
              <GraduationCap className="w-8 h-8 text-primary" />
              <span>Apex</span>
            </>
          )}
        </h1>
        {!isSidebarCollapsed && (
          <p className="text-xs text-muted-foreground mt-1 ml-2 opacity-0 animate-fadeIn">
            Study Tracker
          </p>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-8 bg-black/50 border border-white/10 rounded-full p-1 hover:bg-primary hover:text-white transition-colors backdrop-blur-md"
      >
        {isSidebarCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              title={isSidebarCollapsed ? item.name : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                isSidebarCollapsed && 'justify-center px-0'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          'mt-auto pt-4 border-t border-white/10',
          isSidebarCollapsed && 'flex flex-col items-center'
        )}
      >
        {/* User Profile Section */}
        {!isSidebarCollapsed ? (
          <div className="mb-4 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {displayName || 'Student'}
                </p>
                {examName && <p className="text-xs text-muted-foreground truncate">{examName}</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 pb-4 border-b border-white/5 flex justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        )}

        <div className={cn('text-xs text-muted-foreground', isSidebarCollapsed && 'text-center')}>
          {!isSidebarCollapsed ? (
            <div>
              <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                <a
                  href="https://github.com/Tamil-Venthan"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="https://www.linkedin.com/in/tamil-venthan4/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
              <div className="mt-2 font-medium text-[10px] text-muted-foreground/60">
                Created by Tamil Venthan
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <a href="https://github.com/Tamil-Venthan" target="_blank" rel="noreferrer">
                <Github className="w-4 h-4 hover:text-white opacity-50 hover:opacity-100" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
