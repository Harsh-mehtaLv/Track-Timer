import React, { useState } from 'react'
import { X, Calendar, Clock, Tag, Check, AlertCircle } from 'lucide-react'
import { DEFAULT_CATEGORIES } from '../utils/categories'
import { getLocalDateString } from '../utils/formatters'

export default function ManualEntryModal({ isOpen, categories = DEFAULT_CATEGORIES, onClose, onSave }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('frontend')
  const [date, setDate] = useState(() => getLocalDateString())
  const [durationHours, setDurationHours] = useState('1')
  const [durationMinutes, setDurationMinutes] = useState('30')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const hrs = parseInt(durationHours, 10) || 0
    const mins = parseInt(durationMinutes, 10) || 0
    const totalSecs = hrs * 3600 + mins * 60

    if (totalSecs <= 0) {
      setError('Please specify a duration greater than 0 minutes.')
      return
    }

    // Compute start and end times
    const startTime = new Date(`${date}T10:00:00`)
    const endTime = new Date(startTime.getTime() + totalSecs * 1000)

    onSave({
      title: title.trim() || 'Manual Session',
      category,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationSeconds: totalSecs,
      notes: notes.trim(),
      completed: true
    })

    // Reset and close
    setTitle('')
    setNotes('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span>Log Time Manually</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1">
            Track study or coding time that occurred outside the live timer.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1.5">
              Task or Topic Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Next.js Routing, Postgres Indexing..."
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 focus:border-orange-500 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 outline-none transition-all shadow-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(categories || DEFAULT_CATEGORIES).map(cat => {
                const isSelected = category === cat.id
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                      isSelected
                        ? `${cat.bgClass || ''} ring-1 ring-orange-500/30`
                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 border-zinc-200 dark:border-white/5 text-zinc-600 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                    style={isSelected ? {
                      backgroundColor: `${cat.color}18`,
                      borderColor: `${cat.color}60`,
                      color: cat.color
                    } : undefined}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}></span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date & Duration Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1.5">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-500 transition-colors shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1.5">
                Duration (Hours / Mins)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="w-1/2 px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-500 text-center font-mono shadow-sm"
                  placeholder="0"
                />
                <span className="text-xs text-zinc-500 dark:text-slate-400">h</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-1/2 px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-500 text-center font-mono shadow-sm"
                  placeholder="30"
                />
                <span className="text-xs text-zinc-500 dark:text-slate-400">m</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you build or learn during this session?"
              className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 outline-none focus:border-orange-500 transition-colors shadow-sm"
            ></textarea>
          </div>

          {/* Submit */}
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-slate-300 border border-zinc-200 dark:border-white/10 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Log Session</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
