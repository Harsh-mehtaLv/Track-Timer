import React, { useState, useEffect } from 'react'
import { 
  ShieldCheck, 
  FileText, 
  ArrowLeft, 
  Lock, 
  Database, 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  Cpu, 
  EyeOff, 
  HelpCircle,
  Download,
  AlertCircle,
  VolumeX,
  Layers,
  Smartphone
} from 'lucide-react'

export default function LegalView({ initialTab = 'privacy', onNavigateBack }) {
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Navigation Bar - Stacked on Mobile (Line 1: Back Button, Line 2: Tab Group), Side-by-side on sm+ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <button
          onClick={onNavigateBack}
          className="w-fit inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-700 dark:text-slate-300 bg-white dark:bg-[#15171e] border border-zinc-200 dark:border-white/10 hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Tab Selector - Full width with 50/50 split on mobile, auto-width on desktop */}
        <div className="w-full sm:w-auto flex p-1 bg-zinc-100 dark:bg-[#15171e] rounded-xl border border-zinc-200 dark:border-white/10 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'privacy'
                ? 'bg-white dark:bg-[#202430] text-orange-600 dark:text-orange-400 shadow-sm font-semibold'
                : 'text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Policy</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'terms'
                ? 'bg-white dark:bg-[#202430] text-orange-600 dark:text-orange-400 shadow-sm font-semibold'
                : 'text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms of Use</span>
          </button>
        </div>
      </div>

      {/* Banner / Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 mb-8 backdrop-blur-sm">
        <div className="flex items-start sm:items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/30">
            {activeTab === 'privacy' ? <ShieldCheck className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-slate-300 mt-0.5">
              {activeTab === 'privacy' 
                ? 'Transparency-first: how Track Timer protects your privacy and data' 
                : 'Simple, sensible guidelines for using Track Timer'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-orange-700 dark:text-orange-300/90 font-medium">
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built with HTML, CSS & Vibe Coding</span>
          </span>
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <Lock className="w-3.5 h-3.5" />
            <span>Pure Username & Password (Zero Sensitive Data)</span>
          </span>
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <Heart className="w-3.5 h-3.5" />
            <span>Color scheme inspired by ChaiUI</span>
          </span>
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
            <VolumeX className="w-3.5 h-3.5" />
            <span>Silent focus by default</span>
          </span>
        </div>
      </div>

      {/* Main Content Sections */}
      {activeTab === 'privacy' ? (
        /* PRIVACY POLICY */
        <div className="space-y-6 text-zinc-700 dark:text-slate-300 text-sm leading-relaxed">
          {/* Section: Built for Fun with Vibe Coding */}
          <div className="bg-white dark:bg-[#15171e] p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5 text-zinc-900 dark:text-white font-bold text-base">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2>Built for Fun Using Vibe Coding (Honest Creator Disclosure)</h2>
            </div>
            <p>
              <strong>Track Timer</strong> is an independent passion project created for fun using modern <em>vibe coding</em> workflows (human-guided AI pair programming). It was built to solve real-world productivity challenges: providing a frictionless, distraction-free interval timer and focus cockpit without annoying paywalls, bloated account sign-ups, or invasive ad networks.
            </p>
            <div className="p-4 sm:p-5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-xs sm:text-sm text-zinc-800 dark:text-slate-200 space-y-3">
              <div className="flex items-center space-x-2 font-bold text-orange-600 dark:text-orange-400">
                <AlertCircle className="w-4 h-4" />
                <span>Creator Note: The Story Behind Track Timer</span>
              </div>
              <p className="leading-relaxed">
                I am currently learning coding, and I built this fun project for myself to track my own learning process and daily study hours. When I came across the <a href="https://timearena.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 font-semibold underline">TimeArena</a> project built by a student of <strong>ChaiCode</strong>, I thought to myself: <em>"Why not try vibe-coding—something I have never tried before—and try building my own personal time tracker to track my coding journey?"</em> And that is how <strong>Track Timer</strong> came to be!
              </p>
              <p className="leading-relaxed">
                <strong>HTML & CSS background disclosure:</strong> When I started this, my coding knowledge was limited strictly to <strong>HTML and CSS</strong>. I am no software engineer, backend specialist, or cybersecurity expert. I vibe-coded this whole application through human-guided AI pair programming. Because I built this as a learner exploring vibe-coding, there might be occasional bugs, UI quirks, or rough edges in the application.
              </p>
              <p className="leading-relaxed">
                <strong>Why our login requires ONLY a username, password, and security question:</strong> Since I do not currently have deep backend or security knowledge beyond HTML and CSS, I intentionally designed the login system to never collect, store, or process anyone's sensitive personal data—zero emails, zero phone numbers, zero social logins, and zero payment info. To ensure you can always recover your account safely without an email address, we use a simple secret <strong>security question & answer</strong> stored with salted cryptographic hashing. By keeping sensitive personal information completely out of the system, your real-world identity is 100% safe.
              </p>
              <p className="leading-relaxed">
                Furthermore, the warm orange, amber, and slate color scheme and aesthetic was inspired by <a href="https://ui.chaicode.com/" target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 font-semibold underline">ChaiUI by ChaiCode</a>.
              </p>
            </div>
          </div>

          {/* Section: What Information We Collect */}
          <div className="bg-white dark:bg-[#15171e] p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5 text-zinc-900 dark:text-white font-bold text-base">
              <Database className="w-5 h-5 text-orange-500" />
              <h2>What Information We Collect & Store</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1b1e28] border border-zinc-200 dark:border-white/5 space-y-2">
                <div className="flex items-center space-x-2 font-semibold text-zinc-900 dark:text-white text-xs sm:text-sm">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  <span>Pure Username & Password Authentication</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-slate-400 leading-relaxed">
                  When you create an account, you only provide a chosen <strong>username</strong> and <strong>password</strong>. No personal emails, real names, or phone numbers are ever asked for or stored. We deliberately chose this setup so you can use the app with complete peace of mind, knowing your personal contact info cannot be exposed. Passwords are cryptographically salted and hashed before persistence.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1b1e28] border border-zinc-200 dark:border-white/5 space-y-2">
                <div className="flex items-center space-x-2 font-semibold text-zinc-900 dark:text-white text-xs sm:text-sm">
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                  <span>Cloud-Synced Password Recovery</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-slate-400">
                  During signup or later in your profile, you can configure a simple security question and secret answer. The answer is hashed securely and synced to the cloud database solely so you can safely reset your password if ever forgotten.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1b1e28] border border-zinc-200 dark:border-white/5 space-y-2">
                <div className="flex items-center space-x-2 font-semibold text-zinc-900 dark:text-white text-xs sm:text-sm">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span>Tasks, Custom Categories & Focus Logs</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-slate-400">
                  Your custom categories, task backlog items (with statuses like <em>Urgent Basis</em>, <em>Will do it later</em>, <em>In Progress</em>, and <em>Completed</em>), and focus session history are stored locally in browser storage and seamlessly synchronized with Supabase PostgreSQL across your devices.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1b1e28] border border-zinc-200 dark:border-white/5 space-y-2">
                <div className="flex items-center space-x-2 font-semibold text-zinc-900 dark:text-white text-xs sm:text-sm">
                  <EyeOff className="w-4 h-4 text-red-500" />
                  <span>What We NEVER Collect</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-slate-400">
                  We do NOT collect credit cards, banking information, precise geolocation, browsing history across other tabs, or biometric data. Zero advertising pixels (no Meta Pixel, no Google Ads, no tracking cookies, no spyware).
                </p>
              </div>
            </div>
          </div>

          {/* Section: Cross-Device Synchronization */}
          <div className="bg-white dark:bg-[#15171e] p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center space-x-2.5 text-zinc-900 dark:text-white font-bold text-base">
              <Smartphone className="w-5 h-5 text-emerald-500" />
              <h2>Cross-Device Cloud Synchronization</h2>
            </div>
            <p>
              Track Timer supports live synchronization through our hosted Supabase PostgreSQL database:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm pt-1">
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span><strong>Multi-Device Login:</strong> Create your username on mobile and log in instantly on your laptop or tablet with automatic session restore.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span><strong>Offline-First Resilience:</strong> Even if offline or experiencing temporary connectivity drops, your tasks and sessions continue to function smoothly in local browser storage and sync when you reconnect.</span>
              </li>
            </ul>
          </div>

          {/* Section: Technologies & Libraries Used */}
          <div className="bg-white dark:bg-[#15171e] p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center space-x-2.5 text-zinc-900 dark:text-white font-bold text-base">
              <Cpu className="w-5 h-5 text-indigo-500" />
              <h2>Technology Stack & Open Source Libraries</h2>
            </div>
            <p>
              Track Timer is crafted with modern, lightweight web technologies to guarantee blazing fast performance and a low memory footprint:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm pt-1">
              <li className="flex items-start space-x-2">
                <span className="text-orange-500 font-bold">•</span>
                <span><strong>React 18 & Vite:</strong> For lightning-fast rendering, interactive UI state, and responsive hot-module loading.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-orange-500 font-bold">•</span>
                <span><strong>Tailwind CSS & ChaiUI Palette:</strong> Responsive layouts styled with Tailwind CSS, with warm orange and slate color schemes inspired by <a href="https://ui.chaicode.com/" target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 font-medium hover:underline">ChaiUI by ChaiCode</a>.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-orange-500 font-bold">•</span>
                <span><strong>Lucide React:</strong> Lightweight SVG vector icons.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-orange-500 font-bold">•</span>
                <span><strong>Supabase (PostgreSQL):</strong> Provides secure cloud database syncing so your focus stats, custom categories, tasks, and recovery settings persist across devices.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-orange-500 font-bold">•</span>
                <span><strong>Silent Focus Architecture:</strong> 100% distraction-free timer with zero audio playback permissions, unwanted sound alarms, or noisy background alerts.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-orange-500 font-bold">•</span>
                <span><strong>FreeAPI Quotes:</strong> Public motivational quote engine to inspire daily focus sessions.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-orange-500 font-bold">•</span>
                <span><strong>Vercel Web Analytics:</strong> Privacy-friendly, cookieless traffic analytics to measure visits, top countries, and devices without tracking personal data or using invasive ad cookies.</span>
              </li>
            </ul>
          </div>

          {/* Section: Data Ownership & Export */}
          <div className="bg-white dark:bg-[#15171e] p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center space-x-2.5 text-zinc-900 dark:text-white font-bold text-base">
              <Download className="w-5 h-5 text-emerald-500" />
              <h2>Your Data Ownership & Right to Delete</h2>
            </div>
            <p>
              You own your productivity data completely. You can:
            </p>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>Export as CSV:</strong> Download your entire session history at any time directly from the Session History tab.</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>Instant Local Wipe:</strong> Clear all local storage records or remove individual sessions directly within the app UI.</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>Account Reset:</strong> Reset or delete your profile credentials whenever you choose.</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TERMS OF USE */
        <div className="space-y-6 text-zinc-700 dark:text-slate-300 text-sm leading-relaxed">
          {/* Section: Purpose & Agreement */}
          <div className="bg-white dark:bg-[#15171e] p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center space-x-2.5 text-zinc-900 dark:text-white font-bold text-base">
              <FileText className="w-5 h-5 text-orange-500" />
              <h2>Purpose & Acceptance of Terms</h2>
            </div>
            <p>
              By accessing or using <strong>Track Timer</strong>, you agree to these Terms of Use. Track Timer is designed as a personal productivity companion, interval timer, and task manager to help you overcome procrastination, study effectively, and complete software engineering, creative, or academic goals.
            </p>
            <p className="text-xs text-zinc-500 dark:text-slate-400">
              If you do not agree with these terms, you are free to discontinue using the application or simply use your browser's native timer utilities.
            </p>
          </div>

          {/* Section: Vibe Coding Notice */}
          <div className="bg-white dark:bg-[#15171e] p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center space-x-2.5 text-zinc-900 dark:text-white font-bold text-base">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2>Experimental & Vibe Coding Disclosure (HTML/CSS Foundation)</h2>
            </div>
            <p>
              Track Timer is actively developed as a fun, fast-evolving tool created with <em>vibe coding</em> workflows (human-guided AI pair programming).
            </p>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-slate-300 leading-relaxed">
              <strong>Creator honesty note:</strong> I built this entire application as a fun project with only prior knowledge of <strong>HTML and CSS</strong>. I am not an advanced software engineer or cybersecurity expert, and there might be occasional bugs or unexpected behaviors. This is also why the authentication system was intentionally designed to use only a simple username and password: to avoid collecting or handling anyone's sensitive personal data since I do not possess technical knowledge beyond HTML and CSS right now.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm pt-1">
              <li className="flex items-start space-x-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>The app is provided on an <strong>"as is" and "as available" basis</strong> without commercial warranties of any kind.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>While we make every effort to maintain stability and multi-device persistence, we recommend exporting your historical records as CSV periodically if you rely on long-term time auditing.</span>
              </li>
            </ul>
          </div>

          {/* Section: Acceptable Use */}
          <div className="bg-white dark:bg-[#15171e] p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center space-x-2.5 text-zinc-900 dark:text-white font-bold text-base">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h2>Acceptable Use Guidelines</h2>
            </div>
            <p>
              You are welcome to use Track Timer for all personal, educational, research, and professional focus tracking. We only ask that you:
            </p>
            <div className="space-y-2.5 text-xs sm:text-sm pt-1">
              <div className="flex items-start space-x-2">
                <span className="text-emerald-500 font-semibold">1.</span>
                <span>Do not attempt automated scraping, DDoS attacks, or spamming against the cloud database endpoints.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-emerald-500 font-semibold">2.</span>
                <span>Do not attempt to compromise or access telemetry or accounts belonging to other users.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-emerald-500 font-semibold">3.</span>
                <span>Maintain custody of your chosen username and secret security recovery questions.</span>
              </div>
            </div>
          </div>

          {/* Section: Limitation of Liability */}
          <div className="bg-white dark:bg-[#15171e] p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center space-x-2.5 text-zinc-900 dark:text-white font-bold text-base">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h2>Limitation of Liability</h2>
            </div>
            <p className="text-xs sm:text-sm">
              In no event shall the authors or contributors be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use Track Timer (such as cleared browser storage or interrupted sessions). Track Timer is a freely available utility built with passion and love for coding.
            </p>
          </div>

          {/* Section: Acknowledgments */}
          <div className="bg-white dark:bg-[#15171e] p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center space-x-2.5 text-zinc-900 dark:text-white font-bold text-base">
              <Heart className="w-5 h-5 text-red-500" />
              <h2>Inspiration & Community Credits</h2>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed">
              Track Timer is inspired by{' '}
              <a 
                href="https://timearena.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-orange-600 dark:text-orange-400 font-semibold hover:underline"
              >
                TimeArena
              </a>{' '}
              and was built by a student at <strong>ChaiCode</strong>. The visual aesthetic and warm color scheme were inspired by{' '}
              <a 
                href="https://ui.chaicode.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-orange-600 dark:text-orange-400 font-semibold hover:underline"
              >
                ChaiUI by ChaiCode
              </a>. Special thanks to the open-source community, React ecosystem, and vibe coding enthusiasts who make modern web craftsmanship accessible and fun!
            </p>
          </div>
        </div>
      )}

      {/* Bottom Back Button */}
      <div className="mt-8 text-center">
        <button
          onClick={onNavigateBack}
          className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Focus Dashboard</span>
        </button>
      </div>
    </div>
  )
}