import React from 'react'
import { HardDrive, FileText, Image, FileAudio, File, Clock } from 'lucide-react'
import { formatBytes, getFileCategory } from '../lib/format'
import { FileRow } from './FileBrowser'

const TOTAL_QUOTA_BYTES = 100 * 1024 * 1024 * 1024

export default function Dashboard({ files, loading, setActiveTab, ...rowProps }) {
  const totalUsed = files.reduce((a, f) => a + (f.size || 0), 0)
  const pct = Math.min((totalUsed / TOTAL_QUOTA_BYTES) * 100, 100)
  const cats = {
    documents: files.filter(f => getFileCategory(f.type) === 'documents'),
    images: files.filter(f => getFileCategory(f.type) === 'images'),
    media: files.filter(f => getFileCategory(f.type) === 'media'),
    others: files.filter(f => getFileCategory(f.type) === 'others'),
  }
  const catBytes = Object.fromEntries(Object.entries(cats).map(([k, v]) => [k, v.reduce((a, f) => a + (f.size || 0), 0)]))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total Storage</span>
              <HardDrive className="text-blue-400" size={18} />
            </div>
            <h3 className="text-3xl font-black text-white">{formatBytes(totalUsed)}</h3>
            <p className="text-xs text-slate-500 mt-1">of 100 GB quota &bull; {files.length} file{files.length === 1 ? '' : 's'}</p>
          </div>
          <div className="mt-6">
            <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800" role="progressbar" aria-valuenow={Number(pct.toFixed(2))} aria-valuemin={0} aria-valuemax={100}>
              <div className={`h-full rounded-full transition-all duration-500 ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${Math.max(pct, totalUsed > 0 ? 1 : 0)}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>{pct < 0.01 && totalUsed > 0 ? '<0.01' : pct.toFixed(2)}% used</span><span>100 GB</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:col-span-2">
          <h4 className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-4">By Category</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: 'Documents', key: 'documents', icon: <FileText className="text-amber-400" size={24} /> },
              { label: 'Images', key: 'images', icon: <Image className="text-emerald-400" size={24} /> },
              { label: 'Media', key: 'media', icon: <FileAudio className="text-rose-400" size={24} /> },
              { label: 'Others', key: 'others', icon: <File className="text-blue-400" size={24} /> },
            ].map(c => (
              <div key={c.label} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                {c.icon}
                <div>
                  <span className="block text-xs text-slate-400">{c.label}</span>
                  <strong className="text-white text-lg">{cats[c.key].length}</strong>
                  <span className="block text-[11px] text-slate-500">{formatBytes(catBytes[c.key])}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Clock size={18} className="text-slate-500" /> Recent Files</h3>
          <button onClick={() => setActiveTab('files')} className="text-xs text-blue-400 font-bold hover:underline">View All</button>
        </div>
        {loading && files.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">Loading…</div>
        ) : files.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            Your vault is empty — drag & drop files onto the upload zone in the Files tab to get started.
          </div>
        ) : (
          <div className="grid gap-2.5">
            {files.slice(0, 5).map(f => <FileRow key={f.id} file={f} {...rowProps} />)}
          </div>
        )}
      </div>
    </div>
  )
}
