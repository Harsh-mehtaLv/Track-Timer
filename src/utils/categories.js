export const DEFAULT_CATEGORIES = [
  { id: 'frontend', name: 'Frontend Dev', color: '#f97316', bgClass: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  { id: 'backend', name: 'Backend & Supabase', color: '#10b981', bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { id: 'dsa', name: 'DSA & Algorithms', color: '#8b5cf6', bgClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { id: 'cohort', name: 'Project Assignment', color: '#ec4899', bgClass: 'bg-pink-500/10 text-pink-400 border-pink-500/30' },
  { id: 'system-design', name: 'System Design', color: '#06b6d4', bgClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  { id: 'reading', name: 'Research & Reading', color: '#eab308', bgClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
]

export const PRESET_CATEGORY_COLORS = [
  { hex: '#f97316', name: 'Orange' },
  { hex: '#ef4444', name: 'Red' },
  { hex: '#ec4899', name: 'Pink' },
  { hex: '#8b5cf6', name: 'Purple' },
  { hex: '#6366f1', name: 'Indigo' },
  { hex: '#3b82f6', name: 'Blue' },
  { hex: '#06b6d4', name: 'Cyan' },
  { hex: '#10b981', name: 'Emerald' },
  { hex: '#84cc16', name: 'Lime' },
  { hex: '#eab308', name: 'Yellow' },
  { hex: '#14b8a6', name: 'Teal' },
  { hex: '#64748b', name: 'Slate' },
]

export function getCustomCategories() {
  try {
    const raw = localStorage.getItem('tracktime_custom_categories')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (e) {
    console.error('Failed to parse custom categories:', e)
  }
  return []
}

export function saveCustomCategories(categories) {
  try {
    localStorage.setItem('tracktime_custom_categories', JSON.stringify(categories))
  } catch (e) {
    console.error('Failed to save custom categories:', e)
  }
}

export function getAllCategories(customCategories = null) {
  const custom = customCategories !== null ? customCategories : getCustomCategories()
  return [...DEFAULT_CATEGORIES, ...custom]
}

export function getCategoryById(id, customCategories = null) {
  const all = getAllCategories(customCategories)
  const found = all.find(c => c.id === id)
  if (found) return found

  return {
    id: id || 'other',
    name: (id && id !== 'other') 
      ? (id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ')) 
      : 'General',
    color: '#94a3b8',
    bgClass: 'bg-slate-500/10 text-slate-400 border-slate-500/30'
  }
}
