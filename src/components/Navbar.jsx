import React from 'react'
import { 
  Timer, 
  Flame, 
  Clock, 
  User, 
  Sparkles
} from 'lucide-react'
import { formatTimerDisplay } from '../utils/formatters'
import { isSuperAdminUser } from '../lib/auth'

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  activeTimer, 
  user, 
  theme = 'dark', 
  toggleTheme, 
  onOpenAuthModal, 
  onOpenTimer 
}) {
  const getTabTitle = () => {
    switch (currentTab) {
      case 'today':
        return { title: "Today's Focus Cockpit", subtitle: 'Daily tasks, live launcher & target tracking' }
      case 'tasks':
        return { title: 'All Tasks & Focus Backlog', subtitle: 'Manage goals, track cumulative time & launch timers' }
      case 'week':
        return { title: 'Weekly Dashboard', subtitle: 'Focus time & productivity trends' }
      case 'timer':
        return { title: 'Focus Timer', subtitle: 'Stopwatch & Pomodoro interval tracker' }
      case 'history':
        return { title: 'Session History', subtitle: 'Historical logs, filters & CSV export' }
      case 'badges':
        return { title: 'Streaks & Milestones', subtitle: 'Consistency heatmap & unlocked achievements' }
      case 'admin':
        return { title: 'Admin & Telemetry Console', subtitle: 'Live active timers & platform user analytics' }
      case 'legal':
        return { title: 'Privacy & Terms of Use', subtitle: 'Platform transparency, data privacy & terms of service' }
      case 'landing':
        return { title: 'Welcome to Track Timer', subtitle: 'The distraction-free focus & productivity cockpit' }
      default:
        return { title: 'Track Timer', subtitle: 'Focus Productivity' }
    }
  }

  const tabInfo = getTabTitle()

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-[#0c101a]/95 backdrop-blur-md transition-colors duration-200">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        
        {/* Left Side: Desktop shows View Title; Tablet/Mobile shows Brand & Logo */}
        <div className="flex items-center space-x-3">
          
          {/* Mobile & Tablet Brand (Visible ONLY on < 1024px) */}
          <div 
            onClick={() => {
              if (user && user.username && user.username !== 'Guest_User') {
                setCurrentTab('today')
              } else {
                setCurrentTab('landing')
              }
            }}
            className="flex lg:hidden items-center space-x-2.5 cursor-pointer py-1"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 p-1.5 shadow-md shadow-orange-500/25 flex items-center justify-center text-white flex-shrink-0">
              <Timer className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-orange-600 dark:text-orange-500 select-none">
              Track Timer
            </span>
          </div>

          {/* Desktop View Context Title (Visible ONLY on >= 1024px) */}
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center space-x-2 leading-tight">
              <span>{tabInfo.title}</span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-slate-400">
              {tabInfo.subtitle}
            </p>
          </div>

        </div>

        {/* Right Side: Clean Quick Status & Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Active Running Timer Mini-Widget */}
          {activeTimer && activeTimer.isRunning && (
            <button
              onClick={onOpenTimer}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-orange-500/15 dark:bg-orange-500/20 border border-orange-500/30 dark:border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-500/25 transition-all animate-pulse shadow-sm shadow-orange-500/20"
              title="Timer currently running! Click to view"
            >
              <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="text-xs font-mono font-bold">
                {formatTimerDisplay(activeTimer.seconds)}
              </span>
            </button>
          )}

          {/* Streak pill */}
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
            <span>{user?.streakDays ?? 0}d</span>
          </div>

          {/* User Profile Button */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center space-x-2 pl-1.5 pr-2 sm:pr-3 py-1 rounded-full bg-zinc-100 dark:bg-slate-800/80 hover:bg-zinc-200 dark:hover:bg-slate-700/80 border border-zinc-200 dark:border-white/10 text-xs text-zinc-800 dark:text-slate-200 transition-colors shadow-sm"
            title={user?.username && user.username !== 'Guest_User' ? `@${user.username}` : 'Sign In'}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
              {user?.username && user.username !== 'Guest_User'
                ? user.username[0]?.toUpperCase()
                : <User className="w-3.5 h-3.5" />}
            </div>
            <span className="hidden sm:inline max-w-[120px] truncate text-xs font-medium">
              {user?.username && user.username !== 'Guest_User'
                ? isSuperAdminUser(user) ? `@${user.username} 👑` : `@${user.username}`
                : 'Sign In'}
            </span>
          </button>

        </div>

      </div>
    </header>
  )
}
