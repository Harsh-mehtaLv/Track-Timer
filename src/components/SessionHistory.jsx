import React, { useState } from 'react'
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Calendar,
  Clock,
  Sparkles
} from 'lucide-react'
import { formatDuration, formatTimeStr, formatDateStr } from '../utils/formatters'
import { DEFAULT_CATEGORIES, getCategoryById } from '../utils/categories'

export default function SessionHistory({ sessions, categories = DEFAULT_CATEGORIES, onDeleteSession, onClearAll }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'longest'

  // Filter & Search logic
  const filtered = sessions.filter(session => {
    const matchesSearch = session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          session.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = selectedCategory === 'all' || session.category === selectedCategory
    return matchesSearch && matchesCat
  }).sort((a, b) => {
    if (sortBy === 'longest') {
      return (b.durationSeconds || 0) - (a.durationSeconds || 0)
    }
    return new Date(b.startTime) - new Date(a.startTime)
  })

  // Export to CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) return
    const headers = ['Title', 'Category', 'Start Time', 'End Time', 'Duration (seconds)', 'Duration (formatted)', 'Notes']
    const rows = filtered.map(s => [
      `"${(s.title || '').replace(/"/g, '""')}"`,
      `"${s.category || ''}"`,
      `"${s.startTime || ''}"`,
      `"${s.endTime || ''}"`,
      s.durationSeconds || 0,
      `"${formatDuration(s.durationSeconds)}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `track-timer-sessions-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalFilteredSecs = filtered.reduce((acc, s) => acc + (s.durationSeconds || 0), 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
            <History className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            <span>Session Logs & History</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1">
            Total {filtered.length} sessions logged • Cumulative focus time: <span className="text-orange-600 dark:text-orange-400 font-semibold">{formatDuration(totalFilteredSecs)}</span>
          </p>
        </div>

        {/* Export & Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#141926] dark:hover:bg-[#1a2234] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 hover:text-zinc-900 dark:text-slate-200 dark:hover:text-white disabled:opacity-40 transition-all shadow-sm"
            title="Download CSV spreadsheet"
          >
            <Download className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Export CSV</span>
          </button>

          {sessions.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all logged sessions?')) {
                  onClearAll()
                }
              }}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/20 text-xs transition-colors"
              title="Clear all sessions"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-3 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks, keywords, notes..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Category select */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <div className="flex items-center space-x-1.5 text-zinc-400 dark:text-slate-500">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 sm:flex-initial bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-slate-300 rounded-xl px-2.5 pr-8 sm:px-3 sm:pr-8 py-2 text-xs outline-none focus:border-orange-500"
          >
            <option value="all">All Categories</option>
            {(categories || DEFAULT_CATEGORIES).map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 sm:flex-initial bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-slate-300 rounded-xl px-2.5 pr-8 sm:px-3 sm:pr-8 py-2 text-xs outline-none focus:border-orange-500"
          >
            <option value="newest">Newest First</option>
            <option value="longest">Longest Duration</option>
          </select>
        </div>
      </div>

      {/* Session List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl p-12 text-center shadow-sm">
          <History className="w-12 h-12 text-zinc-400 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-zinc-800 dark:text-slate-300">No matching sessions found</h4>
          <p className="text-xs text-zinc-500 dark:text-slate-500 max-w-sm mx-auto mt-1">
            Try adjusting your search terms or category filters.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl divide-y divide-zinc-100 dark:divide-white/5 overflow-hidden shadow-sm">
          {filtered.map(session => {
            const category = getCategoryById(session.category)
            return (
              <div 
                key={session.id}
                className="p-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors group"
              >
                {/* Left */}
                <div className="flex items-start sm:items-center space-x-3">
                  <span 
                    className="w-3 h-3 rounded-full mt-1 sm:mt-0 flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  ></span>
                  
                  <div className="min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
                      <span className="font-semibold text-sm text-zinc-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors leading-snug">
                        {session.title || 'Untitled Session'}
                      </span>
                      <div className="flex items-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${category.bgClass} w-fit`}>
                          {category.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-zinc-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-zinc-400 dark:text-slate-500" />
                        <span>{formatDateStr(session.startTime)}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1 font-mono">
                        <Clock className="w-3 h-3 text-zinc-400 dark:text-slate-500" />
                        <span>{formatTimeStr(session.startTime)} – {formatTimeStr(session.endTime)}</span>
                      </span>
                    </div>

                    {session.notes && (
                      <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1.5 italic">
                        "{session.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center justify-between sm:justify-end space-x-4 pl-6 sm:pl-0">
                  <span className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                    {formatDuration(session.durationSeconds)}
                  </span>

                  <button
                    onClick={() => onDeleteSession(session.id)}
                    className="p-1.5 rounded-lg text-zinc-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
