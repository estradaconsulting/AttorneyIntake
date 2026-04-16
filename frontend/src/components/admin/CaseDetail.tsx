import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { getAdminCase, updateCaseStatus } from '../../services/adminApi'
import type { AdminCaseDetail, CaseDocumentModel } from '../../types/admin'
import { CaseStatus, NoticeTypeLabels, OwnerTypeLabels, PropertyLocationLabels, DocumentTypeLabels } from '../../types/intake'
import StatusBadge, { STATUS_CONFIG } from './StatusBadge'

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

function fmt(dateStr: string | null | undefined) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function fmtMoney(val: number | undefined | null) {
  if (val == null) return '--'
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

function fmtBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="bg-[#1e2840] px-4 py-2.5 text-sm font-semibold text-white">{title}</div>
      <div className="p-4 text-sm">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-5 gap-2 border-b border-gray-50 py-1.5 last:border-0">
      <span className="col-span-2 text-xs text-gray-500">{label}</span>
      <span className="col-span-3 text-xs font-medium text-gray-800">{value ?? '--'}</span>
    </div>
  )
}

const ALL_STATUSES = Object.entries(STATUS_CONFIG).map(([val, cfg]) => ({
  value: Number(val) as CaseStatus,
  label: cfg.label,
}))

function isPreviewablePdf(doc: CaseDocumentModel) {
  return doc.originalFileName.toLowerCase().endsWith('.pdf')
}

function resolvePreviewUrl(doc: CaseDocumentModel) {
  return `/sample-documents/${encodeURIComponent(doc.originalFileName)}`
}

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [caseData, setCaseData] = useState<AdminCaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusSuccess, setStatusSuccess] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus | null>(null)
  const [previewDoc, setPreviewDoc] = useState<CaseDocumentModel | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!id) return
    getAdminCase(Number(id))
      .then(data => {
        setCaseData(data)
        setSelectedStatus(data.status)
      })
      .catch(() => setError('Could not load this case. It may not exist or the API is unavailable.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleStatusUpdate = async () => {
    if (!caseData || selectedStatus === null || selectedStatus === caseData.status) return
    setStatusUpdating(true)
    try {
      await updateCaseStatus(caseData.id, selectedStatus)
      setCaseData(prev => (prev ? { ...prev, status: selectedStatus } : prev))
      setStatusSuccess(true)
      setTimeout(() => setStatusSuccess(false), 3000)
    } catch {
      setError('Failed to update status. Please try again.')
    } finally {
      setStatusUpdating(false)
    }
  }

  useEffect(() => {
    if (!previewDoc || !canvasRef.current) return

    let cancelled = false
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) {
      setPreviewError('Preview canvas is unavailable in this browser.')
      return
    }

    setPreviewLoading(true)
    setPreviewError(null)

    const renderPreview = async () => {
      try {
        const pdf = await getDocument(resolvePreviewUrl(previewDoc)).promise
        const page = await pdf.getPage(1)
        const viewport = page.getViewport({ scale: 1.25 })

        if (cancelled) {
          await pdf.destroy()
          return
        }

        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise

        await pdf.destroy()
      } catch {
        if (!cancelled) {
          setPreviewError('Could not render this PDF preview in-app.')
        }
      } finally {
        if (!cancelled) setPreviewLoading(false)
      }
    }

    void renderPreview()

    return () => {
      cancelled = true
    }
  }, [previewDoc])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-400">Loading case...</div>
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50">
        <div className="text-sm text-red-500">{error ?? 'Case not found.'}</div>
        <button onClick={() => navigate('/admin')} className="text-sm text-[#1e3a5f] underline">
          Back to Dashboard
        </button>
      </div>
    )
  }

  const c = caseData

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1e2840] px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">Staff</span>
            <div>
              <div className="text-base font-bold text-white">Hogan4Eviction - Staff Portal</div>
              <div className="text-xs text-[#b8c4b0]">Law Office of Thomas M. Hogan</div>
            </div>
          </div>
          <button onClick={() => navigate('/admin')} className="text-xs text-[#b8c4b0] transition-colors hover:text-white">
            Back to All Cases
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-5 px-6 py-8">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-3">
                <span className="font-mono text-xl font-bold text-[#1e3a5f]">{c.referenceNumber}</span>
                <StatusBadge status={c.status} size="md" />
              </div>
              <div className="space-x-4 text-xs text-gray-500">
                <span>Created: {fmt(c.createdAt)}</span>
                {c.submittedAt && <span>Submitted: {fmt(c.submittedAt)}</span>}
              </div>
              {c.propertyOwner && (
                <div className="mt-2 text-sm text-gray-700">
                  <span className="font-medium">{c.propertyOwner.name}</span>
                  {c.propertyOwner.phone && <span className="ml-3 text-gray-500">{c.propertyOwner.phone}</span>}
                  {c.propertyOwner.email && <span className="ml-3 text-gray-500">{c.propertyOwner.email}</span>}
                </div>
              )}
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              <select
                value={selectedStatus ?? c.status}
                onChange={event => setSelectedStatus(Number(event.target.value) as CaseStatus)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              >
                {ALL_STATUSES.map(statusOption => (
                  <option key={statusOption.value} value={statusOption.value}>
                    {statusOption.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={statusUpdating || selectedStatus === c.status}
                className="rounded-md bg-[#1e3a5f] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#162d4a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {statusUpdating ? 'Saving...' : 'Update'}
              </button>
              {statusSuccess && <span className="text-xs font-medium text-green-600">Saved</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {c.propertyOwner && (
            <SectionCard title="Property Owner">
              <Row label="Name" value={c.propertyOwner.name} />
              <Row label="Address" value={c.propertyOwner.address} />
              <Row label="Phone" value={c.propertyOwner.phone} />
              {c.propertyOwner.alternatePhone && <Row label="Alt Phone" value={c.propertyOwner.alternatePhone} />}
              <Row label="Email" value={c.propertyOwner.email} />
              {c.propertyOwner.fax && <Row label="Fax" value={c.propertyOwner.fax} />}
              {c.propertyOwner.ownerTypes?.length > 0 && (
                <Row label="Owner Type(s)" value={c.propertyOwner.ownerTypes.map(type => OwnerTypeLabels[type] ?? type).join(', ')} />
              )}
              {c.propertyOwner.trusteeName && <Row label="Trustee Name" value={c.propertyOwner.trusteeName} />}
            </SectionCard>
          )}

          {c.propertyManager && (
            <SectionCard title="Property Manager">
              {c.propertyManager.name && <Row label="Name" value={c.propertyManager.name} />}
              {c.propertyManager.company && <Row label="Company" value={c.propertyManager.company} />}
              {c.propertyManager.address && <Row label="Address" value={c.propertyManager.address} />}
              {c.propertyManager.phone && <Row label="Phone" value={c.propertyManager.phone} />}
              {c.propertyManager.email && <Row label="Email" value={c.propertyManager.email} />}
              {c.propertyManager.fax && <Row label="Fax" value={c.propertyManager.fax} />}
            </SectionCard>
          )}
        </div>

        {c.property && (
          <SectionCard title="Property & Tenants">
            <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
              <div>
                <Row label="Address" value={c.property.address} />
                {c.property.gateCode && <Row label="Gate Code" value={c.property.gateCode} />}
                <Row label="Location" value={PropertyLocationLabels[c.property.location] ?? c.property.location} />
                <Row label="Type" value={[c.property.isResidential && 'Residential', c.property.isCommercial && 'Commercial'].filter(Boolean).join(' / ')} />
                <Row
                  label="Agreement"
                  value={
                    c.property.hasWrittenAgreement
                      ? 'Written lease'
                      : c.property.isVerbalOnly
                        ? 'Verbal only'
                        : c.property.noAgreement
                          ? 'No agreement'
                          : '--'
                  }
                />
                <Row label="Lease term" value={c.property.isTermLease ? 'Fixed term' : c.property.isMonthToMonth ? 'Month-to-month' : '--'} />
                {c.property.currentRent != null && <Row label="Current Rent" value={fmtMoney(c.property.currentRent)} />}
                {c.property.originalMonthlyRent != null && <Row label="Original Rent" value={fmtMoney(c.property.originalMonthlyRent)} />}
                {c.property.tenantMoveInDate && <Row label="Move-in Date" value={fmt(c.property.tenantMoveInDate)} />}
              </div>
              <div>
                <Row label="AB 1482 Exempt" value={c.property.hasAB1482Exemption ? 'Yes' : 'No'} />
                <Row label="Section 8 / Subsidy" value={c.property.isSection8OrSubsidy ? 'Yes' : 'No'} />
                <Row label="Foreclosure" value={c.property.isForeclosure ? 'Yes' : 'No'} />
                <Row label="Built < 15 Yrs" value={undefined} />
              </div>
            </div>

            {c.property.tenants?.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tenants ({c.property.tenants.length})
                </div>
                <div className="space-y-2">
                  {c.property.tenants.map((tenant, index) => (
                    <div key={index} className="rounded border border-gray-100 bg-gray-50 p-3">
                      <div className="text-xs font-medium text-[#1e3a5f]">{tenant.fullName}</div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                        {tenant.race && <span>Race: {tenant.race}</span>}
                        {tenant.height && <span>Height: {tenant.height}</span>}
                        {tenant.weight && <span>Weight: {tenant.weight}</span>}
                        {tenant.hairColor && <span>Hair: {tenant.hairColor}</span>}
                        {tenant.eyes && <span>Eyes: {tenant.eyes}</span>}
                        {tenant.hairstyle && <span>Hairstyle: {tenant.hairstyle}</span>}
                        {tenant.carDescription && <span>Vehicle: {tenant.carDescription}</span>}
                      </div>
                      {tenant.comments && <div className="mt-1 text-xs italic text-gray-500">{tenant.comments}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {c.evictionCause && (
            <SectionCard title="Eviction Cause">
              <Row label="Notice Served" value={c.evictionCause.noticeServed ? 'Yes' : 'No'} />
              {c.evictionCause.noticeForm && <Row label="Notice Form" value={c.evictionCause.noticeForm} />}
              {c.evictionCause.amountOwedAtNotice != null && <Row label="Amount Owed" value={fmtMoney(c.evictionCause.amountOwedAtNotice)} />}
              {c.evictionCause.balanceCalculationExplanation && <Row label="Balance Explanation" value={c.evictionCause.balanceCalculationExplanation} />}
              <Row label="Rent/Eviction Control" value={c.evictionCause.isSubjectToRentEvictionControl ? 'Yes' : 'No'} />
              {c.evictionCause.isSubjectToRentEvictionControl && (
                <Row
                  label="Complied w/ Laws"
                  value={
                    c.evictionCause.hasCompliedWithRentEvictionControlLaws
                      ? 'Yes'
                      : c.evictionCause.hasCompliedWithRentEvictionControlLaws === false
                        ? 'No'
                        : '--'
                  }
                />
              )}
              <Row label="Rent Accepted After Expiry" value={c.evictionCause.rentAcceptedAfterNoticeExpired ? 'Yes' : 'No'} />
              <Row label="Non-Military Confirmed" value={c.evictionCause.nonMilitaryConfirmed ? 'Yes' : 'No'} />
            </SectionCard>
          )}

          {c.noticeRequest && (
            <SectionCard title="Notice Request">
              <Row label="Notice Type" value={NoticeTypeLabels[c.noticeRequest.noticeType] ?? c.noticeRequest.noticeType} />
              {c.noticeRequest.otherNoticeSpecification && <Row label="Other Specification" value={c.noticeRequest.otherNoticeSpecification} />}
              <Row label="Type" value={[c.noticeRequest.isResidential && 'Residential', c.noticeRequest.isCommercial && 'Commercial'].filter(Boolean).join(' / ')} />
              {c.noticeRequest.tenantPropertyAddress && <Row label="Tenant Address" value={c.noticeRequest.tenantPropertyAddress} />}
              {c.noticeRequest.monthlyRent != null && <Row label="Monthly Rent" value={fmtMoney(c.noticeRequest.monthlyRent)} />}
              {c.noticeRequest.currentBalanceDue != null && <Row label="Balance Due" value={fmtMoney(c.noticeRequest.currentBalanceDue)} />}
              {c.noticeRequest.methodOfPayment && <Row label="Payment Method" value={c.noticeRequest.methodOfPayment} />}
              {c.noticeRequest.paymentRecipient && <Row label="Payment Recipient" value={c.noticeRequest.paymentRecipient} />}
              {c.noticeRequest.paymentDeliveryAddress && <Row label="Payment Address" value={c.noticeRequest.paymentDeliveryAddress} />}
              {c.noticeRequest.otherCausesForNotice && <Row label="Other Causes" value={c.noticeRequest.otherCausesForNotice} />}
            </SectionCard>
          )}
        </div>

        <SectionCard title={`Documents (${c.documents?.length ?? 0})`}>
          {!c.documents || c.documents.length === 0 ? (
            <p className="text-xs italic text-gray-400">No documents uploaded.</p>
          ) : (
            <div className="space-y-2">
              {c.documents.map(doc => {
                const canPreview = isPreviewablePdf(doc)

                return (
                  <div key={doc.id} className="flex items-center justify-between border-b border-gray-50 py-2 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">Doc</span>
                      <div>
                        <div className="text-xs font-medium text-gray-800">{doc.originalFileName}</div>
                        <div className="text-xs text-gray-500">
                          {DocumentTypeLabels[doc.documentType as keyof typeof DocumentTypeLabels] ?? `Type ${doc.documentType}`}
                          {' | '}
                          {fmtBytes(doc.fileSizeBytes)}
                          {' | '}
                          Uploaded {fmt(doc.uploadedAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canPreview && (
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="rounded-md border border-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-[#1e3a5f] transition-colors hover:bg-blue-50"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-6">
          <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <div>
                <div className="text-sm font-semibold text-[#1e3a5f]">{previewDoc.originalFileName}</div>
                <div className="text-xs text-gray-500">
                  Sample preview document for admin PDF integration demo
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={resolvePreviewUrl(previewDoc)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Open in New Tab
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-md bg-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#162d4a]"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-gray-100 p-6">
              <div className="flex min-h-full items-start justify-center">
                <div className="w-full max-w-3xl">
                  {previewLoading && (
                    <div className="mb-4 text-center text-sm text-gray-500">Rendering sample PDF preview...</div>
                  )}

                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <canvas ref={canvasRef} className="mx-auto max-w-full" />
                  </div>

                  {previewError && (
                    <div className="mt-4 text-center">
                      <div className="text-sm font-semibold text-[#1e3a5f]">{previewError}</div>
                      <div className="mt-2 text-xs text-gray-500">
                        Use the button below to open the sample trustee&apos;s deed in a separate tab.
                      </div>
                      <a
                        href={resolvePreviewUrl(previewDoc)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex rounded-md bg-[#1e3a5f] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#162d4a]"
                      >
                        Open Sample PDF
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
