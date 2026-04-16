import axios from 'axios'
import type { CaseStatus } from '../types/intake'
import type { AdminCaseSummary, AdminCaseDetail } from '../types/admin'

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({ baseURL })

export async function getAdminCases(): Promise<AdminCaseSummary[]> {
  const response = await api.get<AdminCaseSummary[]>('/intakecases')
  return response.data
}

export async function getAdminCase(id: number): Promise<AdminCaseDetail> {
  const response = await api.get<AdminCaseDetail>(`/intakecases/${id}`)
  return response.data
}

/** PATCH /api/intakecases/{id}/status — body is a plain integer (CaseStatus enum value) */
export async function updateCaseStatus(id: number, status: CaseStatus): Promise<void> {
  await api.patch(`/intakecases/${id}/status`, status, {
    headers: { 'Content-Type': 'application/json' },
  })
}
