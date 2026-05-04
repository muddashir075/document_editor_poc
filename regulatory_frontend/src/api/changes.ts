import client from './client'
import type { Change, ChangeCreate, ChangeReview } from '@/types'

const BASE = '/api/v1/changes'

export const changesApi = {
  list: (documentId: number) => client.get<Change[]>(`${BASE}/${documentId}`).then(r => r.data),
  pending: (documentId: number) => client.get<Change[]>(`${BASE}/${documentId}/pending`).then(r => r.data),
  propose: (data: ChangeCreate) => client.post<Change>(BASE, data).then(r => r.data),
  review: (id: number, data: ChangeReview) => client.patch<Change>(`${BASE}/${id}/review`, data).then(r => r.data),
}
