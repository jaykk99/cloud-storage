import React, { useState, useMemo, useEffect } from 'react'
import {
  Download, Trash2, RefreshCw,
  Search, LayoutGrid, List, ChevronRight, Folder, FolderPlus,
  Pencil, Eye, Home, ArrowUpDown, X, FolderSearch,
  FolderInput, CheckSquare, Square,
} from 'lucide-react'
import { formatBytes, formatDate, getFileCategory, displayName } from '../lib/format'
import { relativeDir } from '../hooks/useFiles'
import { signedUrl } from '../lib/upload'
import { EmptyState, ErrorBanner, Spinner, Modal, ConfirmDialog, FileIconComp, RenameModal } from './ui'

// Lazy image thumbnail via signed URL, cached across cards.
const thumbCache = new Map()
function Thumb({ file }) {
  const [src, setSrc] = useState(thumbCache.get(file.id) || null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let live = true
    if (!thumbCache.get(file.id)) {
      signedUrl(file.storage_path, 3600).then(u => {
        thumbCache.set(file.id, u)
        if (live) setSrc(u)
      }).catch(() => { if (live) setFailed(true) })
    }
    return () => { live = false }
  }, [file.id, file.storage_path])
  if (failed || !src) return <FileIconComp type={file.type} size={28} />
  return <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" onError={() => setFailed(true)} />
}

function SelectBox({ checked, onChange, label }) {
  return (
    <button onClick={e => { e.stopPropagation(); onChange() }} title={label} aria-label={label}
      className="p-1 rounded-md text-slate-400 hover:text-white transition shrink-0">
      {checked
        ? <CheckSquare size={20} className="text-blue-400" />
        : <Square size={20} />}
    </button>
  )
}

function Actions({ file, onPreview, onDownload, onRename, onMove, onDelete }) {
  const btn = 'p-2 rounded-lg transition text-slate-500 hover:text-white hover:bg-slate-800'
  return (
    <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
      <button onClick={() => onPreview(file)} title="Preview" aria-label={`Preview ${file.name}`} className={btn}><Eye size={16} /></button>
      <button onClick={() => onDownload(file)} title="Download" aria-label={`Download ${file.name}`} className={`${btn} hover:!text-blue-400`}><Download size={16} /></button>
      <button onClick={() => onRename(file)} title="Rename" aria-label={`Rename ${file.name}`} className={btn}><Pencil size={16} /></button>
      {onMove && (
        <button onClick={() => onMove(file)} title="Move to folder" aria-label={`Move ${file.name} to folder`} className={btn}><FolderInput size={16} /></button>
      )}
      <button onClick={() => onDelete(file)} title="Delete" aria-label={`Delete ${file.name}`} className={`${btn} hover:!text-red-400`}><Trash2 size={16} /></button>
    </div>
  )
}

export function FileRow({ file, onPreview, onDownload, onRename, onMove, onDelete, selectMode, selected, onToggleSelect }) {
  const click = () => (selectMode ? onToggleSelect(file.id) : onPreview(file))
  return (
    <div onClick={click}
      className={`bg-slate-950 border hover:border-slate-700 p-3.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition group ${selected ? 'border-blue-600' : 'border-slate-800'}`}>
      <div className="flex items-center gap-3 overflow-hidden min-w-0">
        {selectMode && <SelectBox checked={selected} onChange={() => onToggleSelect(file.id)} label={`Select ${file.name}`} />}
        <div className="w-11 h-11 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
          {getFileCategory(file.type) === 'images' ? <Thumb file={file} /> : <FileIconComp type={file.type} size={20} />}
        </div>
        <div className="overflow-hidden min-w-0">
          <h4 className="text-sm font-semibold text-white truncate" title={file.name}>{displayName(file.name)}</h4>
          <span className="text-xs text-slate-500">{formatBytes(file.size || 0)} &bull; {formatDate(file.created_at)}</span>
        </div>
      </div>
      {!selectMode && <Actions file={file} onPreview={onPreview} onDownload={onDownload} onRename={onRename} onMove={onMove} onDelete={onDelete} />}
    </div>
  )
}

function FileCard({ file, onPreview, onDownload, onRename, onMove, onDelete, selectMode, selected, onToggleSelect }) {
  const isImg = getFileCategory(file.type) === 'images'
  const click = () => (selectMode ? onToggleSelect(file.id) : onPreview(file))
  return (
    <div onClick={click}
      className={`bg-slate-950 border hover:border-slate-600 rounded-2xl overflow-hidden cursor-pointer transition group flex flex-col relative ${selected ? '!border-blue-600' : 'border-slate-800'}`}>
      {selectMode && (
        <div className="absolute top-2 left-2 z-10 bg-slate-950/80 rounded-md">
          <SelectBox checked={selected} onChange={() => onToggleSelect(file.id)} label={`Select ${file.name}`} />
        </div>
      )}
      <div className="aspect-[4/3] bg-slate-900 flex items-center justify-center overflow-hidden relative">
        {isImg ? <Thumb file={file} /> : <FileIconComp type={file.type} size={40} />}
        {!selectMode && (
          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition flex justify-end">
            <Actions file={file} onPreview={onPreview} onDownload={onDownload} onRename={onRename} onMove={onMove} onDelete={onDelete} />
          </div>
        )}
      </div>
      <div className="p-3">
        <h4 className="text-sm font-semibold text-white truncate" title={file.name}>{displayName(file.name)}</h4>
        <span className="text-xs text-slate-500">{formatBytes(file.size || 0)} &bull; {formatDate(file.created_at)}</span>
      </div>
    </div>
  )
}

function FolderTile({ name, count, onOpen }) {
  return (
    <button onClick={onOpen}
      className="bg-slate-900/60 border border-slate-800 hover:border-blue-600/50 rounded-2xl p-4 flex items-center gap-3 text-left transition group">
      <Folder size={28} className="text-blue-400 group-hover:scale-110 transition shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">{name}</p>
        <p className="text-xs text-slate-500">{count} item{count === 1 ? '' : 's'}</p>
      </div>
    </button>
  )
}

const SORTS = [
  { id: 'date-desc', label: 'Newest first' },
  { id: 'date-asc', label: 'Oldest first' },
  { id: 'name-asc', label: 'Name A–Z' },
  { id: 'name-desc', label: 'Name Z–A' },
  { id: 'size-desc', label: 'Largest first' },
  { id: 'size-asc', label: 'Smallest first' },
]

const CATS = [
  { id: 'all', label: 'All' },
  { id: 'documents', label: 'Documents' },
  { id: 'images', label: 'Images' },
  { id: 'media', label: 'Media' },
  { id: 'others', label: 'Others' },
]

export default function FileBrowser(props) {
  const { files, loading, loadError, fetchFiles, user, deleteFile, deleteFiles, renameFile, moveFiles, createFolder, downloadFile,
    preview, setPreview, onFolderChange, renaming, setRenaming } = props
  const [view, setView] = useState(() => localStorage.getItem('cv_view') || 'grid')
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('all')
  const [sort, setSort] = useState('date-desc')
  const [folder, setFolder] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderVal, setNewFolderVal] = useState('')
  // Bulk selection + move
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [moving, setMoving] = useState(null) // array of files being moved, or null
  const [moveDest, setMoveDest] = useState('')
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const toggleSelect = id => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const exitSelectMode = () => { setSelectMode(false); setSelectedIds([]) }
  const selectedFiles = useMemo(() => files.filter(f => selectedIds.includes(f.id)), [files, selectedIds])

  // Every folder in the vault (for the move destination picker).
  const allFolders = useMemo(() => {
    const set = new Set()
    for (const f of files) {
      const dir = relativeDir(f.storage_path, user.id)
      if (dir) {
        const parts = dir.split('/')
        for (let i = 1; i <= parts.length; i++) set.add(parts.slice(0, i).join('/'))
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [files, user.id])

  const openMove = list => { setMoving(list); setMoveDest('') }
  const confirmMove = () => {
    if (!moving) return
    moveFiles(moving, moveDest)
    setMoving(null)
    exitSelectMode()
  }

  useEffect(() => { localStorage.setItem('cv_view', view) }, [view])
  useEffect(() => { onFolderChange?.(folder) }, [folder, onFolderChange])

  // Folders are virtual: derived from storage_path prefixes under the user's root.
  const { subfolders, filesHere } = useMemo(() => {
    const subs = new Map()
    const here = []
    for (const f of files) {
      const dir = relativeDir(f.storage_path, user.id)
      if (dir === folder) here.push(f)
      else if (folder === '' && dir && !dir.includes('/')) subs.set(dir, (subs.get(dir) || 0) + 1)
      else if (folder !== '' && dir.startsWith(folder + '/')) {
        const rest = dir.slice(folder.length + 1)
        if (rest && !rest.includes('/')) subs.set(rest, (subs.get(rest) || 0) + 1)
      }
    }
    return { subfolders: [...subs.entries()].sort((a, b) => a[0].localeCompare(b[0])), filesHere: here }
  }, [files, folder, user.id])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = filesHere.filter(f =>
      (cat === 'all' || getFileCategory(f.type) === cat) &&
      (!q || f.name.toLowerCase().includes(q))
    )
    const by = {
      'date-desc': (a, b) => (b.created_at || '').localeCompare(a.created_at || ''),
      'date-asc': (a, b) => (a.created_at || '').localeCompare(b.created_at || ''),
      'name-asc': (a, b) => a.name.localeCompare(b.name),
      'name-desc': (a, b) => b.name.localeCompare(a.name),
      'size-desc': (a, b) => (b.size || 0) - (a.size || 0),
      'size-asc': (a, b) => (a.size || 0) - (b.size || 0),
    }[sort]
    return [...list].sort(by)
  }, [filesHere, query, cat, sort])

  const crumbs = folder ? folder.split('/') : []
  const goTo = i => setFolder(i < 0 ? '' : crumbs.slice(0, i + 1).join('/'))

  const submitFolder = () => {
    if (!newFolderVal.trim()) return
    const path = (folder ? folder + '/' : '') + newFolderVal.trim().replace(/[/\\]+/g, '-')
    createFolder(path)
    setNewFolderVal(''); setNewFolderOpen(false)
  }

  const isFiltering = query.trim() || cat !== 'all'

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search files…"
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-900 text-white placeholder-slate-500 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          {query && <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={14} /></button>}
        </div>
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
          <button onClick={() => setView('grid')} title="Grid view" aria-label="Grid view"
            className={`p-2 rounded-lg transition ${view === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}><LayoutGrid size={16} /></button>
          <button onClick={() => setView('list')} title="List view" aria-label="List view"
            className={`p-2 rounded-lg transition ${view === 'list' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}><List size={16} /></button>
        </div>
        <div className="relative">
          <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort files"
            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-slate-900 text-slate-300 text-sm border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <ArrowUpDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
        <button onClick={() => setNewFolderOpen(true)} title="New folder"
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition">
          <FolderPlus size={16} /> <span className="hidden md:inline">New folder</span>
        </button>
        <button onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))} title="Select files"
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition ${selectMode ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-600'}`}>
          <CheckSquare size={16} /> <span className="hidden md:inline">{selectMode ? 'Done' : 'Select'}</span>
        </button>
        <button onClick={fetchFiles} title="Refresh" className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {CATS.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${cat === c.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selectMode && (
        <div className="flex flex-wrap items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-blue-950/40 border border-blue-900/50">
          <span className="text-sm font-semibold text-blue-200">
            {selectedIds.length} selected
          </span>
          <div className="flex-1" />
          {selectedIds.length > 0 && (
            <>
              <button onClick={() => openMove(selectedFiles)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition">
                <FolderInput size={14} /> Move
              </button>
              <button onClick={() => setBulkDeleting(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-red-900/60 hover:bg-red-800 text-red-100 transition">
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
          <button onClick={() => setSelectedIds([])} className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition">
            Clear
          </button>
        </div>
      )}

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm mb-4 overflow-x-auto" aria-label="Folders">
        <button onClick={() => goTo(-1)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${folder === '' ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}>
          <Home size={14} /> Vault
        </button>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            <ChevronRight size={14} className="text-slate-600 shrink-0" />
            <button onClick={() => goTo(i)} className={`px-2.5 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${i === crumbs.length - 1 ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}>{c}</button>
          </React.Fragment>
        ))}
      </nav>

      <ErrorBanner message={loadError} onRetry={fetchFiles} />

      {loading && files.length === 0 ? (
        <div className="text-center py-16 text-slate-500 flex items-center justify-center gap-2"><Spinner /> Loading files…</div>
      ) : (
        <>
          {subfolders.length > 0 && !isFiltering && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
              {subfolders.map(([name, count]) => (
                <FolderTile key={name} name={name} count={count} onOpen={() => setFolder(folder ? folder + '/' + name : name)} />
              ))}
            </div>
          )}

          {visible.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl">
              {isFiltering ? (
                <EmptyState icon={<FolderSearch size={32} />} title="No matches" hint={`Nothing in ${folder ? `/${folder}` : 'your vault'} matches the current search or filter.`}
                  action={<button onClick={() => { setQuery(''); setCat('all') }} className="text-sm font-semibold text-blue-400 hover:underline">Clear search & filters</button>} />
              ) : (
                <EmptyState title={folder ? `/${folder} is empty` : 'Your vault is empty'}
                  hint="Drag & drop files onto the upload zone above — they'll land right here." />
              )}
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {visible.map(f => <FileCard key={f.id} file={f}
                onPreview={setPreview} onDownload={downloadFile}
                onRename={setRenaming} onMove={file => openMove([file])}
                onDelete={setDeleting}
                selectMode={selectMode} selected={selectedIds.includes(f.id)} onToggleSelect={toggleSelect} />)}
            </div>
          ) : (
            <div className="grid gap-2.5">
              {visible.map(f => <FileRow key={f.id} file={f}
                onPreview={setPreview} onDownload={downloadFile}
                onRename={setRenaming} onMove={file => openMove([file])}
                onDelete={setDeleting}
                selectMode={selectMode} selected={selectedIds.includes(f.id)} onToggleSelect={toggleSelect} />)}
            </div>
          )}
          <p className="text-xs text-slate-600 mt-4">{visible.length} file{visible.length === 1 ? '' : 's'}{folder && <> in <span className="font-mono">/{folder}</span></>}</p>
        </>
      )}

      {renaming && (
        <RenameModal file={renaming} onClose={() => setRenaming(null)}
          onSubmit={name => renameFile(renaming, name)} />
      )}

      {newFolderOpen && (
        <Modal onClose={() => setNewFolderOpen(false)} labelledBy="New folder">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">New folder</h3>
            <input value={newFolderVal} onChange={e => setNewFolderVal(e.target.value)} placeholder="Folder name"
              onKeyDown={e => { if (e.key === 'Enter') submitFolder() }} autoFocus
              className="w-full px-4 py-3 rounded-xl bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-5" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setNewFolderOpen(false)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition">Cancel</button>
              <button onClick={submitFolder} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition">Create</button>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog title="Delete file?"
          message={`"${displayName(deleting.name)}" will be permanently removed from your vault. This can't be undone.`}
          onCancel={() => setDeleting(null)}
          onConfirm={() => { deleteFile(deleting); setDeleting(null) }} />
      )}

      {bulkDeleting && (
        <ConfirmDialog title={`Delete ${selectedIds.length} file${selectedIds.length === 1 ? '' : 's'}?`}
          message="The selected files will be permanently removed from your vault. This can't be undone."
          confirmLabel="Delete all"
          onCancel={() => setBulkDeleting(false)}
          onConfirm={() => { deleteFiles(selectedFiles); setBulkDeleting(false); exitSelectMode() }} />
      )}

      {moving && (
        <Modal onClose={() => setMoving(null)} labelledBy="Move files">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Move {moving.length} file{moving.length === 1 ? '' : 's'}</h3>
            <p className="text-sm text-slate-500 mb-4">Pick a destination folder.</p>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-800 mb-5">
              <label className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${moveDest === '' ? 'bg-blue-950/50' : 'hover:bg-slate-800/60'}`}>
                <input type="radio" name="moveDest" checked={moveDest === ''} onChange={() => setMoveDest('')} className="accent-blue-500" />
                <Home size={16} className="text-slate-400" />
                <span className="text-sm font-semibold text-white">Vault root</span>
              </label>
              {allFolders.map(f => (
                <label key={f} className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-t border-slate-800/60 transition ${moveDest === f ? 'bg-blue-950/50' : 'hover:bg-slate-800/60'}`}>
                  <input type="radio" name="moveDest" checked={moveDest === f} onChange={() => setMoveDest(f)} className="accent-blue-500" />
                  <Folder size={16} className="text-blue-400 shrink-0" />
                  <span className="text-sm text-slate-200 font-mono truncate">/{f}</span>
                </label>
              ))}
              {allFolders.length === 0 && (
                <p className="px-4 py-3 text-sm text-slate-500">No folders yet — create one with the New folder button.</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setMoving(null)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition">Cancel</button>
              <button onClick={confirmMove} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition">Move here</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
