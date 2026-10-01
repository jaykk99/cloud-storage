import React from 'react'
import { supabase } from '../supabase'
import { HardDrive, LogOut, LayoutDashboard, FolderOpen, Bot } from 'lucide-react'

export const TABS = [
  { id: 'dashboard', icon: <LayoutDashboard size={15} />, label: 'Dashboard' },
  { id: 'files', icon: <FolderOpen size={15} />, label: 'Files' },
  { id: 'ai', icon: <Bot size={15} />, label: 'AI Copilot' },
]

export default function Header({ user, activeTab, setActiveTab }) {
  return (
    <header className="sticky top-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-40 px-4 py-3.5 md:px-8">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30 shrink-0"><HardDrive className="w-6 h-6 text-white" /></div>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight text-white leading-none">CloudVault</h1>
            <span className="text-xs text-blue-400 font-medium truncate max-w-[180px] block mt-0.5">{user.email}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <nav className="hidden sm:flex bg-slate-950/80 p-1 rounded-xl border border-slate-800" aria-label="Main">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === t.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                {t.icon}<span>{t.label}</span>
              </button>
            ))}
          </nav>
          <button onClick={() => supabase.auth.signOut()} className="p-2 text-slate-500 hover:text-red-400 transition" title="Sign out" aria-label="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </div>
      <div className="sm:hidden flex mt-3 bg-slate-950/80 p-1 rounded-xl border border-slate-800 max-w-6xl mx-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === t.id ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </div>
    </header>
  )
}
