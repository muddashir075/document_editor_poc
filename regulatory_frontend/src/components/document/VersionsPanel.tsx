import { useState } from 'react'
import { useVersions, useRestoreVersion } from '@/hooks/useVersions'
import { useAuthStore } from '@/store/authStore'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatDistanceToNow } from 'date-fns'
import { parseUTC } from '@/lib/dateUtils'
import type { Version } from '@/types'

interface Props { documentId: number }

export function VersionsPanel({ documentId }: Props) {
  const { data: versions = [], isLoading, isFetching } = useVersions(documentId)
  const restoreVersion = useRestoreVersion(documentId)
  const { user, isAdmin } = useAuthStore()

  // Which version card is expanded (shows diff + preview)
  const [expanded, setExpanded] = useState<number | null>(null)
  // Which version is shown in the full-screen modal
  const [preview, setPreview] = useState<Version | null>(null)

  if (isLoading) return <div style={styles.center}><Spinner /></div>

  const sorted = [...versions].reverse() // newest first

  const handleRestore = (v: Version) => {
    if (!confirm(`Restore v${v.version_number} as the current document? This will create a new version snapshot.`)) return
    restoreVersion.mutate({ versionId: v.id, restoredBy: user })
  }

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <h4 style={styles.sectionTitle}>
          Version History
          <span style={styles.count}>{versions.length}</span>
        </h4>
        {isFetching && !isLoading && <Spinner size={14} />}
      </div>

      {versions.length === 0 && (
        <div style={styles.emptyBox}>
          <span style={{ fontSize: 28 }}>📄</span>
          <p style={styles.emptyTitle}>No versions yet</p>
          <p style={styles.emptyHint}>
            Versions are created automatically when a change is accepted or when you save edits.
          </p>
        </div>
      )}

      {/* Version list */}
      <div style={styles.list}>
        {sorted.map((v, idx) => {
          const isOpen = expanded === v.id
          const isLatest = idx === 0

          return (
            <div
              key={v.id}
              style={{
                ...styles.item,
                background: isOpen ? '#eff6ff' : '#f8fafc',
                borderColor: isOpen ? '#93c5fd' : '#e2e8f0',
              }}
            >
              {/* Row header — click to expand diff */}
              <div style={styles.itemHeader} onClick={() => setExpanded(isOpen ? null : v.id)}>
                <span style={styles.vNum}>v{v.version_number}</span>
                {isLatest && <Badge label="latest" variant="approved" />}
                {v.is_consolidated === 1 && <Badge label="consolidated" variant="standard" />}
                <span style={styles.by}>by {v.created_by}</span>
                <span style={styles.time}>
                  {formatDistanceToNow(parseUTC(v.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Action buttons — always visible */}
              <div style={styles.actions}>
                {/* All roles: view document at this version */}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPreview(v)}
                >
                  👁 View
                </Button>

                {/* Admin only: restore this version */}
                {isAdmin && !isLatest && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleRestore(v)}
                    disabled={restoreVersion.isPending}
                    style={{ borderColor: '#f59e0b', color: '#92400e', background: '#fffbeb' }}
                  >
                    {restoreVersion.isPending ? '…' : '↩ Restore'}
                  </Button>
                )}
              </div>

              {/* Expanded diff section */}
              {isOpen && (
                <div style={styles.detail}>
                  {v.diff ? (
                    <>
                      <p style={styles.label}>Diff from previous version</p>
                      <pre style={styles.diffPre}>{v.diff}</pre>
                    </>
                  ) : (
                    <p style={styles.noDiff}>Initial version — no diff available.</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Full-screen version preview modal */}
      {preview && (
        <VersionPreviewModal
          version={preview}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  )
}

// ── Version preview modal ────────────────────────────────────────────────────
function VersionPreviewModal({ version, onClose }: { version: Version; onClose: () => void }) {
  return (
    <div style={modal.overlay} onClick={onClose}>
      <div style={modal.box} onClick={e => e.stopPropagation()}>
        <div style={modal.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={modal.title}>v{version.version_number}</span>
            {version.is_consolidated === 1 && <Badge label="consolidated" variant="standard" />}
            <span style={modal.meta}>by {version.created_by}</span>
            <span style={modal.meta}>
              {formatDistanceToNow(parseUTC(version.created_at), { addSuffix: true })}
            </span>
          </div>
          <button onClick={onClose} style={modal.closeBtn} aria-label="Close">✕</button>
        </div>

        <div
          style={modal.content}
          className="doc-viewer"
          dangerouslySetInnerHTML={{ __html: version.content }}
        />
      </div>
    </div>
  )
}

const styles = {
  panel: { display: 'flex', flexDirection: 'column' as const, gap: 10, overflowY: 'auto' as const },
  center: { display: 'flex', justifyContent: 'center', padding: 24 },
  header: { display: 'flex', alignItems: 'center', gap: 8 },
  sectionTitle: {
    fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const,
    letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, margin: 0,
  },
  count: {
    background: '#2563eb', color: '#fff', borderRadius: 9999,
    fontSize: 10, fontWeight: 700, padding: '1px 6px',
  },
  emptyBox: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    textAlign: 'center' as const, padding: '24px 16px', gap: 6,
  },
  emptyTitle: { fontSize: 14, fontWeight: 600, color: '#475569', margin: 0 },
  emptyHint: { fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.5 },
  list: { display: 'flex', flexDirection: 'column' as const, gap: 8 },
  item: {
    borderRadius: 8, padding: 12, border: '1px solid',
    transition: 'background 0.15s, border-color 0.15s',
  },
  itemHeader: {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const,
    cursor: 'pointer', marginBottom: 8,
  },
  vNum: { fontSize: 13, fontWeight: 700, color: '#1e293b' },
  by: { fontSize: 11, color: '#64748b' },
  time: { fontSize: 11, color: '#94a3b8', marginLeft: 'auto' },
  actions: { display: 'flex', gap: 6, flexWrap: 'wrap' as const },
  detail: { marginTop: 10, display: 'flex', flexDirection: 'column' as const, gap: 8 },
  label: { fontSize: 11, fontWeight: 600, color: '#64748b', margin: '0 0 4px' },
  noDiff: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' as const },
  diffPre: {
    fontFamily: 'monospace', fontSize: 11, background: '#1e293b', color: '#e2e8f0',
    padding: 10, borderRadius: 6, overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const,
    maxHeight: 180, overflowY: 'auto' as const,
  },
}

const modal = {
  overlay: {
    position: 'fixed' as const, inset: 0, background: 'rgba(15,23,42,0.6)',
    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  box: {
    background: '#fff', borderRadius: 12, width: '100%', maxWidth: 900,
    maxHeight: '90vh', display: 'flex', flexDirection: 'column' as const,
    boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px', borderBottom: '1px solid #e2e8f0', flexShrink: 0,
  },
  title: { fontSize: 16, fontWeight: 700, color: '#1e293b' },
  meta: { fontSize: 12, color: '#64748b' },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 16, color: '#94a3b8', padding: 4,
  },
  content: {
    flex: 1, overflowY: 'auto' as const, padding: '20px 28px',
    lineHeight: 1.8, fontSize: 14, color: '#1e293b',
  },
}
