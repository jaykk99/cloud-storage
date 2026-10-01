import React, { useState } from 'react'
import { Lock, Key, AlertCircle } from 'lucide-react'

// Override via the VITE_ACCESS_KEY env var. The default is a demo value —
// set your own in .env.local or Vercel so the published lock code isn't guessable.
const ACCESS_KEY = import.meta.env.VITE_ACCESS_KEY || '999'

export default function LockScreen({ onUnlock }) {
  const [k, setK] = useState('')
  const [err, setErr] = useState('')
  const submit = e => {
    e.preventDefault()
    if (k === ACCESS_KEY) {
      sessionStorage.setItem('cv_unlocked', '1')
      onUnlock(); setErr('')
    } else setErr('Invalid Access Key. Please try again.')
  }
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -top-16 -left-16 pointer-events-none" />
      <div className="absolute w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] -bottom-16 -right-16 pointer-events-none" />
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md z-10 text-center">
        <div className="inline-flex p-4 bg-blue-500/10 text-blue-400 rounded-2xl mb-6">
          <Lock className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">CloudVault</h2>
        <p className="text-slate-400 text-sm mb-8">Secure cloud storage for your files</p>
        <form onSubmit={submit} className="space-y-4">
          <div className="relative">
            <input type="password" placeholder="Enter Access Key" autoFocus autoComplete="off"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest font-bold text-lg"
              value={k} onChange={e => setK(e.target.value)} />
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          </div>
          {err && (
            <div className="flex items-center gap-2 text-red-400 text-xs justify-center bg-red-950/40 p-2.5 rounded-lg border border-red-900/30">
              <AlertCircle size={14} /><span>{err}</span>
            </div>
          )}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold transition shadow-lg shadow-blue-500/20">
            Unlock Vault
          </button>
        </form>
        <p className="mt-8 pt-6 border-t border-slate-800 text-slate-600 text-xs">Powered by Supabase &bull; Deployed on Vercel</p>
      </div>
    </div>
  )
}
