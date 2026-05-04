import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { changesApi } from '@/api/changes'
import type { ChangeCreate, ChangeReview } from '@/types'

export const useChanges = (documentId: number) =>
  useQuery({ queryKey: ['changes', documentId], queryFn: () => changesApi.list(documentId) })

export const usePendingChanges = (documentId: number) =>
  useQuery({ queryKey: ['changes', documentId, 'pending'], queryFn: () => changesApi.pending(documentId) })

export const useProposeChange = (documentId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ChangeCreate) => changesApi.propose(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['changes', documentId] }),
  })
}

export const useReviewChange = (documentId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChangeReview }) => changesApi.review(id, data),
    onSuccess: () => {
      // Invalidate all three — changes list, document content, and version history
      qc.invalidateQueries({ queryKey: ['changes', documentId] })
      qc.invalidateQueries({ queryKey: ['document', documentId] })
      qc.invalidateQueries({ queryKey: ['versions', documentId] })
    },
  })
}
