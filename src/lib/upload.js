import { supabase } from '../supabase'

const BUCKET = 'vault'

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/')
}

async function storageHeaders(extra = {}) {
  const { data } = await supabase.auth.getSession()
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  // Prefer the user's JWT so storage RLS policies (auth.uid()) apply;
  // fall back to the anon key when there is no session.
  const token = data.session?.access_token || anonKey
  return { apikey: anonKey, Authorization: `Bearer ${token}`, ...extra }
}

/**
 * Upload a File/Blob to Supabase Storage with real progress events.
 * supabase-js v2 doesn't expose upload progress, so we PUT to the
 * Storage REST endpoint directly with XMLHttpRequest.
 */
export function uploadFileXHR(file, storagePath, { onProgress, signal, upsert = false } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false
    const fail = e => { if (!settled) { settled = true; reject(e) } }

    const start = async () => {
      let headers
      try {
        headers = await storageHeaders({
          'x-upsert': upsert ? 'true' : 'false',
          'Content-Type': file.type || 'application/octet-stream',
        })
      } catch (e) { fail(e); return }

      const base = import.meta.env.VITE_SUPABASE_URL
      const xhr = new XMLHttpRequest()

      if (signal) {
        if (signal.aborted) { fail(new DOMException('Upload cancelled', 'AbortError')); return }
        signal.addEventListener('abort', () => xhr.abort(), { once: true })
      }

      xhr.open('PUT', `${base}/storage/v1/object/${BUCKET}/${encodePath(storagePath)}`)
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v))
      xhr.upload.onprogress = e => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          if (onProgress) onProgress(100)
          settled = true
          try { resolve(JSON.parse(xhr.responseText || '{}')) } catch { resolve({}) }
        } else {
          fail(new Error(`Upload failed (HTTP ${xhr.status}): ${(xhr.responseText || '').slice(0, 160)}`))
        }
      }
      xhr.onerror = () => fail(new Error('Network error during upload — check your connection and retry.'))
      xhr.onabort = () => fail(new DOMException('Upload cancelled', 'AbortError'))
      try { xhr.send(file) } catch (e) { fail(e) }
    }
    start()
  })
}

/** Retry an async fn with exponential backoff. Aborts are never retried. */
export async function withRetry(fn, { attempts = 3, baseMs = 800 } = {}) {
  let last
  for (let i = 0; i < attempts; i++) {
    try { return await fn() } catch (e) {
      last = e
      if (e && (e.name === 'AbortError' || /cancelled/i.test(e.message || ''))) throw e
      if (i < attempts - 1) await new Promise(r => setTimeout(r, baseMs * 2 ** i))
    }
  }
  throw last
}

/** Short-lived signed URL for previews/thumbnails (works on public and private buckets). */
export async function signedUrl(storagePath, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, expiresIn)
  if (error) throw error
  return data.signedUrl
}
