import { useState } from 'react'
import {
  DocumentType,
  type IntakeWizardState,
  type PendingDocumentUpload,
} from '../../../types/intake'

interface Props {
  wizardState: IntakeWizardState
  onPrepared: (refNum: string, documents: PendingDocumentUpload[]) => void
  onNext: () => void
  onBack: () => void
}

interface UploadItem {
  file: File
  documentType: DocumentType
}

function localRefNumber(): string {
  const year = new Date().getFullYear()
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `H${year}-${seq}-DRAFT`
}

export default function Step7_Documents({ wizardState, onPrepared, onNext, onBack }: Props) {
  const [uploads, setUploads] = useState<UploadItem[]>(
    () =>
      wizardState.documents?.map(doc => ({
        file: doc.file,
        documentType: doc.documentType,
      })) ?? []
  )
  const [preparing, setPreparing] = useState(false)
  const [prepared, setPrepared] = useState(Boolean(wizardState.referenceNumber))
  const [refNum, setRefNum] = useState<string>(wizardState.referenceNumber ?? '')
  const [error, setError] = useState<string | null>(null)

  const addFiles = (docType: DocumentType, files: FileList | null) => {
    if (!files) return

    const newItems: UploadItem[] = Array.from(files).map(file => ({
      file,
      documentType: docType,
    }))

    setUploads(prev => [...prev, ...newItems])
  }

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index))
  }

  const prepareSubmission = () => {
    if (!wizardState.step1 || !wizardState.step3) {
      setError('Missing required form data. Please go back and complete earlier steps.')
      return
    }

    setPreparing(true)
    setError(null)

    const activeRefNum = refNum || localRefNumber()
    const documents = uploads.map(item => ({
      file: item.file,
      documentType: item.documentType,
    }))

    setRefNum(activeRefNum)
    setPrepared(true)
    onPrepared(activeRefNum, documents)
    setPreparing(false)
  }

  const fmtSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const requiredDocs = [
    { type: DocumentType.RentalAgreement, label: 'Rental Agreement & Notice of Rent Increase', required: true },
    { type: DocumentType.NoticeToTenant, label: 'Latest Notice to Tenant (if you have one)', required: false },
    { type: DocumentType.ProofOfService, label: 'Proof of Service (if you have one)', required: false },
    { type: DocumentType.TrusteesDeed, label: "Trustee's Deed (foreclosure cases only)", required: false },
    { type: DocumentType.Other, label: 'Other Supporting Documents', required: false },
  ]

  return (
    <div className="space-y-6">
      {prepared && refNum && (
        <div className="rounded border border-green-300 bg-green-50 p-4">
          <div className="font-semibold text-green-800">Ready to Submit — Reference: {refNum}</div>
          <p className="mt-1 text-xs text-green-700">
            Your intake details and documents are ready. Click the submit button on the next step to send your case to the office.
          </p>
        </div>
      )}

      <div className="alert-info text-xs">
        <strong>Recommended:</strong> attach supporting documents now so they are bundled into the local submission package.
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="space-y-4">
        {requiredDocs.map(({ type, label, required }) => (
          <div key={type} className="rounded border border-gray-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                {label}
                {required && <span className="ml-1 text-[#8b1414]">*</span>}
              </span>
              <label className="btn-secondary cursor-pointer px-3 py-1 text-xs">
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
                <div key={i} className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                  <span className="flex-1 truncate">{item.file.name}</span>
                  <span className="text-gray-400">{fmtSize(item.file.size)}</span>
                  <span className="font-bold text-green-600">ready</span>
                  <button
                    type="button"
                    onClick={() => removeUpload(globalIdx)}
                    className="ml-1 text-red-400 hover:text-red-600"
                  >
                    x
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} disabled={preparing} className="btn-secondary">
          Back
        </button>
        {!prepared ? (
          <button onClick={prepareSubmission} disabled={preparing} className="btn-primary">
            {preparing ? 'Preparing...' : 'Prepare Submission'}
          </button>
        ) : (
          <button onClick={onNext} className="btn-primary">
            Proceed to Final Review
          </button>
        )}
      </div>
    </div>
  )
}
