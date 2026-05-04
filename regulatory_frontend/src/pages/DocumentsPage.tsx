import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocuments, useUploadDocument, useDeleteDocument } from '@/hooks/useDocuments'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { formatDistanceToNow } from 'date-fns'
import { useAuthStore } from '@/store/authStore'
import type { DocumentType } from '@/types'

const DOC_TYPES: DocumentType[] = ['regulation', 'standard', 'matrix']

export function DocumentsPage() {
  const navigate = useNavigate()
  const { data: documents = [], isLoading } = useDocuments()
  const uploadDoc = useUploadDocument()
  const deleteDoc = useDeleteDocument()
  const { user, isAdmin } = useAuthStore()

  const [showUpload, setShowUpload] = useState(false)
  const [filter, setFilter] = useState<DocumentType | 'all'>('all')
  const [dragOver, setDragOver] = useState(false)

  const [form, setForm] = useState({ title: '', doc_type: 'regulation' as DocumentType })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = filter === 'all' ? documents : documents.filter(d => d.doc_type === filter)

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.docx')) {
      alert('Only .docx files are supported.')
      return
    }
    setSelectedFile(file)
    // Auto-fill title from filename if empty
    if (!form.title) {
      setForm(f => ({ ...f, title: file.name.replace(/\.docx$/i, '') }))
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [form.title])

  const handleUpload = () => {
    if (!selectedFile || !form.title.trim()) return
    uploadDoc.mutate(
      { file: selectedFile, title: form.title.trim(), docType: form.doc_type, author: user },
      {
        onSuccess: (doc) => {
          setShowUpload(false)
          setSelectedFile(null)
          setForm({ title: '', doc_type: 'regulation' })
          navigate(`/documents/${doc.id}`)
        },
      }
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Documents</h1>
          <p style={styles.subtitle}>Standards, matrices, and regulations</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setShowUpload(s => !s); setSelectedFile(null) }}>
            {showUpload ? 'Cancel' : '⬆ Upload Document'}
          </Button>
        )}
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div style={styles.uploadPanel}>
          <h3 style={styles.uploadTitle}>Upload Word Document</h3>
          <p style={styles.uploadHint}>
            Upload a <strong>.docx</strong> file. The content will be extracted and stored for collaborative editing.
            The original file is saved to <code>D:\doc_media</code>.
          </p>

          {/* Drop zone */}
          <div
            style={{ ...styles.dropZone, borderColor: dragOver ? '#2563eb' : selectedFile ? '#16a34a' : '#cbd5e1', background: dragOver ? '#eff6ff' : selectedFile ? '#f0fdf4' : '#f8fafc' }}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {selectedFile ? (
              <div style={styles.fileSelected}>
                <span style={styles.fileIcon}>📄</span>
                <div>
                  <p style={styles.fileName}>{selectedFile.name}</p>
                  <p style={styles.fileSize}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  style={styles.removeFile}
                  onClick={e => { e.stopPropagation(); setSelectedFile(null) }}
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div style={styles.dropPrompt}>
                <span style={{ fontSize: 32 }}>📂</span>
                <p style={{ fontSize: 14, color: '#475569', margin: '8px 0 4px' }}>
                  Drag & drop a .docx file here, or click to browse
                </p>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>Only Word documents (.docx) are accepted</p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div style={styles.metaRow}>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Document title"
              style={{ ...styles.input, flex: 2 }}
            />
            <select
              value={form.doc_type}
              onChange={e => setForm(f => ({ ...f, doc_type: e.target.value as DocumentType }))}
              style={{ ...styles.select, flex: 1 }}
            >
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !form.title.trim() || uploadDoc.isPending}
          >
            {uploadDoc.isPending ? (
              <><Spinner size={14} /> Uploading & extracting…</>
            ) : (
              '⬆ Upload & Open'
            )}
          </Button>

          {uploadDoc.isError && (
            <p style={styles.error}>
              Upload failed. Make sure the file is a valid .docx and the server is running.
            </p>
          )}
        </div>
      )}

      {/* Type filters */}
      <div style={styles.filters}>
        {(['all', ...DOC_TYPES] as const).map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{ ...styles.filterBtn, background: filter === t ? '#2563eb' : '#e2e8f0', color: filter === t ? '#fff' : '#475569' }}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading && <div style={styles.center}><Spinner /></div>}

      <div style={styles.grid}>
        {filtered.map(doc => (
          <div key={doc.id} style={styles.card} onClick={() => navigate(`/documents/${doc.id}`)}>
            <div style={styles.cardTop}>
              <Badge label={doc.doc_type} variant={doc.doc_type} />
              <Badge label={doc.status} variant={doc.status} />
            </div>
            <h3 style={styles.cardTitle}>{doc.title}</h3>
            {doc.original_filename && (
              <p style={styles.filename}>📄 {doc.original_filename}</p>
            )}
            <p style={styles.cardPreview}>
              {doc.content ? doc.content.slice(0, 100) + '…' : 'No content extracted.'}
            </p>
            <div style={styles.cardFooter}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                by {doc.author} · {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
              </span>
              <button
                style={styles.deleteBtn}
                onClick={e => { e.stopPropagation(); if (isAdmin) deleteDoc.mutate(doc.id) }}
                aria-label="Delete document"
                disabled={!isAdmin}
                title={isAdmin ? 'Delete document' : 'Admin only'}
              >
                🗑
              </button>
            </div>
          </div>
        ))}
        {!isLoading && filtered.length === 0 && (
          <p style={styles.empty}>No documents found. Upload a .docx to get started.</p>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { maxWidth: 1100, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 700, color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },

  uploadPanel: {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24,
    marginBottom: 28, display: 'flex', flexDirection: 'column' as const, gap: 14,
  },
  uploadTitle: { fontSize: 16, fontWeight: 600, color: '#1e293b', margin: 0 },
  uploadHint: { fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 },

  dropZone: {
    border: '2px dashed', borderRadius: 10, padding: 24, cursor: 'pointer',
    transition: 'all 0.2s', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dropPrompt: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', textAlign: 'center' as const },
  fileSelected: { display: 'flex', alignItems: 'center', gap: 12, width: '100%' },
  fileIcon: { fontSize: 32, flexShrink: 0 },
  fileName: { fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 },
  fileSize: { fontSize: 12, color: '#64748b', margin: 0 },
  removeFile: {
    marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 16, color: '#94a3b8', padding: 4,
  },

  metaRow: { display: 'flex', gap: 10 },
  input: { padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit' },
  select: { padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14 },
  error: { fontSize: 13, color: '#dc2626', background: '#fee2e2', padding: '8px 12px', borderRadius: 6 },

  filters: { display: 'flex', gap: 8, marginBottom: 20 },
  filterBtn: { padding: '4px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18, cursor: 'pointer' },
  cardTop: { display: 'flex', gap: 6, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 4 },
  filename: { fontSize: 11, color: '#2563eb', marginBottom: 6, margin: '0 0 6px' },
  cardPreview: { fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 12 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.5 },
  center: { display: 'flex', justifyContent: 'center', padding: 40 },
  empty: { color: '#94a3b8', fontSize: 14, gridColumn: '1/-1', textAlign: 'center' as const, padding: 40 },
}
