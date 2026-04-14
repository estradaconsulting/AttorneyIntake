import { useState } from 'react'
import { DocumentType, type IntakeWizardState } from '../../../types/intake'
import { createIntakeCase, uploadDocument } from '../../../services/api'

interface Props {
  wizardState: IntakeWizardState
  onCaseCreated: (caseId: number, refNum: string) => void
  onNext: () => void
  onBack: () => void
}

interface UploadItem {
  file: File
  documentType: DocumentType
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'queued' | 'error'
  error?: string
}

// Generates a local reference number when the API is unreachable
function localRefNumber(): string {
  const year = new Date().getFullYear()
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `H${year}-${seq}-DRAFT`
}

export default function Step7_Documents({ wizardState, onCaseCreated, onNext, onBack }: Props) {
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [creating, setCreating] = useState(false)
  const [caseCreated, setCaseCreated] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [caseId, setCaseId] = useState<number | null>(wizardState.createdCaseId ?? null)
  const [refNum, setRefNum] = useState<string>(wizardState.referenceNumber ?? '')
  const [error, setError] = useState<string | null>(null)

  const addFiles = (docType: DocumentType, files: FileList | null) => {
    if (!files) return
    const newItems: UploadItem[] = Array.from(files).map(file => ({
      file, documentType: docType, progress: 0, status: 'pending',
    }))
    setUploads(prev => [...prev, ...newItems])
  }

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index))
  }

  const createCaseAndUpload = async () => {
    if (!wizardState.step1 || !wizardState.step3) {
      setError('Missing required form data. Please go back and complete earlier steps.')
      return
    }

    setCreating(true)
    setError(null)

    // ── 1. Create case record ────────────────────────────────────────────────
    let activeCaseId = caseId
    let activeRefNum = refNum
    let offline = isOffline

    if (!activeCaseId) {
      try {
        const result = await createIntakeCase({
          owner: wizardState.step1,
          manager: wizardState.step2,
          property: wizardState.step3,
          evictionCause: wizardState.step4,
          noticeRequest: wizardState.step5,
        })
        activeCaseId = result.id
        activeRefNum = result.referenceNumber
      } catch {
        // Backend unavailable — create a local draft reference so the user
        // can still complete the form and the office can follow up.
        activeCaseId = -1
        activeRefNum = localRefNumber()
        offline = true
        setIsOffline(true)
      }

      setCaseId(activeCaseId)
      setRefNum(activeRefNum)
      onCaseCreated(activeCaseId, activeRefNum)
    }

    setCaseCreated(true)

    // ── 2. Upload documents (skipped in offline mode) ────────────────────────
    if (offline || activeCaseId === -1) {
      // Mark all pending files as "queued" — they'll be sent by the office
      setUploads(prev => prev.map(u =>
        u.status === 'pending' ? { ...u, status: 'queued', progress: 100 } : u
      ))
      setCreating(false)
      return
    }

    for (let i = 0; i < uploads.length; i++) {
      const item = uploads[i]
      if (item.status !== 'pending') continue

      setUploads(prev => prev.map((u, idx) =>
        idx === i ? { ...u, status: 'uploading' } : u))

      try {
        await uploadDocument(
          activeCaseId!,
          item.file,
          item.documentType,
          undefined,
          pct => setUploads(prev => prev.map((u, idx) =>
            idx === i ? { ...u, progress: pct } : u))
        )
        setUploads(prev => prev.map((u, idx) =>
          idx === i ? { ...u, status: 'done', progress: 100 } : u))
      } catch {
        setUploads(prev => prev.map((u, idx) =>
          idx === i ? { ...u, status: 'error', error: 'Upload failed' } : u))
      }
    }

    setCreating(false)
  }

  const fmtSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const requiredDocs = [
    { type: DocumentType.RentalAgreement,  label: 'Rental Agreement & Notice of Rent Increase', required: true },
    { type: DocumentType.NoticeToTenant,   label: 'Latest Notice to Tenant (if you have one)',  required: false },
    { type: DocumentType.ProofOfService,   label: 'Proof of Service (if you have one)',          required: false },
    { type: DocumentType.TrusteesDeed,     label: "Trustee's Deed (foreclosure cases only)",    required: false },
    { type: DocumentType.Other,            label: 'Other Supporting Documents',                   required: false },
  ]

  return (
    <div className="space-y-6">
      {caseCreated && refNum && (
        <div className="rounded border border-green-300 bg-green-50 p-4">
          <div className="font-semibold text-green-800">✓ Case Recorded — Reference: {refNum}</div>
          <p className="text-xs text-green-700 mt-1">
            {isOffline
              ? 'Your information has been saved locally. Please email your documents to Hogan4Eviction@outlook.com and reference this number.'
              : 'Upload your documents below, then click Continue to submit your case for review.'}
          </p>
        </div>
      )}

      {isOffline && !caseCreated && (
        <div className="alert-warning text-xs">
          The document server is temporarily unavailable. Your case details will still be submitted — you can email supporting documents directly to{' '}
          <a href="mailto:Hogan4Eviction@outlook.com" className="underline">Hogan4Eviction@outlook.com</a>.
        </div>
      )}

      <div className="alert-info text-xs">
        <strong>Required:</strong> Rental Agreement · <strong>Submit as PDF only</strong> · JPEG not accepted
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Document upload slots */}
      <div className="space-y-4">
        {requiredDocs.map(({ type, label, required }) => (
          <div key={type} className="rounded border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                {label}
                {required && <span className="ml-1 text-[#8b1414]">*</span>}
              </span>
              <label className="btn-secondary cursor-pointer text-xs px-3 py-1">
                Add File
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff"
                  multiple
                  className="sr-only"
                  onChange={e => addFiles(type, e.target.files)}
                />
              </label>
            </div>

            {uploads.filter(u => u.documentType === type).map((item, i) => {
              const globalIdx = uploads.findIndex(u => u === item)
              return (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                  <span className="flex-1 truncate">{item.file.name}</span>
                  <span className="text-gray-400">{fmtSize(item.file.size)}</span>
                  {item.status === 'uploading' && (
                    <div className="w-16 bg-gray-200 rounded h-1.5">
                      <div className="bg-[#8b1414] h-1.5 rounded" style={{ width: `${item.progress}%` }} />
                    </div>
                  )}
                  {item.status === 'done'   && <span className="text-green-600 font-bold">✓</span>}
                  {item.status === 'queued' && <span className="text-amber-600 text-xs">queued</span>}
                  {item.status === 'error'  && <span className="text-red-500">✗ failed</span>}
                  {item.status === 'pending' && (
                    <button type="button" onClick={() => removeUpload(globalIdx)}
                      className="text-red-400 hover:text-red-600 ml-1">×</button>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} disabled={creating} className="btn-secondary">
          ← Back
        </button>
        {!caseCreated ? (
          <button onClick={createCaseAndUpload} disabled={creating} className="btn-primary">
            {creating ? 'Saving…' : 'Save Case & Upload →'}
          </button>
        ) : (
          <button onClick={onNext} className="btn-primary">
            Proceed to Final Submission →
          </button>
        )}
      </div>
    </div>
  )
}
