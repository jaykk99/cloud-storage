import React, { useState } from 'react'
import { supabase } from '../supabase'
import { HardDrive, AlertCircle, CheckCircle } from 'lucide-react'

export default function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState(''), [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false), [err, setErr] = useState(''), [success, setSuccess] = useState('')

  const submit = async e => {
    e.preventDefault(); setLoading(true); setErr(''); setSuccess('')
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Account created! Check your email to confirm, then sign in.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (e2) { setErr(e2.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-blue-600 rounded-xl"><HardDrive className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-xl font-extrabold text-white">CloudVault</h1>
            <p className="text-xs text-blue-400 font-medium">Secure Cloud Storage</p>
          </div>
        </div>
        <div className="flex bg-slate-950 rounded-xl p-1 mb-6 border border-slate-800">
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setErr(''); setSuccess('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === m ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input type="email" placeholder="Email address" required autoComplete="email"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password (min 6 chars)" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={password} onChange={e => setPassword(e.target.value)} />
          {err && <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/40 p-3 rounded-lg border border-red-900/30"><AlertCircle size={14} /><span>{err}</span></div>}
          {success && <div className="flex items-center gap-2 text-green-400 text-xs bg-green-950/40 p-3 rounded-lg border border-green-900/30"><CheckCircle size={14} /><span>{success}</span></div>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition shadow-lg shadow-blue-500/20">
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In to Vault' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
