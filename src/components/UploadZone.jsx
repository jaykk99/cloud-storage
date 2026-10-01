import React, { useRef, useState } from 'react'
import {
  Upload, X, RefreshCw, CheckCircle, AlertCircle, UploadCloud, FolderUp
} from 'lucide-react'
import { formatBytes } from '../lib/format'

function QueueItem({ item, onRetry, onCancel }) {
  return (
    <div className="px-4 py-3 border-b border-slate-800/60 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{item.name}</p>
          <p className="text-[11px] text-slate-500">{formatBytes(item.size)}</p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          {item.status === 'error' && (
            <button onClick={() => onRetry(item.id)} title="Retry" className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition">
              <RefreshCw size={14} />
            </button>
          )}
          {(item.status === 'queued' || item.status === 'uploading' || item.status === 'starting') && (
            <button onClick={() => onCancel(item.id)} title="Cancel" className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
              <X size={14} />
            </button>
          )}
          {item.status === 'done' && <CheckCircle size={16} className="text-emerald-400" />}
          {item.status === 'error' && <AlertCircle size={16} className="text-red-400" />}
          {(item.status === 'uploading' || item.status === 'starting') && <RefreshCw size={14} className="text-blue-400 animate-spin" />}
        </div>
      </div>
      {(item.status === 'uploading' || item.status === 'starting' || item.status === 'processing') && (
        <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-200"
            style={{ width: `${item.status === 'processing' ? 100 : item.progress}%` }} />
        </div>
      )}
      {item.status === 'uploading' && <p className="text-[11px] text-blue-400 mt-1">{item.progress}%</p>}
      {item.status === 'processing' && <p className="text-[11px] text-slate-500 mt-1">Saving…</p>}
      {item.status === 'error' && <p className="text-[11px] text-red-400 mt-1 leading-snug">{item.error}</p>}
    </div>
  )
}

export default function UploadZone({ uploads, enqueueUploads, retryUpload, cancelUpload, clearFinished, maxUploadMB, currentFolder }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [queueOpen, setQueueOpen] = useState(true)
  const dragCount = useRef(0)

  const active = uploads.filter(u => !['done', 'error'].includes(u.status)).length
  const finished = uploads.filter(u => ['done', 'error'].includes(u.status)).length

  const onDrop = e => {
    e.preventDefault()
    dragCount.current = 0
    setDragging(false)
    if (e.dataTransfer.files?.length) enqueueUploads(e.dataTransfer.files, currentFolder)
  }

  return (
    <>
      <div
        onDragEnter={e => { e.preventDefault(); dragCount.current += 1; setDragging(true) }}
        onDragLeave={e => { e.preventDefault(); dragCount.current -= 1; if (dragCount.current <= 0) setDragging(false) }}
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-6 md:p-8 text-center cursor-pointer transition mb-6
          ${dragging ? 'border-blue-500 bg-blue-950/30 scale-[1.01]' : 'border-slate-800 bg-gradient-to-r from-blue-900/20 via-slate-900 to-indigo-900/20 hover:border-slate-700'}`}>
        <input ref={inputRef} type="file" multiple className="hidden"
          onChange={e => { if (e.target.files?.length) enqueueUploads(e.target.files, currentFolder); e.target.value = '' }} />
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div className={`p-4 rounded-2xl border transition ${dragging ? 'bg-blue-600/20 border-blue-500/50 scale-110' : 'bg-slate-950 border-slate-800'}`}>
            {dragging ? <FolderUp className="w-9 h-9 text-blue-400" /> : <UploadCloud className="w-9 h-9 text-blue-400" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white mb-1">{dragging ? 'Drop to upload' : 'Drag & drop files here'}</h3>
            <p className="text-slate-400 text-xs md:text-sm">
              or <span className="text-blue-400 font-semibold">browse your device</span> &bull; Max {maxUploadMB} MB each
              {currentFolder && <> &bull; saving to <span className="text-blue-300 font-mono">/{currentFolder}</span></>}
            </p>
          </div>
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="fixed bottom-4 left-4 z-[80] w-[calc(100vw-2rem)] max-w-sm bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          <button onClick={() => setQueueOpen(o => !o)} className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-slate-800/50 transition text-left">
            <Upload size={16} className="text-blue-400 shrink-0" />
            <span className="text-sm font-bold text-white flex-1">
              {active > 0 ? `Uploading ${active} file${active > 1 ? 's' : ''}…` : 'Uploads finished'}
            </span>
            {finished > 0 && (
              <span onClick={e => { e.stopPropagation(); clearFinished() }}
                className="text-[11px] font-semibold text-slate-400 hover:text-white cursor-pointer">Clear</span>
            )}
            <span className={`text-slate-500 text-xs transition-transform ${queueOpen ? '' : '-rotate-90'}`}>▾</span>
          </button>
          {queueOpen && (
            <div className="max-h-64 overflow-y-auto border-t border-slate-800/60">
              {uploads.map(u => <QueueItem key={u.id} item={u} onRetry={retryUpload} onCancel={cancelUpload} />)}
            </div>
          )}
        </div>
      )}
    </>
  )
}
