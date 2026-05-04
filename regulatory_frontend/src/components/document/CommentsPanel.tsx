import { useState } from 'react'
import { useComments, useCreateComment, useResolveComment } from '@/hooks/useComments'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatDistanceToNow } from 'date-fns'
import { parseUTC } from '@/lib/dateUtils'

interface Props { documentId: number }

export function CommentsPanel({ documentId }: Props) {
  const { data: comments = [], isLoading } = useComments(documentId)
  const createComment = useCreateComment(documentId)
  const resolveComment = useResolveComment(documentId)
  const { user, isConsultation } = useAuthStore()
  const { selectedParagraphId, selectedText, selectionOffsets, setSelection } = useUiStore()
  const [text, setText] = useState('')

  const handleSubmit = () => {
    if (!text.trim()) return
    createComment.mutate({
      document_id: documentId,
      author: user,
      content: text.trim(),
      paragraph_id: selectedParagraphId ?? undefined,
      selected_text: selectedText ?? undefined,
      start_offset: selectionOffsets?.start,
      end_offset: selectionOffsets?.end,
    }, {
      onSuccess: () => {
        setText('')
        setSelection(null, null)
      },
    })
  }

  if (isLoading) return <div style={styles.center}><Spinner /></div>

  return (
    <div style={styles.panel}>
      {isConsultation && (
        <div style={styles.readOnlyBanner}>
          👁 Read-only — Consultation accounts cannot post comments.
        </div>
      )}
      {!isConsultation && (
      <div style={styles.compose}>
        {selectedText && (
          <div style={styles.quote}>
            <span style={{ fontSize: 11, color: '#64748b' }}>Commenting on:</span>
            <blockquote style={styles.blockquote}>"{selectedText}"</blockquote>
          </div>
        )}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={selectedParagraphId ? `Comment on ${selectedParagraphId}…` : 'Add a comment…'}
          style={styles.textarea}
          rows={3}
        />
        <Button size="sm" onClick={handleSubmit} disabled={createComment.isPending || !text.trim()}>
          {createComment.isPending ? 'Posting…' : 'Post Comment'}
        </Button>
      </div>
      )}

      <div style={styles.list}>
        {comments.length === 0 && <p style={styles.empty}>No comments yet.</p>}
        {comments.map(c => (
          <div key={c.id} style={{ ...styles.card, opacity: c.is_resolved ? 0.55 : 1 }}>
            {c.paragraph_id && (
              <span style={styles.anchor}>📌 {c.paragraph_id}</span>
            )}
            {c.selected_text && (
              <blockquote style={styles.blockquote}>"{c.selected_text}"</blockquote>
            )}
            <p style={styles.body}>{c.content}</p>
            <div style={styles.meta}>
              <strong style={{ fontSize: 12 }}>{c.author}</strong>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                {formatDistanceToNow(parseUTC(c.created_at), { addSuffix: true })}
              </span>
              {c.is_resolved
                ? <span style={{ fontSize: 11, color: '#16a34a' }}>✓ Resolved</span>
                : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => resolveComment.mutate({ id: c.id, resolvedBy: user })}
                  >
                    Resolve
                  </Button>
                )
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  panel: { display: 'flex', flexDirection: 'column' as const, gap: 12, height: '100%', overflowY: 'auto' as const },
  compose: { display: 'flex', flexDirection: 'column' as const, gap: 8, padding: '0 0 12px', borderBottom: '1px solid #e2e8f0' },
  quote: { display: 'flex', flexDirection: 'column' as const, gap: 2 },
  blockquote: { borderLeft: '3px solid #2563eb', paddingLeft: 8, fontSize: 12, color: '#475569', margin: 0 },
  textarea: { width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical' as const, fontFamily: 'inherit' },
  list: { display: 'flex', flexDirection: 'column' as const, gap: 10 },
  card: { background: '#f8fafc', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0' },
  anchor: { fontSize: 11, color: '#2563eb', fontWeight: 600 },
  body: { fontSize: 13, margin: '6px 0', color: '#334155' },
  meta: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const },
  empty: { color: '#94a3b8', fontSize: 13, textAlign: 'center' as const, padding: 16 },
  center: { display: 'flex', justifyContent: 'center', padding: 24 },
  readOnlyBanner: {
    background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8,
    padding: '8px 12px', fontSize: 12, color: '#0369a1',
  },
}

