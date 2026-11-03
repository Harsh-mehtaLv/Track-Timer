import React from 'react'
import { CalendarCheck, CheckSquare, CalendarDays, Timer, History, Trophy, ShieldCheck } from 'lucide-react'
import { formatTimerDisplay } from '../utils/formatters'
import { isSuperAdminUser } from '../lib/auth'

export default function BottomNav({ currentTab, setCurrentTab, activeTimer, user }) {
  const tabs = [
    { id: 'today', label: 'Today', icon: CalendarCheck },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'timer', label: 'Timer', icon: Timer, hasPing: activeTimer?.isRunning },
    { id: 'week', label: 'Weekly', icon: CalendarDays },
    { id: 'history', label: 'History', icon: History },
    { id: 'badges', label: 'Badges', icon: Trophy },
    ...(isSuperAdminUser(user) ? [{ id: 'admin', label: 'Admin', icon: ShieldCheck }] : [])
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0a0d14]/95 backdrop-blur-xl border-t border-zinc-200 dark:border-white/10 px-2 py-2 shadow-2xl safe-bottom transition-colors">
      <div className="max-w-lg mx-auto flex justify-around items-center">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = currentTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 sm:px-4 rounded-2xl transition-all relative group ${
                isActive
                  ? 'text-orange-600 dark:text-orange-400 font-semibold'
                  : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'scale-110 text-orange-600 dark:text-orange-400' : ''
                }`} />

                {/* Pulsing Ping Indicator if Timer is Running */}
                {tab.hasPing && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                  </span>
                )}
              </div>

              {/* Tab Name Label */}
              <span className={`text-[11px] mt-1 tracking-tight transition-colors ${
                isActive ? 'font-bold text-orange-600 dark:text-orange-400' : 'font-medium'
              }`}>
                {tab.label}
              </span>

              {/* Active Dot indicator */}
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-orange-600 dark:bg-orange-400 mt-0.5"></span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
