import React, { useState } from 'react'
import { 
  Sparkles, 
  Clock, 
  Target, 
  Flame, 
  ArrowRight, 
  Play, 
  ShieldCheck, 
  Database, 
  CheckCircle2, 
  BarChart3, 
  Zap, 
  Layers, 
  Download, 
  Lock,
  UserCheck,
  Heart
} from 'lucide-react'
import { DEFAULT_CATEGORIES, getCategoryById } from '../utils/categories'

export default function LandingView({
  user,
  categories = DEFAULT_CATEGORIES,
  onNavigateToToday,
  onNavigateToTimer,
  onOpenAuthModal,
  onStartQuickSession
}) {
  const [quickTitle, setQuickTitle] = useState('')
  const [quickCat, setQuickCat] = useState('frontend')

  const isLoggedIn = Boolean(user && user.username && user.username !== 'Guest_User')

  const handleQuickStart = (e) => {
    if (e) e.preventDefault()
    const title = quickTitle.trim() || 'Deep Work Session'
    if (onStartQuickSession) {
      onStartQuickSession(title, quickCat)
    } else if (onNavigateToTimer) {
      onNavigateToTimer()
    }
  }

  return (
    <div className="space-y-12 sm:space-y-16 animate-fadeIn w-full max-w-6xl mx-auto pb-12">
      
      {/* ============================================================== */}
      {/* 1. HERO SECTION (Incorporates the Welcome Explainer Section)    */}
      {/* ============================================================== */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 md:p-12 bg-gradient-to-br from-orange-600/15 via-amber-500/10 to-transparent border border-orange-500/30 shadow-xl backdrop-blur-sm">
        <div className="relative z-10 w-full space-y-5">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to Track Timer • Personal Focus & Productivity Engine</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.15]">
            The Distraction-Free <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">Focus & Productivity</span> Cockpit
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-slate-300 leading-relaxed font-normal">
            Track Timer is built for builders, developers, students, and deep workers who want to conquer procrastination and build unbreakable habits. Track intervals, manage task backlogs, watch weekly consistency heatmaps, and stay fully accountable.
          </p>

          {/* 3 Quick Value Highlights (From Today's Explainer Section) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0f1420]/80 border border-zinc-200/80 dark:border-white/10 shadow-sm backdrop-blur-sm">
              <div className="font-bold text-zinc-900 dark:text-white flex items-center space-x-2 mb-1.5 text-sm">
                <div className="p-1.5 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400">
                  <Clock className="w-4 h-4" />
                </div>
                <span>Focus Timer</span>
              </div>
              <span className="text-zinc-500 dark:text-slate-400 text-xs leading-normal block">
                Stopwatch & 25m Pomodoro with custom categories and instant interval tracking.
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0f1420]/80 border border-zinc-200/80 dark:border-white/10 shadow-sm backdrop-blur-sm">
              <div className="font-bold text-zinc-900 dark:text-white flex items-center space-x-2 mb-1.5 text-sm">
                <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Target className="w-4 h-4" />
                </div>
                <span>Tasks Backlog</span>
              </div>
              <span className="text-zinc-500 dark:text-slate-400 text-xs leading-normal block">
                Priority tags, custom statuses ("urgent basis", "will do later"), and 1-click timer launch.
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0f1420]/80 border border-zinc-200/80 dark:border-white/10 shadow-sm backdrop-blur-sm">
              <div className="font-bold text-zinc-900 dark:text-white flex items-center space-x-2 mb-1.5 text-sm">
                <div className="p-1.5 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400">
                  <Flame className="w-4 h-4" />
                </div>
                <span>Streaks & Badges</span>
              </div>
              <span className="text-zinc-500 dark:text-slate-400 text-xs leading-normal block">
                Daily activity matrix, milestones, and optional cloud database sync.
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={onNavigateToToday}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 flex items-center space-x-2"
              >
                <span>Go to Today's Cockpit (@{user.username})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 flex items-center space-x-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Create Free Account / Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onNavigateToToday}
                  className="px-5 py-3 rounded-xl bg-white dark:bg-[#15171e] hover:bg-zinc-100 dark:hover:bg-[#1e2230] text-zinc-800 dark:text-slate-200 border border-zinc-200 dark:border-white/10 font-semibold text-sm transition-all hover:scale-105 active:scale-95 flex items-center space-x-2 shadow-sm"
                >
                  <span>Try as Guest (Instant Access)</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onNavigateToTimer}
              className="px-4 py-3 rounded-xl text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 font-semibold text-sm transition-all flex items-center space-x-1.5"
            >
              <Clock className="w-4 h-4" />
              <span>Launch Focus Timer</span>
            </button>
          </div>

          {/* Login Process & Security Transparency Explainer */}
          <div className="pt-2">
            <div className="p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-[#0f1420]/90 border border-orange-500/25 shadow-sm space-y-2.5 backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2 font-bold text-zinc-900 dark:text-white text-xs sm:text-sm">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>100% Privacy-First Login & Security Transparency</span>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  Zero Sensitive Data Collected
                </span>
              </div>
              
              <p className="text-xs text-zinc-600 dark:text-slate-300 leading-relaxed">
                <strong>How our login works:</strong> Track Timer uses a strictly minimal, privacy-preserving authentication system requiring <strong>only a chosen Username and Password</strong>. We never ask for your email address, phone number, real name, or sensitive personal data. Passwords are cryptographically salted and hashed, and password recovery is handled via a private <strong>secret security question</strong> so you can safely reset your password anytime without ever needing to link an email address or expose your real identity.
              </p>

              <div className="flex items-start gap-2 pt-1 text-[11px] text-zinc-500 dark:text-slate-400 border-t border-zinc-200/60 dark:border-white/5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Creator transparency:</strong> I built Track Timer as a fun personal project to track my own time and vibe coded the whole thing with only prior knowledge of HTML & CSS. I am no security or backend expert, and there might be small bugs—which is why I purposefully kept the login system limited to just a username and password, along with a simple security question for forgot password recovery, ensuring zero sensitive personal data is ever collected, stored, or at risk.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* ============================================================== */}
      {/* 2. INTERACTIVE TEST-DRIVE / QUICK LAUNCHER                     */}
      {/* ============================================================== */}
      <section className="bg-white dark:bg-[#15171e] rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-white/10 shadow-md">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Zero-Friction Quick Start</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              Launch a Focus Session Right Now
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-slate-400">
              Type what you're working on, pick a category, and dive into productive flow state.
            </p>
          </div>

          <form onSubmit={handleQuickStart} className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="e.g. Build authentication flow, Study React docs..."
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#0c101a] text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full sm:w-72"
            />
            <select
              value={quickCat}
              onChange={(e) => setQuickCat(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#0c101a] text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center space-x-2 shrink-0 active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Timer</span>
            </button>
          </form>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. FEATURE HIGHLIGHTS & ARCHITECTURE                           */}
      {/* ============================================================== */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
            Built for Serious Focus & Continuous Improvement
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-slate-400">
            Everything you need to stay in flow, audit your time honestly, and hit your milestones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#15171e] border border-zinc-200 dark:border-white/10 shadow-sm space-y-3 hover:border-orange-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Stopwatch & 25m Pomodoro</h3>
            <p className="text-xs text-zinc-600 dark:text-slate-400 leading-relaxed">
              Toggle effortlessly between freeform stopwatch tracking and structured 25-minute Pomodoro intervals. Includes background continuation so you never lose a session.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#15171e] border border-zinc-200 dark:border-white/10 shadow-sm space-y-3 hover:border-orange-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Full Task Backlog & Categorization</h3>
            <p className="text-xs text-zinc-600 dark:text-slate-400 leading-relaxed">
              Add custom categories, assign statuses like <em>"urgent basis"</em> and <em>"will do it later"</em>, track cumulative time spent per task, and launch timers with one tap.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#15171e] border border-zinc-200 dark:border-white/10 shadow-sm space-y-3 hover:border-orange-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Weekly Activity Dashboard</h3>
            <p className="text-xs text-zinc-600 dark:text-slate-400 leading-relaxed">
              Review daily bar charts, weekly target progress, and top category distribution so you know exactly where your productive energy was invested.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#15171e] border border-zinc-200 dark:border-white/10 shadow-sm space-y-3 hover:border-orange-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Local-First & Offline Ready</h3>
            <p className="text-xs text-zinc-600 dark:text-slate-400 leading-relaxed">
              Zero mandatory sign-up to get started. All data is saved instantly to your browser's <code className="text-orange-500">localStorage</code> with optional PostgreSQL cloud sync.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#15171e] border border-zinc-200 dark:border-white/10 shadow-sm space-y-3 hover:border-orange-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">CSV Export & Complete Data Freedom</h3>
            <p className="text-xs text-zinc-600 dark:text-slate-400 leading-relaxed">
              Export your focus sessions anytime as a CSV spreadsheet. You own 100% of your focus history with zero lock-in and zero third-party ads.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#15171e] border border-zinc-200 dark:border-white/10 shadow-sm space-y-3 hover:border-orange-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Vibe Coding Craftsmanship</h3>
            <p className="text-xs text-zinc-600 dark:text-slate-400 leading-relaxed">
              Built for fun as a personal project using modern vibe coding workflows. As a creator starting with only knowledge of HTML and CSS, I built this entire app with AI assistance. The color scheme was inspired by <a href="https://ui.chaicode.com/" target="_blank" rel="noopener noreferrer" className="hover:underline text-orange-600 dark:text-orange-400 font-semibold">ChaiUI by ChaiCode</a>, and inspired by <a href="https://timearena.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:underline text-orange-600 dark:text-orange-400 font-semibold">TimeArena</a>.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. HOW IT WORKS (3 Simple Steps)                               */}
      {/* ============================================================== */}
      <section className="p-8 sm:p-10 rounded-3xl bg-zinc-50 dark:bg-[#10141f] border border-zinc-200 dark:border-white/10 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs uppercase font-bold tracking-wider text-orange-600 dark:text-orange-400">Simple 3-Step Flow</span>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">How Track Timer Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="flex flex-col items-center text-center space-y-2 p-4">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white font-extrabold flex items-center justify-center shadow-md shadow-orange-500/25">
              1
            </div>
            <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Pick or Create a Task</h4>
            <p className="text-xs text-zinc-500 dark:text-slate-400">
              Add tasks to your backlog or launch a quick session directly from the cockpit with custom tags.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-2 p-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white font-extrabold flex items-center justify-center shadow-md shadow-amber-500/25">
              2
            </div>
            <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Focus in Deep Work Intervals</h4>
            <p className="text-xs text-zinc-500 dark:text-slate-400">
              Run Stopwatch or 25m Pomodoro. Enjoy silence, distraction-free counts, and crisp visual feedback.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-2 p-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white font-extrabold flex items-center justify-center shadow-md shadow-emerald-500/25">
              3
            </div>
            <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Grow Your Streaks & Heatmap</h4>
            <p className="text-xs text-zinc-500 dark:text-slate-400">
              Log sessions, hit your daily targets, unlock milestones, and keep your consistency momentum going!
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. BOTTOM CALL TO ACTION                                       */}
      {/* ============================================================== */}
      <section className="text-center rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-xl shadow-orange-500/20 space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Ready to Conquer Procrastination & Level Up?
        </h2>
        <p className="text-orange-100 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          Join builders and students tracking their daily focus. No subscriptions, no ads, no trackers.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {isLoggedIn ? (
            <button
              onClick={onNavigateToToday}
              className="px-6 py-3 rounded-xl bg-white text-orange-600 font-bold text-sm shadow-md hover:bg-orange-50 transition-all hover:scale-105 active:scale-95 flex items-center space-x-2"
            >
              <span>Return to Today's Cockpit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={onOpenAuthModal}
                className="px-6 py-3 rounded-xl bg-white text-orange-600 font-bold text-sm shadow-md hover:bg-orange-50 transition-all hover:scale-105 active:scale-95 flex items-center space-x-2"
              >
                <span>Create Free Builder Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onNavigateToToday}
                className="px-5 py-3 rounded-xl bg-orange-700/60 hover:bg-orange-700/80 text-white font-semibold text-sm transition-all hover:scale-105 active:scale-95 border border-white/20"
              >
                <span>Open Today Dashboard</span>
              </button>
            </>
          )}
        </div>
      </section>

    </div>
  )
}
