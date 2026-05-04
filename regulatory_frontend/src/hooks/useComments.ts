import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { commentsApi } from '@/api/comments'
import type { CommentCreate } from '@/types'

export const useComments = (documentId: number) =>
  useQuery({ queryKey: ['comments', documentId], queryFn: () => commentsApi.list(documentId) })

export const useCreateComment = (documentId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CommentCreate) => commentsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', documentId] }),
  })
}

export const useResolveComment = (documentId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, resolvedBy }: { id: number; resolvedBy: string }) =>
      commentsApi.resolve(id, resolvedBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', documentId] }),
  })
}
