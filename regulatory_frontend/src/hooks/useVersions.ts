import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { versionsApi } from '@/api/versions'
import type { VersionCreate } from '@/types'

export const useVersions = (documentId: number) =>
  useQuery({ queryKey: ['versions', documentId], queryFn: () => versionsApi.list(documentId) })

export const useConsolidatedVersions = (documentId: number) =>
  useQuery({ queryKey: ['versions', documentId, 'consolidated'], queryFn: () => versionsApi.consolidated(documentId) })

export const useCreateConsolidatedVersion = (documentId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: VersionCreate) => versionsApi.createConsolidated(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['versions', documentId] })
      qc.invalidateQueries({ queryKey: ['document', documentId] })
    },
  })
}

export const useRestoreVersion = (documentId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ versionId, restoredBy }: { versionId: number; restoredBy: string }) =>
      versionsApi.restore(versionId, restoredBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['versions', documentId] })
      qc.invalidateQueries({ queryKey: ['document', documentId] })
    },
  })
}
