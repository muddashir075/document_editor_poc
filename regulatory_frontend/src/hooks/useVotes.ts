import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { votesApi } from '@/api/votes'
import type { VoteCreate } from '@/types'

export const useVotes = (documentId: number) =>
  useQuery({ queryKey: ['votes', documentId], queryFn: () => votesApi.list(documentId) })

export const useVoteSummary = (documentId: number) =>
  useQuery({ queryKey: ['vote-summary', documentId], queryFn: () => votesApi.summary(documentId) })

export const useCastVote = (documentId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: VoteCreate) => votesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['votes', documentId] })
      qc.invalidateQueries({ queryKey: ['vote-summary', documentId] })
    },
  })
}
