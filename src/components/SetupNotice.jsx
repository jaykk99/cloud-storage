import React from 'react'
import { AlertCircle, ExternalLink, Copy, Check } from 'lucide-react'

const hasUrl = Boolean(import.meta.env.VITE_SUPABASE_URL)
const hasKey = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)

function Code({ children }) {
  return <code className="text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
}

export default function SetupNotice() {
  const [copied, setCopied] = React.useState(false)
  const snippet = 'VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key'
  const copy = async () => {
    try { await navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 1500) }
    catch { /* clipboard unavailable */ }
  }
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-amber-900/60 rounded-3xl p-8 w-full max-w-lg shadow-2xl">
        <div className="inline-flex p-4 bg-amber-500/10 text-amber-400 rounded-2xl mb-5">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-extrabold text-white mb-2">Supabase Not Connected</h2>
        <p className="text-slate-400 text-sm mb-5 leading-relaxed">
          CloudVault needs a Supabase project for auth and file storage. Nothing is broken —
          the app simply has nowhere to store files yet. This is an honest opt-in:
          no keys, no cloud, no tracking until you connect one.
        </p>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-5 space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-semibold text-xs uppercase tracking-wider">Detected</span>
          </div>
          {[
            ['VITE_SUPABASE_URL', hasUrl],
            ['VITE_SUPABASE_ANON_KEY', hasKey],
          ].map(([k, ok]) => (
            <div key={k} className="flex items-center justify-between text-xs">
              <Code>{k}</Code>
              <span className={ok ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>{ok ? 'set' : 'missing'}</span>
            </div>
          ))}
        </div>
        <ol className="text-sm text-slate-300 space-y-2.5 mb-5 list-decimal list-inside leading-relaxed">
          <li>Create a free project at <a className="text-blue-400 hover:underline inline-flex items-center gap-1" href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com <ExternalLink size={12} /></a></li>
          <li>Copy <Code>.env.example</Code> to <Code>.env.local</Code> and paste your project URL + anon key:</li>
        </ol>
        <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3.5 mb-5">
          <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">{snippet}</pre>
          <button onClick={copy} className="absolute top-2.5 right-2.5 p-1.5 text-slate-500 hover:text-white transition" title="Copy">
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
        <ol className="text-sm text-slate-300 space-y-2.5 list-decimal list-inside leading-relaxed" start={3}>
          <li>Run the SQL in <Code>README.md</Code> (files table + storage policies) and create a Storage bucket named <Code>vault</Code>.</li>
          <li>Restart the dev server (or redeploy on Vercel with the same env vars).</li>
        </ol>
      </div>
    </div>
  )
}
