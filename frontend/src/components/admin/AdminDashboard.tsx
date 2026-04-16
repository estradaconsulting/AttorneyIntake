import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminCases } from '../../services/adminApi'
import type { AdminCaseSummary } from '../../types/admin'
import { CaseStatus } from '../../types/intake'
import StatusBadge, { STATUS_CONFIG } from './StatusBadge'

type DashboardFilter = 'all' | 'inProgress' | CaseStatus
type SortKey = 'referenceNumber' | 'ownerName' | 'propertyAddress' | 'status' | 'submittedAt' | 'documentCount'
type SortDirection = 'asc' | 'desc'

const STATUS_FILTERS = [
  { label: 'All', value: 'all' as DashboardFilter },
  { label: 'Submitted', value: CaseStatus.Submitted },
  { label: 'Under Review', value: CaseStatus.UnderReview },
  { label: 'Pending Docs', value: CaseStatus.PendingDocuments },
  { label: 'Active', value: CaseStatus.Active },
  { label: 'Filed', value: CaseStatus.FiledWithCourt },
  { label: 'Closed', value: CaseStatus.Closed },
]

const SUMMARY_CARDS = [
  { label: 'Total Cases', key: 'total', color: 'text-[#1e3a5f]', filter: 'all' as DashboardFilter },
  { label: 'New / Submitted', key: 'submitted', color: 'text-blue-600', filter: CaseStatus.Submitted },
  { label: 'In Progress', key: 'active', color: 'text-amber-600', filter: 'inProgress' as DashboardFilter },
  { label: 'Pending Docs', key: 'pending', color: 'text-orange-600', filter: CaseStatus.PendingDocuments },
] as const

function matchesFilter(status: CaseStatus, filter: DashboardFilter) {
  if (filter === 'all') return true
  if (filter === 'inProgress') {
    return status === CaseStatus.UnderReview || status === CaseStatus.Active
  }
  return status === filter
}

function formatSubmitted(dateStr: string | null) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function compareValues(a: AdminCaseSummary, b: AdminCaseSummary, key: SortKey) {
  switch (key) {
    case 'documentCount':
      return a.documentCount - b.documentCount
    case 'submittedAt':
      return new Date(a.submittedAt ?? 0).getTime() - new Date(b.submittedAt ?? 0).getTime()
    case 'status': {
      const aLabel = STATUS_CONFIG[a.status]?.label ?? String(a.status)
      const bLabel = STATUS_CONFIG[b.status]?.label ?? String(b.status)
      return aLabel.localeCompare(bLabel, undefined, { sensitivity: 'base' })
    }
    case 'referenceNumber':
    case 'ownerName':
    case 'propertyAddress':
      return (a[key] ?? '').localeCompare(b[key] ?? '', undefined, { numeric: true, sensitivity: 'base' })
    default:
      return 0
  }
}

interface SortHeaderProps {
  label: string
  sortBy: SortKey
  className?: string
  activeKey: SortKey
  direction: SortDirection
  onToggle: (key: SortKey) => void
}

function SortHeader({ label, sortBy, className = '', activeKey, direction, onToggle }: SortHeaderProps) {
  const indicator = activeKey !== sortBy ? '\u2195' : direction === 'asc' ? '\u2191' : '\u2193'

  return (
    <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${className}`}>
      <button
        type="button"
        onClick={() => onToggle(sortBy)}
        className="inline-flex items-center gap-1 text-gray-500 transition-colors hover:text-[#1e3a5f]"
      >
        <span>{label}</span>
        <span className={`text-[11px] ${activeKey === sortBy ? 'text-[#1e3a5f]' : 'text-gray-300'}`}>
          {indicator}
        </span>
      </button>
    </th>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [cases, setCases] = useState<AdminCaseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<DashboardFilter>('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('submittedAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    getAdminCases()
      .then(setCases)
      .catch(() => setError('Could not load cases. Make sure the API is running.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = cases

    if (statusFilter !== 'all') {
      list = list.filter(caseItem => matchesFilter(caseItem.status, statusFilter))
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(caseItem =>
        caseItem.referenceNumber.toLowerCase().includes(q) ||
        caseItem.ownerName.toLowerCase().includes(q) ||
        caseItem.propertyAddress.toLowerCase().includes(q)
      )
    }

    return [...list].sort((a, b) => {
      const result = compareValues(a, b, sortKey)
      return sortDirection === 'asc' ? result : -result
    })
  }, [cases, search, sortDirection, sortKey, statusFilter])

  const counts = useMemo(() => ({
    total: cases.length,
    submitted: cases.filter(caseItem => caseItem.status === CaseStatus.Submitted).length,
    active: cases.filter(caseItem => caseItem.status === CaseStatus.Active || caseItem.status === CaseStatus.UnderReview).length,
    pending: cases.filter(caseItem => caseItem.status === CaseStatus.PendingDocuments).length,
  }), [cases])

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc')
      return
    }

    setSortKey(nextKey)
    setSortDirection(nextKey === 'submittedAt' || nextKey === 'documentCount' ? 'desc' : 'asc')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1e2840] px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">Staff</span>
            <div>
              <div className="text-base font-bold text-white">Hogan4Eviction - Staff Portal</div>
              <div className="text-xs text-[#b8c4b0]">Law Office of Thomas M. Hogan</div>
            </div>
          </div>
          <a href="/" className="text-xs text-[#b8c4b0] transition-colors hover:text-white">
            Back to Client Intake Form
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-[#1e3a5f]">Case Management</h1>
          <p className="mt-1 text-sm text-gray-500">All submitted intakes and their current status</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SUMMARY_CARDS.map(stat => (
            <button
              key={stat.label}
              type="button"
              onClick={() => setStatusFilter(current => current === stat.filter && stat.filter !== 'all' ? 'all' : stat.filter)}
              className={`rounded-lg border px-5 py-4 text-left transition-all ${
                statusFilter === stat.filter
                  ? 'border-[#1e3a5f] bg-blue-50 shadow-sm ring-1 ring-[#1e3a5f]/10'
                  : 'border-gray-200 bg-white hover:border-[#1e3a5f]/40 hover:bg-gray-50'
              }`}
            >
              <div className={`text-2xl font-bold ${stat.color}`}>{counts[stat.key]}</div>
              <div className="mt-0.5 text-xs text-gray-500">{stat.label}</div>
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map(filterOption => (
                <button
                  key={String(filterOption.value)}
                  type="button"
                  onClick={() => setStatusFilter(filterOption.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === filterOption.value
                      ? 'bg-[#1e3a5f] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>

            <div className="ml-auto">
              <input
                type="text"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search ref #, owner, address..."
                className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-gray-400">Loading cases...</div>
          ) : error ? (
            <div className="py-16 text-center text-sm text-red-500">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              {search || statusFilter !== 'all' ? 'No cases match your filters.' : 'No cases yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <SortHeader label="Reference" sortBy="referenceNumber" activeKey={sortKey} direction={sortDirection} onToggle={toggleSort} />
                    <SortHeader label="Owner" sortBy="ownerName" activeKey={sortKey} direction={sortDirection} onToggle={toggleSort} />
                    <SortHeader label="Property" sortBy="propertyAddress" className="hidden md:table-cell" activeKey={sortKey} direction={sortDirection} onToggle={toggleSort} />
                    <SortHeader label="Status" sortBy="status" activeKey={sortKey} direction={sortDirection} onToggle={toggleSort} />
                    <SortHeader label="Submitted" sortBy="submittedAt" className="hidden sm:table-cell" activeKey={sortKey} direction={sortDirection} onToggle={toggleSort} />
                    <SortHeader label="Docs" sortBy="documentCount" className="hidden sm:table-cell text-center" activeKey={sortKey} direction={sortDirection} onToggle={toggleSort} />
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(caseItem => (
                    <tr
                      key={caseItem.id}
                      onClick={() => navigate(`/admin/cases/${caseItem.id}`)}
                      className="cursor-pointer transition-colors hover:bg-blue-50"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-[#1e3a5f]">{caseItem.referenceNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">{caseItem.ownerName || '--'}</span>
                      </td>
                      <td className="hidden max-w-xs truncate px-4 py-3 text-gray-600 md:table-cell">
                        {caseItem.propertyAddress || '--'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={caseItem.status} />
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-gray-500 sm:table-cell">
                        {formatSubmitted(caseItem.submittedAt)}
                      </td>
                      <td className="hidden px-4 py-3 text-center sm:table-cell">
                        <span className={`text-xs font-semibold ${caseItem.documentCount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {caseItem.documentCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-medium text-[#8b1414] hover:underline">View</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-3 text-right text-xs text-gray-400">
          {!loading && !error && `${filtered.length} of ${cases.length} cases`}
        </div>
      </div>
    </div>
  )
}
