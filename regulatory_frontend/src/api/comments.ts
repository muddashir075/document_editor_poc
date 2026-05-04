import client from './client'
import type { Comment, CommentCreate } from '@/types'

const BASE = '/api/v1/comments'

export const commentsApi = {
  list: (documentId: number) => client.get<Comment[]>(`${BASE}/${documentId}`).then(r => r.data),
  listByParagraph: (documentId: number, paragraphId: string) =>
    client.get<Comment[]>(`${BASE}/${documentId}/paragraph/${paragraphId}`).then(r => r.data),
  create: (data: CommentCreate) => client.post<Comment>(BASE, data).then(r => r.data),
  resolve: (id: number, resolvedBy: string) =>
    client.patch<Comment>(`${BASE}/${id}/resolve`, { resolved_by: resolvedBy }).then(r => r.data),
  delete: (id: number) => client.delete(`${BASE}/${id}`),
}
