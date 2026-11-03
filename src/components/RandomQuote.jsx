import React, { useState, useEffect } from 'react'
import { Quote, RefreshCw, Sparkles } from 'lucide-react'

const FALLBACK_QUOTES = [
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "Simplicity boils down to two steps: Identify the essential. Eliminate the rest.", author: "Leo Babauta" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Deep work is the ability to focus without distraction on a cognitively demanding task.", author: "Cal Newport" }
]

export default function RandomQuote() {
  const [quote, setQuote] = useState(() => {
    return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]
  })
  const [loading, setLoading] = useState(false)

  const fetchQuote = async () => {
    setLoading(true)
    try {
      // FreeAPI.app public quotes random endpoint
      const res = await fetch('https://api.freeapi.app/api/v1/public/quotes/quote/random', {
        headers: { 'Accept': 'application/json' }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      const item = data?.data
      if (item && (item.content || item.quote)) {
        setQuote({
          text: item.content || item.quote,
          author: item.author || 'Unknown'
        })
      } else {
        // Fallback to random local quote
        const randomFallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]
        setQuote(randomFallback)
      }
    } catch (err) {
      // Pick a random fallback from curated pool
      const randomFallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]
      setQuote(randomFallback)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuote()
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 sm:mt-12 md:mt-12 mb-4 sm:mb-8 md:mb-8 lg:mt-12 lg:mb-8 px-2">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-transparent border border-zinc-200 dark:border-white/10 p-4 sm:p-5 shadow-sm transition-all group">
        
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          
          <div className="flex items-start space-x-3 min-w-0">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5">
              <Quote className="w-4 h-4 fill-orange-500/20" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2 text-[10px] uppercase font-bold tracking-wider text-orange-600 dark:text-orange-400 mb-0.5">
                <Sparkles className="w-3 h-3" />
                <span>Daily Inspiration</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-800 dark:text-slate-200 font-medium italic leading-relaxed">
                "{quote.text}"
              </p>
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-slate-400 block mt-1">
                — {quote.author}
              </span>
            </div>
          </div>

          {/* New Quote Button */}
          <button
            onClick={fetchQuote}
            disabled={loading}
            className="self-end sm:self-center flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-[11px] font-semibold text-zinc-700 dark:text-slate-300 transition-all shadow-sm active:scale-95 disabled:opacity-50 flex-shrink-0"
            title="Fetch a new random quote from FreeAPI"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-500 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Fetching...' : 'New Quote'}</span>
          </button>

        </div>

      </div>
    </div>
  )
}
