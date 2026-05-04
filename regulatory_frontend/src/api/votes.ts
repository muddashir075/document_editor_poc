import client from './client'
import type { Vote, VoteCreate, VoteSummary } from '@/types'

const BASE = '/api/v1/votes'

export const votesApi = {
  list: (documentId: number) => client.get<Vote[]>(`${BASE}/${documentId}`).then(r => r.data),
  summary: (documentId: number) => client.get<VoteSummary>(`${BASE}/${documentId}/summary`).then(r => r.data),
  listByParagraph: (documentId: number, paragraphId: string) =>
    client.get<Vote[]>(`${BASE}/${documentId}/paragraph/${paragraphId}`).then(r => r.data),
  create: (data: VoteCreate) => client.post<Vote>(BASE, data).then(r => r.data),
}
