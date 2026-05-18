import { useState } from 'react'
import { useDocuments, useUpdateDocument } from '@/hooks/useDocuments'
import { usePendingChanges, useReviewChange } from '@/hooks/useChanges'
import { useVersions, useCreateConsolidatedVersion } from '@/hooks/useVersions'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/store/authStore'
import type { DocumentStatus } from '@/types'

export function AdminPage() {
  const { data: documents = [], isLoading } = useDocuments()
  const { user } = useAuthStore()
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null)

  if (isLoading) return <div style={styles.center}><Spinner size={36} /></div>

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Admin Panel</h1>
      <p style={styles.subtitle}>Review and resolve pending changes, manage document status, generate consolidated versions.</p>

      <div style={styles.layout}>
        {/* Document list */}
        <div style={styles.docList}>
          <h3 style={styles.sectionTitle}>Documents</h3>
          {documents.map(doc => (
            <div
              key={doc.id}
              style={{ ...styles.docItem, background: selectedDocId === doc.id ? '#eff6ff' : '#f8fafc' }}
              onClick={() => setSelectedDocId(doc.id)}
            >
              <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                <Badge label={doc.doc_type} variant={doc.doc_type} />
                <Badge label={doc.status} variant={doc.status} />
              </div>
              <p style={styles.docName}>{doc.title}</p>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div style={styles.detail}>
          {selectedDocId
            ? <AdminDocDetail docId={selectedDocId} adminUser={user} />
            : <p style={styles.placeholder}>Select a document to manage</p>
          }
        </div>
      </div>
    </div>
  )
}

function AdminDocDetail({ docId, adminUser }: { docId: number; adminUser: string }) {
  const { data: changes = [], isLoading: loadingChanges } = usePendingChanges(docId)
  const { data: versions = [], isLoading: loadingVersions } = useVersions(docId)
  const reviewChange = useReviewChange(docId)
  const createConsolidated = useCreateConsolidatedVersion(docId)
  const updateDoc = useUpdateDocument(docId)

  const STATUS_OPTIONS: DocumentStatus[] = ['draft', 'under_review', 'approved', 'rejected']

  const latestVersion = versions.length > 0 ? versions[versions.length - 1] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Status control */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Document Status</h4>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map(s => (
            <Button
              key={s}
              size="sm"
              variant="secondary"
              onClick={() => updateDoc.mutate({ data: { status: s } })}
              disabled={updateDoc.isPending}
            >
              Set: {s.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Pending changes */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Pending Changes ({changes.length})</h4>
        {loadingChanges && <Spinner />}
        {!loadingChanges && changes.length === 0 && <p style={styles.empty}>No pending changes.</p>}
        {changes.map(c => (
          <div key={c.id} style={styles.changeCard}>
            <div style={styles.changeHeader}>
              <Badge label={c.change_type} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>{c.author}</span>
              {c.paragraph_id && <span style={{ fontSize: 11, color: '#64748b' }}>on {c.paragraph_id}</span>}
            </div>
            {c.original_text && <p style={styles.del}>- {c.original_text}</p>}
            {c.new_text && <p style={styles.ins}>+ {c.new_text}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button
                size="sm"
                onClick={() => reviewChange.mutate({ id: c.id, data: { status: 'accepted', reviewed_by: adminUser } })}
                disabled={reviewChange.isPending}
              >
                ✓ Accept
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => reviewChange.mutate({ id: c.id, data: { status: 'rejected', reviewed_by: adminUser } })}
                disabled={reviewChange.isPending}
              >
                ✗ Reject
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Consolidated version */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Generate Consolidated Version</h4>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
          Creates a clean snapshot of the current document content after all accepted changes.
        </p>
        <Button
          size="sm"
          onClick={() => {
            if (!latestVersion) return
            createConsolidated.mutate({
              document_id: docId,
              content: latestVersion.content,
              created_by: adminUser,
            })
          }}
          disabled={createConsolidated.isPending || !latestVersion}
        >
          {createConsolidated.isPending ? 'Generating…' : '📄 Generate Consolidated Version'}
        </Button>
        {loadingVersions && <Spinner />}
        {!loadingVersions && versions.length > 0 && (
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
            Latest: v{versions[versions.length - 1].version_number}
          </p>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { maxWidth: 1100, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 24 },
  layout: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 },
  docList: { display: 'flex', flexDirection: 'column' as const, gap: 8 },
  docItem: { borderRadius: 8, padding: 12, border: '1px solid #e2e8f0', cursor: 'pointer' },
  docName: { fontSize: 13, fontWeight: 500, color: '#1e293b', margin: 0 },
  detail: { background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 24 },
  placeholder: { color: '#94a3b8', fontSize: 14, textAlign: 'center' as const, padding: 40 },
  section: { paddingBottom: 20, borderBottom: '1px solid #f1f5f9' },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 12 },
  changeCard: { background: '#f8fafc', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0', marginBottom: 8 },
  changeHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  del: { fontFamily: 'monospace', fontSize: 12, color: '#dc2626', background: '#fee2e2', padding: '2px 6px', borderRadius: 4, margin: '2px 0' },
  ins: { fontFamily: 'monospace', fontSize: 12, color: '#16a34a', background: '#dcfce7', padding: '2px 6px', borderRadius: 4, margin: '2px 0' },
  empty: { color: '#94a3b8', fontSize: 13, padding: 12 },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 },
}
