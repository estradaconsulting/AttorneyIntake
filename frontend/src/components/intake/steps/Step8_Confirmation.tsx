import { useState } from 'react'
import { submitCase } from '../../../services/api'
import type { IntakeWizardState } from '../../../types/intake'

interface Props {
  wizardState: IntakeWizardState
  onBack: () => void
}

export default function Step8_Confirmation({ wizardState, onBack }: Props) {
  const [signed, setSigned] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!signed) { setError('Please check the agreement box to proceed.'); return }
    if (!wizardState.createdCaseId) { setError('No case ID found. Please go back to the documents step.'); return }

    setSubmitting(true)
    setError(null)
    try {
      await submitCase(wizardState.createdCaseId)
      setSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="text-5xl">⚖️</div>
        <h2 className="text-2xl font-serif font-bold text-[#1e3a5f]">
          Case Submitted Successfully
        </h2>
        <p className="text-lg font-semibold text-[#8b1414]">
          Reference Number: {wizardState.referenceNumber}
        </p>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Your intake has been received. The Law Office of Thomas M. Hogan will review your case
          and contact you at the email/phone provided.
        </p>
        <div className="rounded border border-[#b8c4b0] bg-[#d4ddd0] p-4 text-sm text-gray-700 max-w-md mx-auto text-left">
          <p className="font-semibold mb-2">What happens next?</p>
          <ul className="space-y-1 text-xs list-disc list-inside">
            <li>Staff will review your submission within 1–2 business days</li>
            <li>You may be contacted if additional information or documents are needed</li>
            <li>In some cases, a consultation with the attorney is required before filing</li>
            <li>Fees are due in advance of court filing</li>
          </ul>
        </div>
        <div className="text-xs text-gray-500 mt-4">
          Questions? Call <strong>(916) 929-2255</strong> or email{' '}
          <a href="mailto:Hogan4eviction@outlook.com" className="text-[#8b1414] hover:underline">
            Hogan4eviction@outlook.com
          </a>
          {' '}and include your reference number in the subject line.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded border border-gray-200 overflow-hidden">
        <div className="bg-[#1e2840] text-white px-4 py-3 font-semibold text-sm">
          Case Summary
        </div>
        <div className="divide-y divide-gray-100 text-sm">
          <div className="px-4 py-2.5 grid grid-cols-2">
            <span className="text-gray-500">Property Owner</span>
            <span className="font-medium">{wizardState.step1?.name ?? '—'}</span>
          </div>
          <div className="px-4 py-2.5 grid grid-cols-2">
            <span className="text-gray-500">Property Address</span>
            <span className="font-medium">{wizardState.step3?.address ?? '—'}</span>
          </div>
          <div className="px-4 py-2.5 grid grid-cols-2">
            <span className="text-gray-500">Tenants</span>
            <span className="font-medium">
              {wizardState.step3?.tenants?.map(t => t.fullName).join(', ') ?? '—'}
            </span>
          </div>
          <div className="px-4 py-2.5 grid grid-cols-2">
            <span className="text-gray-500">Estimated Total Fee</span>
            <span className="font-bold text-[#8b1414]">
              {wizardState.feeEstimate
                ? `$${wizardState.feeEstimate.estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : 'See fee schedule'}
            </span>
          </div>
          {wizardState.referenceNumber && (
            <div className="px-4 py-2.5 grid grid-cols-2">
              <span className="text-gray-500">Reference #</span>
              <span className="font-semibold text-[#1e3a5f]">{wizardState.referenceNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Terms & signature */}
      <div className="rounded border border-gray-200 p-4 bg-gray-50 text-xs text-gray-700 space-y-2">
        <h3 className="font-bold text-sm text-[#1e3a5f]">Further Notice & Agreement</h3>
        <ol className="list-decimal list-inside space-y-1.5">
          <li>Attorney does not warrant time required to prepare, process or complete any legal action.</li>
          <li>Attorney fees charged may not equal fees that may or may not be awarded by a court.</li>
          <li>Clients must provide accurate information and have followed applicable laws to obtain the best results.</li>
          <li>All properties with Federally backed loans or subject to Federal Programs (e.g. Sect. 8) require a 30-day notice to pay rent.</li>
          <li>Acceptance of rent after ANY notice expires voids the notice and you must start over.</li>
          <li>Services are for recovery of possession of real property and do not include collection or money judgments.</li>
          <li>There will be a <strong>$300 processing fee</strong> for any case cancelled prior to filing. No refunds after case is submitted to court.</li>
        </ol>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={signed}
          onChange={e => { setSigned(e.target.checked); setError(null) }}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#8b1414]"
        />
        <span className="text-sm text-gray-700">
          By checking this box, I affirm that the information given is true and all terms,
          including the attached fee schedule, are understood and agreed. I understand that
          incorrect or incomplete information may result in delay or loss of case.
        </span>
      </label>

      {error && <div className="alert-error">{error}</div>}

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} disabled={submitting} className="btn-secondary">
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !signed}
          className="btn-primary"
        >
          {submitting ? 'Submitting…' : 'Submit Case to Law Office'}
        </button>
      </div>
    </div>
  )
}
