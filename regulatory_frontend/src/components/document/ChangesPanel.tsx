import { useState } from 'react'
import { useChanges, useProposeChange, useReviewChange } from '@/hooks/useChanges'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { formatDistanceToNow } from 'date-fns'
import { parseUTC } from '@/lib/dateUtils'
import type { ChangeType } from '@/types'

interface Props { documentId: number }

export function ChangesPanel({ documentId }: Props) {
  const { data: changes = [], isLoading } = useChanges(documentId)
  const proposeChange = useProposeChange(documentId)
  const reviewChange = useReviewChange(documentId)
  const { user, isAdmin, isReviewer } = useAuthStore()
  const { selectedParagraphId, selectedText } = useUiStore()

  const [form, setForm] = useState({
    original_text: selectedText ?? '',
    new_text: '',
    change_type: 'replace' as ChangeType,
  })

  const handleSubmit = () => {
    if (!form.new_text.trim() && form.change_type !== 'delete') return
    proposeChange.mutate(
      {
        document_id: documentId,
        author: user,
        paragraph_id: selectedParagraphId ?? undefined,
        original_text: form.original_text || undefined,
        new_text: form.new_text || undefined,
        change_type: form.change_type,
      },
      { onSuccess: () => setForm({ original_text: '', new_text: '', change_type: 'replace' }) }
    )
  }

  const handleReview = (id: number, status: 'accepted' | 'rejected') => {
    reviewChange.mutate({ id, data: { status, reviewed_by: user } })
  }

  if (isLoading) return <div style={styles.center}><Spinner /></div>

  const pending = changes.filter(c => c.status === 'pending')
  const reviewed = changes.filter(c => c.status !== 'pending')

  return (
    <div style={styles.panel}>
      {/* ── Propose form ── */}
      <div style={styles.form}>
        <h4 style={styles.sectionTitle}>Propose a Change</h4>
        <select
          value={form.change_type}
          onChange={e => setForm(f => ({ ...f, change_type: e.target.value as ChangeType }))}
          style={styles.select}
        >
          <option value="replace">Replace</option>
          <option value="insert">Insert</option>
          <option value="delete">Delete</option>
        </select>
        {form.change_type !== 'insert' && (
          <textarea
            value={form.original_text}
            onChange={e => setForm(f => ({ ...f, original_text: e.target.value }))}
            placeholder="Original text to change…"
            style={styles.textarea}
            rows={2}
          />
        )}
        {form.change_type !== 'delete' && (
          <textarea
            value={form.new_text}
            onChange={e => setForm(f => ({ ...f, new_text: e.target.value }))}
            placeholder="New / replacement text…"
            style={styles.textarea}
            rows={2}
          />
        )}
        <Button size="sm" onClick={handleSubmit} disabled={proposeChange.isPending}>
          {proposeChange.isPending ? 'Submitting…' : '✏️ Propose Change'}
        </Button>
      </div>

      {/* ── Pending changes (with accept/reject) ── */}
      {pending.length > 0 && (
        <div>
          <h4 style={styles.sectionTitle}>
            Pending Review
            <span style={styles.count}>{pending.length}</span>
          </h4>
          {pending.map(c => (
            <div key={c.id} style={{ ...styles.card, borderLeft: '3px solid #f59e0b' }}>
              <div style={styles.cardHeader}>
                <Badge label={c.change_type} />
                <span style={styles.author}>{c.author}</span>
                {c.paragraph_id && <span style={styles.anchor}>📌 {c.paragraph_id}</span>}
                <span style={styles.time}>
                  {formatDistanceToNow(parseUTC(c.created_at), { addSuffix: true })}
                </span>
              </div>

              {c.original_text && (
                <div style={styles.diffBlock}>
                  <span style={styles.del}>− {c.original_text}</span>
                </div>
              )}
              {c.new_text && (
                <div style={styles.diffBlock}>
                  <span style={styles.ins}>+ {c.new_text}</span>
                </div>
              )}

              {/* Accept / Reject — visible to admins and reviewers */}
              {(isAdmin || isReviewer) && (
                <div style={styles.actions}>
                  <Button
                    size="sm"
                    onClick={() => handleReview(c.id, 'accepted')}
                    disabled={reviewChange.isPending}
                  >
                    ✓ Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleReview(c.id, 'rejected')}
                    disabled={reviewChange.isPending}
                  >
                    ✗ Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Reviewed changes ── */}
      {reviewed.length > 0 && (
        <div>
          <h4 style={styles.sectionTitle}>History</h4>
          {reviewed.map(c => (
            <div
              key={c.id}
              style={{
                ...styles.card,
                borderLeft: `3px solid ${c.status === 'accepted' ? '#16a34a' : '#dc2626'}`,
                opacity: 0.75,
              }}
            >
              <div style={styles.cardHeader}>
                <Badge label={c.status} variant={c.status as 'accepted' | 'rejected'} />
                <Badge label={c.change_type} />
                <span style={styles.author}>{c.author}</span>
                {c.paragraph_id && <span style={styles.anchor}>📌 {c.paragraph_id}</span>}
                <span style={styles.time}>
                  {formatDistanceToNow(parseUTC(c.created_at), { addSuffix: true })}
                </span>
              </div>
              {c.original_text && (
                <div style={styles.diffBlock}><span style={styles.del}>− {c.original_text}</span></div>
              )}
              {c.new_text && (
                <div style={styles.diffBlock}><span style={styles.ins}>+ {c.new_text}</span></div>
              )}
              {c.reviewed_by && (
                <p style={styles.reviewer}>Reviewed by {c.reviewed_by}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {changes.length === 0 && (
        <p style={styles.empty}>No changes proposed yet.</p>
      )}
    </div>
  )
}

const styles = {
  panel: { display: 'flex', flexDirection: 'column' as const, gap: 16, overflowY: 'auto' as const },
  center: { display: 'flex', justifyContent: 'center', padding: 24 },
  form: {
    display: 'flex', flexDirection: 'column' as const, gap: 8,
    padding: '0 0 14px', borderBottom: '1px solid #e2e8f0',
  },
  sectionTitle: {
    fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const,
    letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
  },
  count: {
    background: '#f59e0b', color: '#fff', borderRadius: 9999,
    fontSize: 10, fontWeight: 700, padding: '1px 6px',
  },
  select: { padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 },
  textarea: {
    width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0',
    fontSize: 13, resize: 'vertical' as const, fontFamily: 'inherit',
  },
  card: {
    background: '#f8fafc', borderRadius: 8, padding: 12,
    border: '1px solid #e2e8f0', marginBottom: 8,
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const, marginBottom: 8 },
  author: { fontSize: 12, fontWeight: 600, color: '#1e293b' },
  anchor: { fontSize: 11, color: '#2563eb' },
  time: { fontSize: 11, color: '#94a3b8', marginLeft: 'auto' },
  diffBlock: {
    fontFamily: 'monospace', fontSize: 12, background: '#f1f5f9',
    borderRadius: 4, padding: '4px 8px', marginBottom: 4,
  },
  del: { color: '#dc2626' },
  ins: { color: '#16a34a' },
  actions: { display: 'flex', gap: 8, marginTop: 10 },
  reviewer: { fontSize: 11, color: '#64748b', marginTop: 6 },
  empty: { color: '#94a3b8', fontSize: 13, textAlign: 'center' as const, padding: 16 },
}

