import { useParams } from 'react-router-dom'
import { useDocument } from '@/hooks/useDocuments'
import { useCollaboration } from '@/hooks/useCollaboration'
import { useUiStore } from '@/store/uiStore'
import { DocumentViewer } from '@/components/document/DocumentViewer'
import { CommentsPanel } from '@/components/document/CommentsPanel'
import { VotesPanel } from '@/components/document/VotesPanel'
import { ChangesPanel } from '@/components/document/ChangesPanel'
import { VersionsPanel } from '@/components/document/VersionsPanel'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'

const PANELS = [
  { id: 'comments', label: '💬 Comments' },
  { id: 'votes',    label: '🗳️ Votes' },
  { id: 'changes',  label: '✏️ Changes' },
  { id: 'versions', label: '📜 Versions' },
]

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const docId = Number(id)
  const { data: doc, isLoading } = useDocument(docId)
  const { activePanel, setActivePanel, onlineUsers } = useUiStore()
  const { send } = useCollaboration(docId)

  if (isLoading) return <div style={styles.center}><Spinner size={36} /></div>
  if (!doc) return <div style={styles.center}><p>Document not found.</p></div>

  return (
    <div style={styles.page}>
      {/* Document header */}
      <div style={styles.docHeader}>
        <div>
          <h2 style={styles.docTitle}>{doc.title}</h2>
          <div style={styles.docMeta}>
            <Badge label={doc.doc_type} variant={doc.doc_type} />
            <Badge label={doc.status} variant={doc.status} />
            <span style={styles.metaText}>by {doc.author}</span>
            {doc.original_filename && (
              <span style={{ fontSize: 12, color: '#2563eb' }}>📄 {doc.original_filename}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main layout: viewer + side panel */}
      <div style={styles.layout}>
        {/* Document viewer */}
        <div style={styles.viewer}>
          <DocumentViewer document={doc} onlineUsers={onlineUsers} />
        </div>

        {/* Side panel */}
        <div style={styles.sidebar}>
          <div style={styles.tabs}>
            {PANELS.map(p => (
              <button
                key={p.id}
                onClick={() => setActivePanel(p.id)}
                style={{
                  ...styles.tab,
                  borderBottom: activePanel === p.id ? '2px solid #2563eb' : '2px solid transparent',
                  color: activePanel === p.id ? '#2563eb' : '#64748b',
                  fontWeight: activePanel === p.id ? 600 : 400,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={styles.panelContent}>
            {activePanel === 'comments' && <CommentsPanel documentId={docId} />}
            {activePanel === 'votes'    && <VotesPanel    documentId={docId} />}
            {activePanel === 'changes'  && <ChangesPanel  documentId={docId} />}
            {activePanel === 'versions' && <VersionsPanel documentId={docId} />}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { maxWidth: 1400, margin: '0 auto' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 },
  docHeader: { marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' },
  docTitle: { fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 8 },
  docMeta: { display: 'flex', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 12, color: '#64748b' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, height: 'calc(100vh - 180px)' },
  viewer: { overflowY: 'auto' as const, background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 24 },
  sidebar: { display: 'flex', flexDirection: 'column' as const, background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' },
  tabs: { display: 'flex', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  tab: { flex: 1, padding: '10px 4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, transition: 'color 0.15s' },
  panelContent: { flex: 1, overflowY: 'auto' as const, padding: 16 },
}
