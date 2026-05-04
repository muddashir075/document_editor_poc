// ── Enums (mirror backend) ────────────────────────────────────────────────────
export type DocumentType = 'standard' | 'matrix' | 'regulation'
export type DocumentStatus = 'draft' | 'under_review' | 'approved' | 'rejected'
export type VoteType = 'in_favor' | 'against' | 'observed'
export type ChangeStatus = 'pending' | 'accepted' | 'rejected'
export type ChangeType = 'insert' | 'delete' | 'replace'
export type UserRole = 'sgcan_admin' | 'reviewer' | 'consultation'
export type NotificationType =
  | 'pending_comment'
  | 'pending_vote'
  | 'change_accepted'
  | 'change_rejected'
  | 'new_version'

// ── Document ──────────────────────────────────────────────────────────────────
export interface Document {
  id: number
  title: string
  content: string
  doc_type: DocumentType
  status: DocumentStatus
  author: string
  file_path?: string
  original_filename?: string
  created_at: string
  updated_at: string
}

export interface DocumentCreate {
  title: string
  content: string
  doc_type: DocumentType
  status?: DocumentStatus
  author: string
  file_path?: string
  original_filename?: string
}

export interface DocumentUpdate {
  title?: string
  content?: string
  doc_type?: DocumentType
  status?: DocumentStatus
}

// ── Comment ───────────────────────────────────────────────────────────────────
export interface Comment {
  id: number
  document_id: number
  author: string
  content: string
  paragraph_id?: string
  selected_text?: string
  start_offset?: number
  end_offset?: number
  is_resolved: boolean
  resolved_by?: string
  resolved_at?: string
  created_at: string
}

export interface CommentCreate {
  document_id: number
  author: string
  content: string
  paragraph_id?: string
  selected_text?: string
  start_offset?: number
  end_offset?: number
}

// ── Vote ──────────────────────────────────────────────────────────────────────
export interface Vote {
  id: number
  document_id: number
  user: string
  vote_type: VoteType
  paragraph_id?: string
  justification?: string
  created_at: string
}

export interface VoteCreate {
  document_id: number
  user: string
  vote_type: VoteType
  paragraph_id?: string
  justification?: string
}

export interface VoteSummary {
  in_favor: number
  against: number
  observed: number
  total: number
}

// ── Version ───────────────────────────────────────────────────────────────────
export interface Version {
  id: number
  document_id: number
  version_number: number
  content: string
  diff?: string
  is_consolidated: number
  created_by: string
  created_at: string
}

export interface VersionCreate {
  document_id: number
  content: string
  created_by: string
}

// ── Change ────────────────────────────────────────────────────────────────────
export interface Change {
  id: number
  document_id: number
  author: string
  paragraph_id?: string
  original_text?: string
  new_text?: string
  change_type: ChangeType
  status: ChangeStatus
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
}

export interface ChangeCreate {
  document_id: number
  author: string
  paragraph_id?: string
  original_text?: string
  new_text?: string
  change_type: ChangeType
}

export interface ChangeReview {
  status: ChangeStatus
  reviewed_by: string
}

// ── Notification ──────────────────────────────────────────────────────────────
export interface Notification {
  id: number
  document_id: number
  recipient: string
  notification_type: NotificationType
  message: string
  is_read: boolean
  created_at: string
}

// ── WebSocket messages ────────────────────────────────────────────────────────
export interface WsMessage {
  type: 'cursor_move' | 'text_change' | 'comment_added' | 'vote_cast' | 'user_joined' | 'user_left' | 'error'
  user?: string
  document_id?: number
  paragraph_id?: string
  content?: string
  [key: string]: unknown
}
