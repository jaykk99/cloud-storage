import React from 'react'
import { AlertCircle, CheckCircle, Info, X, RefreshCw, Inbox, Image, FileAudio, FileText, File } from 'lucide-react'
import { getFileCategory } from '../lib/format'

export function FileIconComp({ type, size = 20 }) {
  const cat = getFileCategory(type)
  if (cat === 'images') return <Image size={size} className="text-emerald-400" />
  if (cat === 'media') return <FileAudio size={size} className="text-rose-400" />
  if (cat === 'documents') return <FileText size={size} className="text-amber-400" />
  return <File size={size} className="text-blue-400" />
}

export function Toasts({ toasts, dismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)]">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border shadow-2xl text-sm backdrop-blur-md animate-[slidein_.2s_ease-out] ${
            t.type === 'error' ? 'bg-red-950/90 border-red-800/60 text-red-200'
            : t.type === 'success' ? 'bg-emerald-950/90 border-emerald-800/60 text-emerald-200'
            : 'bg-slate-900/95 border-slate-700 text-slate-200'}`}>
          {t.type === 'error' ? <AlertCircle size={16} className="mt-0.5 shrink-0" />
            : t.type === 'success' ? <CheckCircle size={16} className="mt-0.5 shrink-0" />
            : <Info size={16} className="mt-0.5 shrink-0" />}
          <span className="flex-1 leading-snug">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100 shrink-0"><X size={14} /></button>
        </div>
      ))}
      <style>{`@keyframes slidein{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}`}</style>
    </div>
  )
}

export function Modal({ children, onClose, labelledBy }) {
  React.useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={labelledBy}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg">{children}</div>
    </div>
  )
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <Modal onClose={onCancel} labelledBy={title}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white transition">{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  )
}

export function Spinner({ size = 16, className = '' }) {
  return <RefreshCw size={size} className={`animate-spin ${className}`} />
}

export function RenameModal({ file, onClose, onSubmit }) {
  const [val, setVal] = React.useState(file?.name || '')
  const input = React.useRef(null)
  React.useEffect(() => { setVal(file?.name || ''); setTimeout(() => input.current?.select(), 50) }, [file])
  if (!file) return null
  const submit = () => { if (val.trim() && val.trim() !== file.name) onSubmit(val.trim()); onClose() }
  return (
    <Modal onClose={onClose} labelledBy="Rename file">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4">Rename file</h3>
        <input ref={input} value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          className="w-full px-4 py-3 rounded-xl bg-slate-950 text-white border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-5" />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition">Cancel</button>
          <button onClick={submit} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition">Rename</button>
        </div>
      </div>
    </Modal>
  )
}

export function EmptyState({ icon, title, hint, action }) {
  return (
    <div className="text-center py-14 px-6">
      <div className="inline-flex p-4 bg-slate-800/60 rounded-2xl mb-4 text-slate-500">{icon || <Inbox size={32} />}</div>
      <h4 className="text-white font-semibold mb-1">{title}</h4>
      {hint && <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-2.5 text-red-300 text-sm bg-red-950/40 p-3.5 rounded-xl border border-red-900/40 mb-4">
      <AlertCircle size={16} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-1 text-xs font-bold text-red-200 hover:text-white shrink-0">
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  )
}
