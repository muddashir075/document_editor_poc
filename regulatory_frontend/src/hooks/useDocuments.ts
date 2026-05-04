import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '@/api/documents'
import type { DocumentCreate, DocumentUpdate } from '@/types'

export const useDocuments = () =>
  useQuery({ queryKey: ['documents'], queryFn: documentsApi.list })

export const useDocumentsByType = (type: string) =>
  useQuery({ queryKey: ['documents', 'type', type], queryFn: () => documentsApi.listByType(type) })

export const useDocument = (id: number) =>
  useQuery({ queryKey: ['document', id], queryFn: () => documentsApi.get(id), enabled: !!id })

export const useUploadDocument = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, title, docType, author }: { file: File; title: string; docType: string; author: string }) =>
      documentsApi.upload(file, title, docType, author),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export const useCreateDocument = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: DocumentCreate) => documentsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export const useUpdateDocument = (id: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ data, updatedBy }: { data: DocumentUpdate; updatedBy?: string }) =>
      documentsApi.update(id, data, updatedBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      qc.invalidateQueries({ queryKey: ['document', id] })
      qc.invalidateQueries({ queryKey: ['versions', id] })
    },
  })
}

export const useDeleteDocument = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => documentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}
