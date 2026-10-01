import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabase'
import { uploadFileXHR, withRetry } from '../lib/upload'

const BUCKET = 'vault'
const MAX_UPLOAD_MB = Number(import.meta.env.VITE_MAX_UPLOAD_MB) || 50
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024
const CONCURRENCY = 3

// Folder segment inside a storage path, relative to the user's root.
// Storage paths look like: <userId>[/folder/sub]/<timestamp>_<name>
export function relativeDir(storagePath, userId) {
  const rel = storagePath.startsWith(userId + '/') ? storagePath.slice(userId.length + 1) : storagePath
  const parts = rel.split('/')
  parts.pop()
  return parts.join('/')
}

const isKeepFile = name => name === '.keep'

function friendlyError(e) {
  const msg = e?.message || 'Something went wrong.'
  if (/row-level security|RLS|policy/i.test(msg))
    return 'Storage permission denied. Check the storage RLS policies in the README setup (step 3).'
  if (/bucket/i.test(msg) && /not found/i.test(msg))
    return `Storage bucket "${BUCKET}" not found — create it in the Supabase dashboard (see README).`
  if (/duplicate|already exists/i.test(msg))
    return 'A file with that name already exists here.'
  return msg
}

export function useFiles(user, notify) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [uploads, setUploads] = useState([]) // queue items
  const controllers = useRef(new Map())
  const activeCount = useRef(0)
  const uploadsRef = useRef([])
  uploadsRef.current = uploads

  const fetchFiles = useCallback(async () => {
    if (!user) return
    setLoading(true); setLoadError('')
    try {
      const { data, error } = await withRetry(async () => {
        const r = await supabase.from('files').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        if (r.error) throw r.error
        return r
      })
      setFiles((data || []).filter(f => !isKeepFile(f.name)))
    } catch (e) {
      setLoadError(friendlyError(e))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  const updateUpload = useCallback((id, patch) => {
    setUploads(prev => prev.map(u => (u.id === id ? { ...u, ...patch } : u)))
  }, [])

  const runUpload = useCallback(async item => {
    activeCount.current += 1
    const controller = new AbortController()
    controllers.current.set(item.id, controller)
    try {
      if (item.file.size > MAX_UPLOAD_BYTES) {
        updateUpload(item.id, { status: 'error', error: `File too large — max ${MAX_UPLOAD_MB} MB (set VITE_MAX_UPLOAD_MB to change).` })
        return
      }
      updateUpload(item.id, { status: 'uploading', progress: 0, error: '' })
      const folder = item.folder ? item.folder.replace(/^\/+|\/+$/g, '') + '/' : ''
      const storagePath = `${user.id}/${folder}${Date.now()}_${item.file.name}`
      await withRetry(
        () => uploadFileXHR(item.file, storagePath, {
          signal: controller.signal,
          onProgress: p => updateUpload(item.id, { progress: p }),
        }),
        { attempts: 3, baseMs: 1000 }
      )
      updateUpload(item.id, { status: 'processing', progress: 100 })
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
      await withRetry(async () => {
        const r = await supabase.from('files').insert({
          user_id: user.id,
          name: item.file.name,
          size: item.file.size,
          type: item.file.type || 'application/octet-stream',
          storage_path: storagePath,
          public_url: urlData.publicUrl,
        })
        if (r.error) throw r.error
        return r
      })
      updateUpload(item.id, { status: 'done', progress: 100 })
      fetchFiles()
      // Fade completed items out of the queue after a moment
      setTimeout(() => setUploads(prev => prev.filter(u => u.id !== item.id)), 2500)
    } catch (e) {
      if (e?.name === 'AbortError' || /cancelled/i.test(e?.message || '')) {
        setUploads(prev => prev.filter(u => u.id !== item.id))
      } else {
        updateUpload(item.id, { status: 'error', error: friendlyError(e) })
      }
    } finally {
      controllers.current.delete(item.id)
      activeCount.current -= 1
      pump()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, updateUpload, fetchFiles])

  // Start queued uploads while under the concurrency cap.
  const pump = useCallback(() => {
    const queued = uploadsRef.current.filter(u => u.status === 'queued')
    const slots = CONCURRENCY - activeCount.current
    queued.slice(0, Math.max(slots, 0)).forEach(item => {
      updateUpload(item.id, { status: 'starting' })
      runUpload(item)
    })
  }, [runUpload, updateUpload])

  useEffect(() => { pump() }, [uploads, pump])

  const enqueueUploads = useCallback((fileList, folder = '') => {
    const items = [...fileList].map(f => ({
      id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())),
      file: f, name: f.name, size: f.size, type: f.type || 'application/octet-stream',
      folder, progress: 0, status: 'queued', error: '',
    }))
    if (items.length) setUploads(prev => [...prev, ...items])
  }, [])

  const retryUpload = useCallback(id => {
    updateUpload(id, { status: 'queued', error: '', progress: 0 })
  }, [updateUpload])

  const cancelUpload = useCallback(id => {
    const c = controllers.current.get(id)
    if (c) c.abort()
    else setUploads(prev => prev.filter(u => u.id !== id))
  }, [])

  const clearFinished = useCallback(() => {
    setUploads(prev => prev.filter(u => u.status !== 'done' && u.status !== 'error'))
  }, [])

  const deleteFile = useCallback(async file => {
    const prev = files
    setFiles(p => p.filter(f => f.id !== file.id)) // optimistic
    try {
      await withRetry(async () => {
        const r = await supabase.storage.from(BUCKET).remove([file.storage_path])
        if (r.error) throw r.error
      })
      await withRetry(async () => {
        const r = await supabase.from('files').delete().eq('id', file.id)
        if (r.error) throw r.error
      })
      notify?.(`Deleted "${file.name}"`, 'success')
    } catch (e) {
      setFiles(prev) // rollback
      notify?.(`Delete failed: ${friendlyError(e)}`, 'error')
    }
  }, [files, notify])

  const renameFile = useCallback(async (file, newName) => {
    const clean = newName.trim()
    if (!clean || clean === file.name) return
    try {
      const prefix = file.storage_path.slice(0, file.storage_path.lastIndexOf('/') + 1)
      const stamp = (file.storage_path.split('/').pop() || '').match(/^\d{10,}_/)?.[0] || ''
      const newPath = `${prefix}${stamp}${clean}`
      await withRetry(async () => {
        const r = await supabase.storage.from(BUCKET).move(file.storage_path, newPath)
        if (r.error) throw r.error
      })
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(newPath)
      const { error } = await supabase.from('files')
        .update({ name: clean, storage_path: newPath, public_url: urlData.publicUrl })
        .eq('id', file.id)
      if (error) throw error
      setFiles(p => p.map(f => (f.id === file.id ? { ...f, name: clean, storage_path: newPath, public_url: urlData.publicUrl } : f)))
      notify?.(`Renamed to "${clean}"`, 'success')
    } catch (e) {
      notify?.(`Rename failed: ${friendlyError(e)}`, 'error')
    }
  }, [user, notify])

  const createFolder = useCallback(async folderPath => {
    const clean = folderPath.trim().replace(/^\/+|\/+$/g, '')
    if (!clean) return
    try {
      const keep = new Blob([''], { type: 'text/plain' })
      const storagePath = `${user.id}/${clean}/.keep`
      await withRetry(() => uploadFileXHR(keep, storagePath, { upsert: true }))
      await withRetry(async () => {
        const r = await supabase.from('files').insert({
          user_id: user.id, name: '.keep', size: 0, type: 'text/plain',
          storage_path: storagePath, public_url: '',
        })
        if (r.error) throw r.error
      })
      notify?.(`Folder "${clean}" created`, 'success')
    } catch (e) {
      notify?.(`Couldn't create folder: ${friendlyError(e)}`, 'error')
    }
  }, [user, notify])

  const downloadFile = useCallback(async file => {
    try {
      notify?.(`Preparing "${file.name}"…`, 'info')
      const { data, error } = await withRetry(async () => {
        const r = await supabase.storage.from(BUCKET).download(file.storage_path)
        if (r.error) throw r.error
        return r
      })
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url; a.download = file.name
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (e) {
      notify?.(`Download failed: ${friendlyError(e)}`, 'error')
    }
  }, [notify])

  return {
    files, loading, loadError, fetchFiles,
    uploads, enqueueUploads, retryUpload, cancelUpload, clearFinished,
    deleteFile, renameFile, createFolder, downloadFile,
    maxUploadMB: MAX_UPLOAD_MB,
  }
}
