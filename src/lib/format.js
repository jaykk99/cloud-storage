export function formatBytes(bytes, d = 2) {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(d < 0 ? 0 : d)) + ' ' + sizes[i]
}

export function getFileCategory(type = '') {
  if (type.startsWith('image/')) return 'images'
  if (type.startsWith('audio/') || type.startsWith('video/')) return 'media'
  if (
    type.includes('pdf') || type.includes('word') || type.includes('text') ||
    type.includes('document') || type.includes('sheet') || type.includes('presentation') ||
    type.includes('json') || type.includes('csv') || type.includes('markdown')
  ) return 'documents'
  return 'others'
}

export function formatDate(iso) {
  if (!iso) return 'Just now'
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (sameDay) return 'Today ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' })
}

// Strip the "<timestamp>_" prefix the uploader adds to storage paths so the
// original file name shows cleanly.
export function displayName(name = '') {
  return name.replace(/^\d{10,}_/, '')
}
