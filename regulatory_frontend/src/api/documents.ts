import client from './client'
import type { Document, DocumentCreate, DocumentUpdate } from '@/types'

const BASE = '/api/v1/documents'

export const documentsApi = {
  list: () => client.get<Document[]>(BASE).then(r => r.data),
  listByType: (type: string) => client.get<Document[]>(`${BASE}/type/${type}`).then(r => r.data),
  get: (id: number) => client.get<Document>(`${BASE}/${id}`).then(r => r.data),

  /** Upload a .docx file — sends multipart/form-data */
  upload: (file: File, title: string, docType: string, author: string) => {
    const form = new FormData()
    form.append('file', file)
    form.append('title', title)
    form.append('doc_type', docType)
    form.append('author', author)
    return client.post<Document>(`${BASE}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  create: (data: DocumentCreate) => client.post<Document>(BASE, data).then(r => r.data),
  update: (id: number, data: DocumentUpdate, updatedBy = 'system') =>
    client.patch<Document>(`${BASE}/${id}`, data, { params: { updated_by: updatedBy } }).then(r => r.data),
  delete: (id: number) => client.delete(`${BASE}/${id}`),
}
