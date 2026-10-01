import React, { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'
import { useFiles } from './hooks/useFiles'
import { Toasts, RenameModal } from './components/ui'
import LockScreen from './components/LockScreen'
import AuthScreen from './components/AuthScreen'
import SetupNotice from './components/SetupNotice'
import Header from './components/Header'
import UploadZone from './components/UploadZone'
import FileBrowser from './components/FileBrowser'
import PreviewModal from './components/PreviewModal'
import Dashboard from './components/Dashboard'
import AICopilot from './components/AICopilot'
import { RefreshCw } from 'lucide-react'

export default function App() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('cv_unlocked') === '1')
  const [user, setUser] = useState(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [toasts, setToasts] = useState([])
  const [currentFolder, setCurrentFolder] = useState('')
  const [preview, setPreview] = useState(null)
  const [renaming, setRenaming] = useState(null)

  const dismissToast = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), [])
  const notify = useCallback((message, type = 'info') => {
    const id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()))
    setToasts(p => [...p.slice(-4), { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 6000)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) { setSessionChecked(true); return }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setSessionChecked(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const fm = useFiles(user, notify)
  const { deleteFile, renameFile, downloadFile } = fm

  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />
  if (!sessionChecked) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <RefreshCw className="text-blue-400 animate-spin" size={32} />
    </div>
  )
  if (!isSupabaseConfigured) return <SetupNotice />
  if (!user) return <AuthScreen />

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 pb-24">
        {activeTab !== 'ai' && (
          <UploadZone
            uploads={fm.uploads}
            enqueueUploads={fm.enqueueUploads}
            retryUpload={fm.retryUpload}
            cancelUpload={fm.cancelUpload}
            clearFinished={fm.clearFinished}
            maxUploadMB={fm.maxUploadMB}
            currentFolder={activeTab === 'files' ? currentFolder : ''}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            files={fm.files} loading={fm.loading} setActiveTab={setActiveTab}
            onDownload={downloadFile} onDelete={deleteFile}
            onRename={setRenaming} onPreview={setPreview}
          />
        )}

        {activeTab === 'files' && (
          <FileBrowser
            files={fm.files} loading={fm.loading} loadError={fm.loadError}
            fetchFiles={fm.fetchFiles} user={user}
            deleteFile={deleteFile} renameFile={renameFile}
            createFolder={fm.createFolder} downloadFile={downloadFile}
            preview={preview} setPreview={setPreview}
            onFolderChange={setCurrentFolder}
            renaming={renaming} setRenaming={setRenaming}
          />
        )}

        {activeTab === 'ai' && <AICopilot files={fm.files} />}
      </main>
      {preview && <PreviewModal file={preview} onClose={() => setPreview(null)} onDownload={downloadFile} />}
      {renaming && (
        <RenameModal file={renaming} onClose={() => setRenaming(null)}
          onSubmit={name => renameFile(renaming, name)} />
      )}
      <Toasts toasts={toasts} dismiss={dismissToast} />
    </div>
  )
}
