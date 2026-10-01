import React, { useState, useEffect, useRef } from 'react'
import { Bot, Send, Sparkles, KeyRound } from 'lucide-react'
import { formatBytes, getFileCategory } from '../lib/format'
import { Spinner } from './ui'

const hasKey = Boolean(import.meta.env.VITE_GEMINI_API_KEY)

export default function AICopilot({ files }) {
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: "Hello! I'm your Vault AI Assistant. Ask me to find files, summarize storage, or help categorize your data." }
  ])
  const [chatInput, setChatInput] = useState('')
  const [botTyping, setBotTyping] = useState(false)
  const msgEnd = useRef(null)

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  const handleSendMessage = async e => {
    e.preventDefault()
    if (!chatInput.trim() || botTyping) return
    const msg = chatInput.trim()
    setChatMessages(prev => [...prev, { sender: 'user', text: msg }])
    setChatInput(''); setBotTyping(true)
    try {
      if (!hasKey) {
        setChatMessages(prev => [...prev, {
          sender: 'bot',
          text: 'The AI Copilot needs a Gemini key to think. Add VITE_GEMINI_API_KEY to your .env.local (see .env.example) and restart — everything else in the vault works without it.'
        }])
        return
      }
      const cats = {
        documents: files.filter(f => getFileCategory(f.type) === 'documents').length,
        images: files.filter(f => getFileCategory(f.type) === 'images').length,
        media: files.filter(f => getFileCategory(f.type) === 'media').length,
        others: files.filter(f => getFileCategory(f.type) === 'others').length,
      }
      const used = files.reduce((a, f) => a + (f.size || 0), 0)
      const sys = `You are CloudVault AI. Storage: ${formatBytes(used)}/100 GB. Files: ${files.length} (${cats.documents} docs, ${cats.images} images, ${cats.media} media, ${cats.others} other). Files: ${JSON.stringify(files.map(f => ({ name: f.name, size: formatBytes(f.size || 0), type: f.type, date: f.created_at?.split('T')[0] })))}. Reply in 2-4 sentences.`
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: msg }] }], systemInstruction: { parts: [{ text: sys }] } })
      })
      if (!res.ok) throw new Error(`Gemini API returned HTTP ${res.status}`)
      const d = await res.json()
      const reply = d.candidates?.[0]?.content?.parts?.[0]?.text || "Couldn't process that — try again."
      setChatMessages(prev => [...prev, { sender: 'bot', text: reply }])
    } catch {
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'AI unavailable right now — check your Gemini key and connection, then try again.' }])
    } finally { setBotTyping(false) }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl h-[560px] flex flex-col overflow-hidden">
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/10 text-blue-400 rounded-xl"><Bot size={22} /></div>
          <div>
            <h3 className="text-sm font-bold text-white">Vault AI Copilot</h3>
            <p className={`text-[10px] font-medium ${hasKey ? 'text-green-400' : 'text-amber-400'}`}>
              {hasKey ? '● Live file index connected' : '● Keyless mode — add VITE_GEMINI_API_KEY to enable'}
            </p>
          </div>
        </div>
        <Sparkles className="text-amber-400" size={18} />
      </div>
      {!hasKey && (
        <div className="px-4 py-2.5 bg-amber-950/30 border-b border-amber-900/40 flex items-center gap-2 text-xs text-amber-300">
          <KeyRound size={13} className="shrink-0" />
          <span>AI answers are disabled without a Gemini key. File search, upload and everything else still work.</span>
        </div>
      )}
      <div className="p-2.5 border-b border-slate-800/60 overflow-x-auto flex gap-2">
        {['Find my documents', 'How much space am I using?', 'List all images', 'Summarize my vault'].map(p => (
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
              <Spinner size={14} className="text-blue-400" /><span>Thinking…</span>
            </div>
          </div>
        )}
        <div ref={msgEnd} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
        <input type="text" placeholder="Ask about your files…" aria-label="Ask the AI copilot"
          className="flex-1 px-4 py-3 bg-slate-900 text-white placeholder-slate-500 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          value={chatInput} onChange={e => setChatInput(e.target.value)} />
        <button type="submit" disabled={botTyping} aria-label="Send message"
          className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 active:scale-95 transition shrink-0 disabled:opacity-50">
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
