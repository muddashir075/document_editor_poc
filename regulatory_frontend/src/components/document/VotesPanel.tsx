import { useState } from 'react'
import { useVotes, useVoteSummary, useCastVote } from '@/hooks/useVotes'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import type { VoteType } from '@/types'

interface Props { documentId: number }

const VOTE_OPTIONS: { type: VoteType; label: string; emoji: string }[] = [
  { type: 'in_favor', label: 'In Favor', emoji: '✅' },
  { type: 'against',  label: 'Against',  emoji: '❌' },
  { type: 'observed', label: 'Observed', emoji: '👁️' },
]

export function VotesPanel({ documentId }: Props) {
  const { data: summary, isLoading: loadingSummary } = useVoteSummary(documentId)
  const { data: votes = [], isLoading: loadingVotes } = useVotes(documentId)
  const castVote = useCastVote(documentId)
  const { user, isConsultation } = useAuthStore()
  const { selectedParagraphId } = useUiStore()
  const [justification, setJustification] = useState('')

  const handleVote = (voteType: VoteType) => {
    castVote.mutate({
      document_id: documentId,
      user,
      vote_type: voteType,
      paragraph_id: selectedParagraphId ?? undefined,
      justification: justification.trim() || undefined,
    }, { onSuccess: () => setJustification('') })
  }

  if (loadingSummary || loadingVotes) return <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner /></div>

  const pct = (n: number) => summary && summary.total > 0 ? Math.round((n / summary.total) * 100) : 0

  return (
    <div style={styles.panel}>
      {/* Summary */}
      {summary && (
        <div style={styles.summary}>
          <h4 style={styles.sectionTitle}>Consensus Summary</h4>
          {VOTE_OPTIONS.map(({ type, label, emoji }) => (
            <div key={type} style={styles.bar}>
              <span style={styles.barLabel}>{emoji} {label}</span>
              <div style={styles.track}>
                <div style={{ ...styles.fill, width: `${pct(summary[type])}%`, background: type === 'in_favor' ? '#16a34a' : type === 'against' ? '#dc2626' : '#0284c7' }} />
              </div>
              <span style={styles.count}>{summary[type]} ({pct(summary[type])}%)</span>
            </div>
          ))}
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Total votes: {summary.total}</p>
        </div>
      )}

      {/* Cast vote — hidden for consultation */}
      {isConsultation ? (
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#0369a1' }}>
          👁 Read-only — Consultation accounts cannot cast votes.
        </div>
      ) : (
      <div style={styles.cast}>
        <h4 style={styles.sectionTitle}>
          Cast Vote {selectedParagraphId ? `on ${selectedParagraphId}` : 'on Document'}
        </h4>
        <textarea
          value={justification}
          onChange={e => setJustification(e.target.value)}
          placeholder="Optional justification…"
          style={styles.textarea}
          rows={2}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          {VOTE_OPTIONS.map(({ type, label, emoji }) => (
            <Button
              key={type}
              size="sm"
              variant="secondary"
              onClick={() => handleVote(type)}
              disabled={castVote.isPending}
            >
              {emoji} {label}
            </Button>
          ))}
        </div>
      </div>
      )}

      {/* Vote list */}
      <div>
        <h4 style={styles.sectionTitle}>All Votes</h4>
        {votes.length === 0 && <p style={styles.empty}>No votes yet.</p>}
        {votes.map(v => (
          <div key={v.id} style={styles.voteItem}>
            <Badge label={v.vote_type} variant={v.vote_type} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{v.user}</span>
            {v.paragraph_id && <span style={{ fontSize: 11, color: '#64748b' }}>on {v.paragraph_id}</span>}
            {v.justification && <span style={{ fontSize: 11, color: '#475569' }}>— {v.justification}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  panel: { display: 'flex', flexDirection: 'column' as const, gap: 16, overflowY: 'auto' as const },
  summary: { background: '#f8fafc', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0' },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 },
  bar: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  barLabel: { fontSize: 12, width: 80, flexShrink: 0 },
  track: { flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, transition: 'width 0.3s' },
  count: { fontSize: 11, color: '#64748b', width: 70, textAlign: 'right' as const },
  cast: { display: 'flex', flexDirection: 'column' as const, gap: 8 },
  textarea: { width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical' as const, fontFamily: 'inherit' },
  voteItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' as const },
  empty: { color: '#94a3b8', fontSize: 13, textAlign: 'center' as const, padding: 12 },
}
