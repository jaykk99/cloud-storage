import React, { useEffect, useState } from 'react'
import { Download, X, FileWarning } from 'lucide-react'
import { formatBytes, formatDate, getFileCategory, displayName } from '../lib/format'
import { signedUrl } from '../lib/upload'
import { Modal, Spinner, FileIconComp } from './ui'

const TEXT_PREVIEW_LIMIT = 200 * 1024 // 200 KB

export default function PreviewModal({ file, onClose, onDownload }) {
  const [url, setUrl] = useState(null)
  const [text, setText] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cat = getFileCategory(file.type)
  const isText = file.type.startsWith('text/') || /json|javascript|xml|csv|markdown/.test(file.type)

  useEffect(() => {
    let live = true
    setLoading(true); setError(''); setUrl(null); setText(null)
    signedUrl(file.storage_path, 3600).then(async u => {
      if (!live) return
      if (isText && (file.size || 0) <= TEXT_PREVIEW_LIMIT) {
        try {
          const r = await fetch(u)
          const t = await r.text()
          if (live) setText(t.slice(0, 20000))
        } catch { if (live) setError('Could not load text preview.') }
      } else {
        if (live) setUrl(u)
      }
      if (live) setLoading(false)
    }).catch(() => { if (live) { setError('Could not generate a preview link.'); setLoading(false) } })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id])

  return (
    <Modal onClose={onClose} labelledBy={`Preview ${file.name}`}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="min-w-0">
            <h3 className="text-white font-bold truncate" title={file.name}>{displayName(file.name)}</h3>
            <p className="text-xs text-slate-500">{formatBytes(file.size || 0)} &bull; {formatDate(file.created_at)}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-3">
            <button onClick={() => onDownload(file)} title="Download"
              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition"><Download size={18} /></button>
            <button onClick={onClose} title="Close" aria-label="Close preview"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"><X size={18} /></button>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-auto bg-slate-950 flex items-center justify-center min-h-[240px]">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-16"><Spinner /> Loading preview…</div>
          ) : error ? (
            <div className="text-center py-16 px-6">
              <FileWarning size={32} className="text-amber-400 mx-auto mb-3" />
              <p className="text-sm text-slate-400">{error}</p>
            </div>
          ) : text !== null ? (
            <pre className="w-full text-xs text-slate-300 font-mono whitespace-pre-wrap p-5 self-start">{text}</pre>
          ) : cat === 'images' && url ? (
            <img src={url} alt={displayName(file.name)} className="max-h-[70vh] w-auto object-contain" />
          ) : file.type.startsWith('video/') && url ? (
            <video src={url} controls className="max-h-[70vh] w-full" />
          ) : file.type.startsWith('audio/') && url ? (
            <div className="py-16 px-8 w-full"><audio src={url} controls className="w-full" /></div>
          ) : (
            <div className="text-center py-16 px-6">
              <div className="inline-flex p-5 bg-slate-900 rounded-2xl mb-4"><FileIconComp type={file.type} size={40} /></div>
              <p className="text-sm text-slate-400 mb-4">No inline preview for this file type.</p>
              <button onClick={() => onDownload(file)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition">
                <Download size={16} /> Download to view
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
