import React from 'react'
import { 
  CalendarCheck,
  CalendarDays, 
  Timer, 
  History, 
  Trophy, 
  Flame, 
  User, 
  Sun, 
  Moon, 
  Database, 
  Sparkles, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  CheckSquare
} from 'lucide-react'
import { formatTimerDisplay } from '../utils/formatters'
import { isSuperAdminUser } from '../lib/auth'

export default function Sidebar({
  currentTab,
  setCurrentTab,
  activeTimer,
  user,
  theme = 'dark',
  toggleTheme,
  onOpenAuthModal,
  sessionsCount = 0,
  tasksCount = 0
}) {
  const navTabs = [
    { 
      id: 'today', 
      label: 'Today', 
      icon: CalendarCheck,
      description: 'Daily cockpit & quick launch'
    },
    { 
      id: 'tasks', 
      label: 'All Tasks', 
      icon: CheckSquare,
      description: 'Task backlog & focus tracker',
      count: tasksCount
    },
    { 
      id: 'week', 
      label: 'Weekly Dashboard', 
      icon: CalendarDays,
      description: 'Overview & daily bars'
    },
    { 
      id: 'timer', 
      label: 'Focus Timer', 
      icon: Timer,
      description: 'Pomodoro & Stopwatch',
      badge: activeTimer?.isRunning ? 'Running' : null
    },
    { 
      id: 'history', 
      label: 'Session History', 
      icon: History,
      description: 'Logs & CSV export',
      count: sessionsCount
    },
    { 
      id: 'badges', 
      label: 'Badges & Streaks', 
      icon: Trophy,
      description: 'Consistency & heatmap'
    },
    ...(isSuperAdminUser(user) ? [{ 
      id: 'admin', 
      label: 'Admin Console', 
      icon: ShieldCheck,
      description: 'Live active users & telemetry',
      badge: 'Live'
    }] : []),
  ]

  return (
    <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 h-full bg-white dark:bg-[#0c101a] border-r border-zinc-200 dark:border-white/10 z-30 transition-colors duration-200 select-none">
      
      {/* Brand Header */}
      <div 
        onClick={() => {
          if (user && user.username && user.username !== 'Guest_User') {
            setCurrentTab('today')
          } else {
            setCurrentTab('landing')
          }
        }}
        className="h-16 px-6 flex items-center space-x-3 border-b border-zinc-200 dark:border-white/10 cursor-pointer group"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 p-2 shadow-md shadow-orange-500/25 flex items-center justify-center text-white group-hover:scale-105 group-hover:shadow-orange-500/40 transition-all flex-shrink-0">
          <Timer className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <span className="font-extrabold text-xl tracking-tight text-orange-600 dark:text-orange-500 block leading-tight">
            Track Timer
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-slate-500">
            Focus Productivity
          </span>
        </div>
      </div>

      {/* Navigation Options Section */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-slate-500 px-3 mb-2">
          Navigation
        </div>

        {navTabs.map(tab => {
          const Icon = tab.icon
          const isActive = currentTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-orange-500/10 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-semibold shadow-sm'
                  : 'text-zinc-600 dark:text-slate-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-400 dark:text-slate-400'
                }`} />
                <span className="truncate">{tab.label}</span>
              </div>

              {/* Badges / Counters */}
              {tab.badge && (
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-bold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  <span>{tab.badge}</span>
                </span>
              )}

              {tab.count !== undefined && tab.count > 0 && !tab.badge && (
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-slate-400 text-[11px] font-mono font-medium">
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}

        {/* Live Running Timer Mini Widget inside Sidebar */}
        {activeTimer?.isRunning && (
          <div 
            onClick={() => setCurrentTab('timer')}
            className="mt-6 p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/15 to-amber-500/10 border border-orange-500/30 cursor-pointer hover:border-orange-500/50 transition-all animate-fadeIn"
          >
            <div className="flex items-center justify-between text-xs text-orange-600 dark:text-orange-400 font-bold mb-1">
              <span className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Timer Running</span>
              </span>
              <span className="text-[10px] uppercase font-mono">LIVE</span>
            </div>
            <div className="font-mono text-xl font-extrabold text-zinc-900 dark:text-white">
              {formatTimerDisplay(activeTimer.seconds)}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-slate-400 truncate mt-0.5">
              {activeTimer.title || 'Focus Session'}
            </p>
          </div>
        )}
      </div>

      {/* Sidebar Footer: User Card + Theme Toggle */}
      <div className="p-4 border-t border-zinc-200 dark:border-white/10 space-y-3">
        
        {/* User Account Button */}
        <div 
          onClick={onOpenAuthModal}
          className="p-2.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 dark:bg-[#121622] dark:hover:bg-[#161c2b] border border-zinc-200 dark:border-white/10 flex items-center justify-between cursor-pointer transition-all group shadow-sm"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-extrabold text-sm flex items-center justify-center shadow-sm flex-shrink-0">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1">
                <span className="font-bold text-xs text-zinc-900 dark:text-white truncate block">
                  {user?.username && user.username !== 'Guest_User' ? `@${user.username}` : 'Guest User'}
                </span>
                {isSuperAdminUser(user) && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-600 dark:text-orange-400 font-extrabold tracking-tight">
                    ADMIN
                  </span>
                )}
              </div>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center space-x-1">
                <Flame className="w-3 h-3 fill-amber-500 dark:fill-amber-400" />
                <span>{user?.streakDays ?? 0}d Streak</span>
              </span>
            </div>
          </div>

          <div className="p-1 rounded-lg text-zinc-400 dark:text-slate-400 group-hover:text-zinc-900 dark:group-hover:text-white">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Theme Switcher Toggle Row */}
        <div className="flex items-center justify-between text-xs px-1 text-zinc-500 dark:text-slate-400">
          <span className="font-medium text-[11px]">Theme</span>
          <button
            onClick={toggleTheme}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-orange-600" />
                <span>Light</span>
              </>
            )}
          </button>
        </div>

      </div>

    </aside>
  )
}
