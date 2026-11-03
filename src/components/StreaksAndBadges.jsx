import React from 'react'
import { 
  Trophy, 
  Flame, 
  Award, 
  Calendar, 
  CheckCircle2, 
  Lock, 
  Star,
  Zap,
  Clock,
  Sparkles
} from 'lucide-react'
import { formatDuration, getLocalDateString } from '../utils/formatters'

export default function StreaksAndBadges({ sessions, user }) {
  const totalSeconds = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0)
  const totalHours = totalSeconds / 3600

  // Calculate streak: how many consecutive days user was active
  const activeDateSet = new Set(
    sessions.map(s => getLocalDateString(s.startTime))
  )

  // Generate last 28 days for the heatmap
  const heatmapDays = []
  const today = new Date()
  for (let i = 27; i >= 0; i--) {
    const d = new Date()
    d.setDate(today.getDate() - i)
    const dateStr = getLocalDateString(d)
    
    // Total seconds for this day
    const daySecs = sessions
      .filter(s => getLocalDateString(s.startTime) === dateStr)
      .reduce((acc, s) => acc + (s.durationSeconds || 0), 0)

    heatmapDays.push({
      dateStr,
      date: d,
      seconds: daySecs,
      hours: daySecs / 3600,
      isToday: i === 0
    })
  }

  // Badges criteria
  const badges = [
    {
      id: 'first-session',
      name: 'First Step Taken',
      desc: 'Complete and save your first focus session.',
      icon: Zap,
      unlocked: sessions.length >= 1,
      progress: Math.min(100, Math.round((sessions.length / 1) * 100)),
      color: 'from-amber-500 to-orange-500'
    },
    {
      id: 'three-day-streak',
      name: 'Consistency Kickoff',
      desc: 'Maintain a 3-day active tracking streak.',
      icon: Flame,
      unlocked: (user?.streakDays || 0) >= 3,
      progress: Math.min(100, Math.round(((user?.streakDays || 0) / 3) * 100)),
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'seven-day-champion',
      name: 'Consistency Champion',
      desc: 'Hit a full 7-day unbroken streak.',
      icon: Trophy,
      unlocked: (user?.streakDays || 0) >= 7,
      progress: Math.min(100, Math.round(((user?.streakDays || 0) / 7) * 100)),
      color: 'from-yellow-400 to-amber-600'
    },
    {
      id: 'deep-diver',
      name: 'Deep Diver',
      desc: 'Complete an uninterrupted session over 90 minutes.',
      icon: Clock,
      unlocked: sessions.some(s => s.durationSeconds >= 5400),
      progress: sessions.some(s => s.durationSeconds >= 5400) ? 100 : 0,
      color: 'from-cyan-500 to-blue-600'
    },
    {
      id: 'weekend-warrior',
      name: 'Weekend Warrior',
      desc: 'Log a productive focus session on Saturday or Sunday.',
      icon: Star,
      unlocked: sessions.some(s => {
        const day = new Date(s.startTime).getDay()
        return day === 0 || day === 6
      }),
      progress: sessions.some(s => {
        const day = new Date(s.startTime).getDay()
        return day === 0 || day === 6
      }) ? 100 : 0,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'century-club',
      name: 'Century Club (100h)',
      desc: 'Accumulate 100 total hours of logged productivity.',
      icon: Award,
      unlocked: totalHours >= 100,
      progress: Math.min(100, Math.round((totalHours / 100) * 100)),
      color: 'from-emerald-400 to-teal-600'
    }
  ]

  const unlockedCount = badges.filter(b => b.unlocked).length

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-600/15 via-amber-600/10 to-transparent border border-orange-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Consistency Milestones</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Streaks & Milestones
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-slate-300 mt-1 max-w-xl">
            Consistency is the bedrock of mastery. Track your daily habits, build momentum, and collect badges as proof of your focused work.
          </p>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4 bg-white dark:bg-[#10141f] border border-zinc-200 dark:border-white/10 rounded-2xl p-3 sm:p-4 flex-shrink-0 shadow-sm">
          <div className="p-2.5 sm:p-3 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400">
            <Flame className="w-6 h-6 sm:w-8 sm:h-8 fill-orange-500 dark:fill-orange-400" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400">Current Streak</span>
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white font-mono">
              {user?.streakDays ?? 0} <span className="text-xs sm:text-sm font-normal text-zinc-500 dark:text-slate-400">Days</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {(user?.streakDays || 0) > 0 ? '🔥 Active' : 'Start tracking'}
            </span>
          </div>
        </div>
      </div>

      {/* 28-Day Heatmap Grid */}
      <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">4-Week Activity Consistency Matrix</h3>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-zinc-500 dark:text-slate-400">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded bg-zinc-200 dark:bg-slate-800"></span>
            <span className="w-2.5 h-2.5 rounded bg-orange-500/30"></span>
            <span className="w-2.5 h-2.5 rounded bg-orange-500/60"></span>
            <span className="w-2.5 h-2.5 rounded bg-orange-500"></span>
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Blocks */}
        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-2">
          {heatmapDays.map((d) => {
            let colorClass = 'bg-zinc-100 dark:bg-[#0a0d14] border border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-slate-400'
            if (d.hours > 4) colorClass = 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
            else if (d.hours > 2) colorClass = 'bg-orange-500/60 text-white'
            else if (d.hours > 0) colorClass = 'bg-orange-500/20 text-orange-700 dark:bg-orange-500/30 dark:text-orange-200'

            return (
              <div 
                key={d.dateStr}
                className="flex flex-col items-center group relative cursor-pointer"
              >
                <div 
                  className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-mono font-medium transition-all group-hover:scale-105 ${colorClass} ${
                    d.isToday ? 'ring-2 ring-orange-500 dark:ring-white/60' : ''
                  }`}
                >
                  {d.date.getDate()}
                </div>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 whitespace-nowrap bg-zinc-900 border border-zinc-700 text-white text-[11px] px-2 py-1 rounded shadow-lg pointer-events-none">
                  {d.dateStr}: {formatDuration(d.seconds)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Badges Showcase Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Milestone & Focus Badges</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            {unlockedCount} / {badges.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map(badge => {
            const Icon = badge.icon
            return (
              <div
                key={badge.id}
                className={`rounded-2xl border p-5 transition-all relative overflow-hidden ${
                  badge.unlocked
                    ? 'bg-white dark:bg-[#111622] border-orange-500/30 shadow-sm'
                    : 'bg-zinc-50 dark:bg-[#0d1017] border-zinc-200 dark:border-white/5 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${badge.color} flex items-center justify-center text-white shadow-md ${
                    !badge.unlocked ? 'grayscale opacity-50' : ''
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {badge.unlocked ? (
                    <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-[11px] font-semibold text-zinc-500 dark:text-slate-500 bg-zinc-200/60 dark:bg-white/5 px-2 py-0.5 rounded-full">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Locked</span>
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-zinc-900 dark:text-white mt-4">{badge.name}</h4>
                <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1 leading-relaxed">{badge.desc}</p>

                {/* Progress bar */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/5">
                  <div className="flex justify-between text-[11px] text-zinc-500 dark:text-slate-400 mb-1">
                    <span>Progress</span>
                    <span className="font-mono">{Math.round(badge.progress || 0)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${badge.color}`}
                      style={{ width: `${Math.min(100, Math.round(badge.progress || 0))}%` }}
                    ></div>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
