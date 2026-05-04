import client from './client'
import type { Version, VersionCreate } from '@/types'

const BASE = '/api/v1/versions'

export const versionsApi = {
  list: (documentId: number) => client.get<Version[]>(`${BASE}/${documentId}`).then(r => r.data),
  consolidated: (documentId: number) => client.get<Version[]>(`${BASE}/${documentId}/consolidated`).then(r => r.data),
  create: (data: VersionCreate) => client.post<Version>(BASE, data).then(r => r.data),
  createConsolidated: (data: VersionCreate) => client.post<Version>(`${BASE}/consolidated`, data).then(r => r.data),
  restore: (versionId: number, restoredBy: string) =>
    client.post<Version>(`${BASE}/${versionId}/restore`, null, { params: { restored_by: restoredBy } }).then(r => r.data),
}
