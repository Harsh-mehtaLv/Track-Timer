/**
 * Format seconds into a friendly readable string, e.g. "2h 30m" or "45m"
 */
export function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0m'
  
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  if (minutes > 0) {
    return `${minutes}m`
  }
  return `${seconds}s`
}

/**
 * Format seconds into digital timer display: "HH:MM:SS" or "MM:SS"
 */
export function formatTimerDisplay(totalSeconds) {
  if (totalSeconds < 0) totalSeconds = 0
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n) => String(n).padStart(2, '0')

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(minutes)}:${pad(seconds)}`
}

/**
 * Format a Date or timestamp string into 12-hour time: "3:45 PM"
 */
export function formatTimeStr(isoOrDate) {
  if (!isoOrDate) return ''
  const d = new Date(isoOrDate)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Format a date string into readable date: "Oct 28, 2026"
 */
export function formatDateStr(isoOrDate) {
  if (!isoOrDate) return ''
  const d = new Date(isoOrDate)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Format a Date or timestamp string into local YYYY-MM-DD
 */
export function getLocalDateString(isoOrDate = new Date()) {
  if (!isoOrDate) return ''
  const d = new Date(isoOrDate)
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get start of week (Monday) and end of week (Sunday) for a given date
 */
export function getWeekRange(date = new Date()) {
  const current = new Date(date)
  const day = current.getDay()
  // Adjust so Monday is index 0, Sunday is index 6
  const diff = current.getDate() - day + (day === 0 ? -6 : 1)
  
  const monday = new Date(current.setDate(diff))
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { monday, sunday }
}

/**
 * Generate 7 days array for the week containing referenceDate
 */
export function getWeekDays(referenceDate = new Date()) {
  const { monday } = getWeekRange(referenceDate)
  const days = []
  const todayStr = getLocalDateString(new Date())

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateString = getLocalDateString(d)
    days.push({
      date: d,
      dateString,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      isToday: dateString === todayStr
    })
  }
  return days
}
