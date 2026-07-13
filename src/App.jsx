import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase'
import {
  Upload, FileText, Trash2, Lock, Key, HardDrive,
  Bot, Send, Download, LayoutDashboard, FolderOpen,
  Sparkles, Image, FileAudio, File, AlertCircle, RefreshCw,
  LogOut, CheckCircle
} from 'lucide-react'

const ACCESS_KEY = '999'
const TOTAL_QUOTA_BYTES = 100 * 1024 * 1024 * 1024

function formatBytes(bytes, d = 2) {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024, sizes = ['Bytes','KB','MB','GB','TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(d < 0 ? 0 : d)) + ' ' + sizes[i]
}

function getFileCategory(type = '') {
  if (type.startsWith('image/')) return 'images'
  if (type.startsWith('audio/') || type.startsWith('video/')) return 'media'
  if (type.includes('pdf') || type.includes('word') || type.includes('text') || type.includes('document')) return 'documents'
  return 'others'
}

function FileIconComp({ type, size = 20 }) {
  const cat = getFileCategory(type)
  if (cat === 'images') return <Image size={size} className="text-green-400" />
  if (cat === 'media') return <FileAudio size={size} className="text-rose-400" />
  if (cat === 'documents') return <FileText size={size} className="text-amber-400" />
  return <File size={size} className="text-blue-400" />
}

function FileRow({ file, onDelete, onDownload }) {
  return (
    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="p-2.5 bg-slate-900 rounded-lg shrink-0">
          <FileIconComp type={file.type} size={20} />
        </div>
        <div className="overflow-hidden">
          <h4 className="text-sm font-semibold text-white truncate">{file.name}</h4>
          <span className="text-xs text-slate-500">
            {formatBytes(file.size || 0)} &bull; {file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Just now'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => onDownload(file)} title="Download"
          className="p-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg transition">
          <Download size={18} />
        </button>
        <button onClick={() => onDelete(file)} title="Delete"
          className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg transition">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}

function LockScreen({ onUnlock }) {
  const [k, setK] = useState(''), [err, setErr] = useState('')
  const submit = e => {
    e.preventDefault()
    if (k === ACCESS_KEY) { onUnlock(); setErr('') }
    else setErr('Invalid Access Key. Please try again.')
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
        <p className="text-slate-400 text-sm mb-8">Military-grade secure cloud storage</p>
        <form onSubmit={submit} className="space-y-4">
          <div className="relative">
            <input type="password" placeholder="Enter Access Key" autoFocus
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
            Verify Credentials
          </button>
        </form>
        <p className="mt-8 pt-6 border-t border-slate-800 text-slate-600 text-xs">Powered by Supabase &bull; Deployed on Vercel</p>
      </div>
    </div>
  )
}

function AuthScreen() {
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
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
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
          {['login','signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setErr(''); setSuccess('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === m ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input type="email" placeholder="Email address" required
            className="w-full px-4 py-3 rounded-xl bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password (min 6 chars)" required minLength={6}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={password} onChange={e => setPassword(e.target.value)} />
          {err && <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/40 p-3 rounded-lg border border-red-900/30"><AlertCircle size={14}/><span>{err}</span></div>}
          {success && <div className="flex items-center gap-2 text-green-400 text-xs bg-green-950/40 p-3 rounded-lg border border-green-900/30"><CheckCircle size={14}/><span>{success}</span></div>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition shadow-lg shadow-blue-500/20">
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In to Vault' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const [unlocked, setUnlocked] = useState(false)
  const [user, setUser] = useState(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [files, setFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [uploadProgress, setUploadProgress] = useState(null)
  const [uploadError, setUploadError] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: "Hello! I'm your Vault AI Assistant. Ask me to find files, summarize storage, or help categorize your data." }
  ])
  const [chatInput, setChatInput] = useState('')
  const [botTyping, setBotTyping] = useState(false)
  const msgEnd = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setSessionChecked(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchFiles = useCallback(async () => {
    if (!user) return
    setFilesLoading(true)
    const { data, error } = await supabase.from('files').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (!error) setFiles(data || [])
    setFilesLoading(false)
  }, [user])

  useEffect(() => { fetchFiles() }, [fetchFiles])
  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  const uploadFile = async e => {
    const file = e.target.files[0]
    if (!file || !user) return
    e.target.value = ''
    setUploadError('')
    if (file.size > 50 * 1024 * 1024) { setUploadError('File too large — max 50 MB on free tier.'); return }
    setUploadProgress(`Uploading ${file.name}…`)
    const filePath = `${user.id}/${Date.now()}_${file.name}`
    const { error: se } = await supabase.storage.from('vault').upload(filePath, file, { upsert: false })
    if (se) { setUploadProgress(null); setUploadError(`Upload failed: ${se.message}`); return }
    const { data: urlData } = supabase.storage.from('vault').getPublicUrl(filePath)
    const { error: de } = await supabase.from('files').insert({
      user_id: user.id, name: file.name, size: file.size,
      type: file.type || 'application/octet-stream',
      storage_path: filePath, public_url: urlData.publicUrl,
    })
    if (de) setUploadError(`Metadata error: ${de.message}`)
    else await fetchFiles()
    setUploadProgress(null)
  }

  const deleteFile = async file => {
    await supabase.storage.from('vault').remove([file.storage_path])
    await supabase.from('files').delete().eq('id', file.id)
    setFiles(prev => prev.filter(f => f.id !== file.id))
  }

  const downloadFile = async file => {
    const { data, error } = await supabase.storage.from('vault').download(file.storage_path)
    if (error || !data) return
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url; a.download = file.name
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const handleSendMessage = async e => {
    e.preventDefault()
    if (!chatInput.trim()) return
    const msg = chatInput
    setChatMessages(prev => [...prev, { sender: 'user', text: msg }])
    setChatInput(''); setBotTyping(true)
    const cats = {
      documents: files.filter(f => getFileCategory(f.type) === 'documents'),
      images: files.filter(f => getFileCategory(f.type) === 'images'),
      media: files.filter(f => getFileCategory(f.type) === 'media'),
      others: files.filter(f => getFileCategory(f.type) === 'others'),
    }
    const used = files.reduce((a, f) => a + (f.size || 0), 0)
    const sys = `You are CloudVault AI. Storage: ${formatBytes(used)}/100 GB. Files: ${files.length} (${cats.documents.length} docs, ${cats.images.length} images, ${cats.media.length} media, ${cats.others.length} other). Files: ${JSON.stringify(files.map(f => ({ name: f.name, size: formatBytes(f.size || 0), type: f.type, date: f.created_at?.split('T')[0] })))}. Reply in 2-4 sentences.`
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: msg }] }], systemInstruction: { parts: [{ text: sys }] } })
      })
      const d = await res.json()
      const reply = d.candidates?.[0]?.content?.parts?.[0]?.text || "Couldn't process that — try again."
      setChatMessages(prev => [...prev, { sender: 'bot', text: reply }])
    } catch {
      setChatMessages(prev => [...prev, { sender: 'bot', text: "AI unavailable. Add VITE_GEMINI_API_KEY to your .env file." }])
    } finally { setBotTyping(false) }
  }

  const totalUsed = files.reduce((a, f) => a + (f.size || 0), 0)
  const pct = Math.min((totalUsed / TOTAL_QUOTA_BYTES) * 100, 100).toFixed(4)
  const cats = {
    documents: files.filter(f => getFileCategory(f.type) === 'documents'),
    images: files.filter(f => getFileCategory(f.type) === 'images'),
    media: files.filter(f => getFileCategory(f.type) === 'media'),
    others: files.filter(f => getFileCategory(f.type) === 'others'),
  }

  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />
  if (!sessionChecked) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><RefreshCw className="text-blue-400 animate-spin" size={32} /></div>
  if (!user) return <AuthScreen />

  const TABS = [
    { id: 'dashboard', icon: <LayoutDashboard size={14} />, label: 'Dashboard' },
    { id: 'files', icon: <FolderOpen size={14} />, label: 'Files' },
    { id: 'ai', icon: <Bot size={14} />, label: 'AI Copilot' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="sticky top-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-40 px-4 py-4 md:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30"><HardDrive className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">CloudVault</h1>
              <span className="text-xs text-blue-400 font-medium truncate max-w-[160px] block">{user.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <nav className="hidden sm:flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition ${activeTab === t.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  {t.icon}<span>{t.label}</span>
                </button>
              ))}
            </nav>
            <button onClick={() => supabase.auth.signOut()} className="p-2 text-slate-500 hover:text-red-400 transition" title="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <div className="sm:hidden flex mt-3 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === t.id ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
              {t.icon}<span>{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
        {/* Upload */}
        <div className="mb-8">
          <div className="relative group overflow-hidden bg-gradient-to-r from-blue-900/30 via-slate-900 to-indigo-900/30 border border-slate-800 rounded-3xl p-6 md:p-8 text-center">
            <input type="file" id="file-upload" className="hidden" onChange={uploadFile} disabled={!!uploadProgress} />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4">
              <div className="p-4 bg-slate-950 rounded-2xl group-hover:scale-110 border border-slate-800 transition duration-300">
                <Upload className="w-10 h-10 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Upload to Vault</h3>
                <p className="text-slate-400 text-xs md:text-sm">Any file type &bull; Max 50 MB &bull; Stored in Supabase</p>
              </div>
            </label>
            {uploadProgress && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-slate-300 font-semibold">{uploadProgress}</p>
              </div>
            )}
          </div>
          {uploadError && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-950/40 p-3 rounded-xl border border-red-900/30">
              <AlertCircle size={14} /><span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total Storage</span>
                    <HardDrive className="text-blue-400" size={18} />
                  </div>
                  <h3 className="text-3xl font-black text-white">{formatBytes(totalUsed)}</h3>
                  <p className="text-xs text-slate-500 mt-1">Quota: 100 GB</p>
                </div>
                <div className="mt-6">
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-slate-400">
                    <span>{pct}% Used</span><span>100 GB</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:col-span-2">
                <h4 className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-4">File Categories</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Documents', count: cats.documents.length, icon: <FileText className="text-amber-400" size={24} /> },
                    { label: 'Images', count: cats.images.length, icon: <Image className="text-green-400" size={24} /> },
                    { label: 'Media', count: cats.media.length, icon: <FileAudio className="text-rose-400" size={24} /> },
                    { label: 'Others', count: cats.others.length, icon: <File className="text-blue-400" size={24} /> },
                  ].map(c => (
                    <div key={c.label} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                      {c.icon}
                      <div><span className="block text-xs text-slate-400">{c.label}</span><strong className="text-white text-lg">{c.count}</strong></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Recent Files</h3>
                <button onClick={() => setActiveTab('files')} className="text-xs text-blue-400 font-bold hover:underline">View All</button>
              </div>
              {filesLoading ? (
                <div className="text-center py-8 text-slate-500 text-sm flex items-center justify-center gap-2"><RefreshCw size={14} className="animate-spin" /> Loading…</div>
              ) : files.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">Your vault is empty — upload your first file above.</div>
              ) : (
                <div className="grid gap-3">{files.slice(0,5).map(f => <FileRow key={f.id} file={f} onDelete={deleteFile} onDownload={downloadFile} />)}</div>
              )}
            </div>
          </div>
        )}

        {/* Files */}
        {activeTab === 'files' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">All Files ({files.length})</h3>
              <button onClick={fetchFiles} className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"><RefreshCw size={12} /> Refresh</button>
            </div>
            {filesLoading ? (
              <div className="text-center py-12 text-slate-500 flex items-center justify-center gap-2"><RefreshCw size={14} className="animate-spin" /> Loading…</div>
            ) : files.length === 0 ? (
              <div className="text-center py-16 text-slate-500">No files yet.</div>
            ) : (
              <div className="grid gap-3">{files.map(f => <FileRow key={f.id} file={f} onDelete={deleteFile} onDownload={downloadFile} />)}</div>
            )}
          </div>
        )}

        {/* AI */}
        {activeTab === 'ai' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl h-[560px] flex flex-col overflow-hidden">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/10 text-blue-400 rounded-xl"><Bot size={22} /></div>
                <div>
                  <h3 className="text-sm font-bold text-white">Vault AI Copilot</h3>
                  <p className="text-[10px] text-green-400 font-medium">&#9679; Live file index connected</p>
                </div>
              </div>
              <Sparkles className="text-amber-400" size={18} />
            </div>
            <div className="p-2.5 border-b border-slate-800/60 overflow-x-auto flex gap-2">
              {['Find my documents','How much space am I using?','List all images','Summarize my vault'].map(p => (
                <button key={p} onClick={() => setChatInput(p)}
                  className="bg-slate-900 text-xs text-slate-300 px-3 py-1.5 rounded-full hover:bg-blue-600 hover:text-white border border-slate-800 transition whitespace-nowrap">
                  {p}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3.5 text-sm ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60'}`}>
                    <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))}
              {botTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700/60 text-slate-400 rounded-2xl rounded-tl-none p-3.5 text-sm flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-blue-400" /><span>Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={msgEnd} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
              <input type="text" placeholder="Ask about your files…"
                className="flex-1 px-4 py-3 bg-slate-900 text-white placeholder-slate-500 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                value={chatInput} onChange={e => setChatInput(e.target.value)} />
              <button type="submit" className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 active:scale-95 transition shrink-0">
                <Send size={18} />
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
