import { CaseStatus } from '../../types/intake'

const CONFIG: Record<CaseStatus, { label: string; classes: string }> = {
  [CaseStatus.Draft]:                { label: 'Draft',            classes: 'bg-gray-100 text-gray-600 border-gray-300' },
  [CaseStatus.Submitted]:            { label: 'Submitted',        classes: 'bg-blue-50 text-blue-700 border-blue-300' },
  [CaseStatus.UnderReview]:          { label: 'Under Review',     classes: 'bg-amber-50 text-amber-700 border-amber-300' },
  [CaseStatus.PendingDocuments]:     { label: 'Pending Docs',     classes: 'bg-orange-50 text-orange-700 border-orange-300' },
  [CaseStatus.ConsultationRequired]: { label: 'Consultation',     classes: 'bg-purple-50 text-purple-700 border-purple-300' },
  [CaseStatus.Active]:               { label: 'Active',           classes: 'bg-green-50 text-green-700 border-green-300' },
  [CaseStatus.FiledWithCourt]:       { label: 'Filed w/ Court',   classes: 'bg-teal-50 text-teal-700 border-teal-300' },
  [CaseStatus.HearingScheduled]:     { label: 'Hearing Set',      classes: 'bg-indigo-50 text-indigo-700 border-indigo-300' },
  [CaseStatus.Judgment]:             { label: 'Judgment',         classes: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  [CaseStatus.Closed]:               { label: 'Closed',           classes: 'bg-slate-100 text-slate-500 border-slate-300' },
  [CaseStatus.Cancelled]:            { label: 'Cancelled',        classes: 'bg-red-50 text-red-700 border-red-300' },
}

interface Props {
  status: CaseStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const cfg = CONFIG[status] ?? { label: String(status), classes: 'bg-gray-100 text-gray-600 border-gray-300' }
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium'
  return (
    <span className={`inline-flex items-center rounded-full border ${sizeClasses} ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

export { CONFIG as STATUS_CONFIG }
