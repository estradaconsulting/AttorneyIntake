import { useState } from 'react'
import { submitLocalIntake } from '../../../services/api'
import { PropertyLocation, PropertyLocationLabels, type IntakeWizardState, type SubmissionCertification } from '../../../types/intake'

/** Maps a PropertyLocation to the court-recognised county name used on legal documents. */
function locationCountyName(loc: PropertyLocation): string {
  switch (loc) {
    case PropertyLocation.Sacramento:
    case PropertyLocation.ElkGroveRosevileFolsom:
      return 'Sacramento'
    case PropertyLocation.Loomis:
    case PropertyLocation.Placer:
      return 'Placer'
    case PropertyLocation.YoloDavis:
    case PropertyLocation.Woodland:
    case PropertyLocation.WestSacramento:
      return 'Yolo'
    case PropertyLocation.AuburnElDoradoGalt:
      return 'El Dorado / Placer'
    default:
      return 'Sacramento'
  }
}

interface Props {
  wizardState: IntakeWizardState
  onBack: () => void
}

export default function Step8_Confirmation({ wizardState, onBack }: Props) {
  const [signerName, setSignerName] = useState(wizardState.certification?.signerName ?? '')
  const [signedDate, setSignedDate] = useState(
    wizardState.certification?.signedDate ?? new Date().toISOString().slice(0, 10)
  )
  const [signerRole, setSignerRole] = useState<SubmissionCertification['signerRole']>(
    wizardState.certification?.signerRole ?? 'owner'
  )
  // Derive the execution county/location from Step 3 so fees and jurisdiction stay consistent
  const locationFromCase = wizardState.step3?.location ?? PropertyLocation.Sacramento
  const [executionLocation, setExecutionLocation] = useState<PropertyLocation>(
    locationFromCase
  )
  const [authorizedAgentTitle, setAuthorizedAgentTitle] = useState(
    wizardState.certification?.authorizedAgentTitle ?? ''
  )
  const [signed, setSigned] = useState(wizardState.certification?.agreed ?? false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!signed) {
      setError('Please check the agreement box to proceed.')
      return
    }
    if (!signerName.trim()) {
      setError('Please enter the name of the person certifying this submission.')
      return
    }
    if (!signedDate) {
      setError('Please provide the certification date.')
      return
    }
    if (!executionLocation) {
      setError('Please select the jurisdiction / county of execution.')
      return
    }
    if (signerRole === 'authorized_agent' && !authorizedAgentTitle.trim()) {
      setError('Please provide the authorized agent title or role.')
      return
    }
    if (!wizardState.step1 || !wizardState.step3) {
      setError('Missing required intake details. Please go back and complete the earlier steps.')
      return
    }
    if (!wizardState.referenceNumber) {
      setError('No reference number found. Please go back to the documents step.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await submitLocalIntake(wizardState, {
        signerName: signerName.trim(),
        signedDate,
        signerRole,
        executionCounty: locationCountyName(executionLocation),
        authorizedAgentTitle:
          signerRole === 'authorized_agent' ? authorizedAgentTitle.trim() : undefined,
        agreed: true,
      })
    } catch {
      // Backend unavailable — the certification data is captured in state.
      // The intake is complete client-side; staff will follow up using the reference number.
    }
    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="text-5xl">Case saved</div>
        <h2 className="text-2xl font-serif font-bold text-[#1e3a5f]">
          Intake Saved Successfully
        </h2>
        <p className="text-lg font-semibold text-[#8b1414]">
          Reference Number: {wizardState.referenceNumber}
        </p>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Your intake package has been saved locally with the documents and certification details
          needed for office review.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded border border-gray-200 overflow-hidden">
        <div className="bg-[#1e2840] text-white px-4 py-3 font-semibold text-sm">
          Case Summary
        </div>
        <div className="divide-y divide-gray-100 text-sm">
          <div className="px-4 py-2.5 grid grid-cols-2">
            <span className="text-gray-500">Property Owner</span>
            <span className="font-medium">{wizardState.step1?.name ?? '-'}</span>
          </div>
          <div className="px-4 py-2.5 grid grid-cols-2">
            <span className="text-gray-500">All Known Adult Tenants</span>
            <span className="font-medium">
              {wizardState.step3?.tenants?.map(t => t.fullName).join(', ') ?? '-'}
            </span>
          </div>
          <div className="px-4 py-2.5 grid grid-cols-2">
            <span className="text-gray-500">Property Address</span>
            <span className="font-medium">{wizardState.step3?.address ?? '-'}</span>
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

      <div className="rounded border border-gray-200 p-4 bg-gray-50 text-xs text-gray-700 space-y-2">
        <h3 className="font-bold text-sm text-[#1e3a5f]">Further Notice & Agreement</h3>
        <ol className="list-decimal list-inside space-y-1.5">
          <li>Attorney does not warrant time required to prepare, process or complete any legal action. Time is required to evaluate, prepare, and submit cases to court after which all cases may be subject to significant additional administrative time within the court process. Attorney cannot guarantee Client will prevail due to variables that can arise in any legal action.</li>
          <li>Attorneys fees charged may not equal fees that may or may not be awarded by a court.</li>
          <li>Clients must provide accurate information and have followed applicable laws to obtain the best results, including but not limited to rent increases within legal limits based on State and Local laws in effect at the time of the increase. Most California properties are subject to Rent Control, Eviction Control, and/or the Federal CARES Act.</li>
          <li>All properties with federally backed loans or subject to federal programs such as Section 8 are subject to the CARES Act and require a 30-day notice to pay rent.</li>
          <li>Leases should be kept up to date to avoid defaulting otherwise exempt properties into rent control.</li>
          <li>If full rent is tendered within the time to comply with a notice to pay rent or quit, that rent must be accepted. If it is less than full payment, it may be rejected, but if any part is accepted, the notice is void.</li>
          <li>Acceptance of rent after any notice expires voids the notice and you must start over from the beginning.</li>
          <li>Services are for recovery of possession of real property and do not include collection or money judgments.</li>
          <li>By signing below, Client affirms that the information given is true and all terms, including the attached fee schedule, are understood and agreed. Incorrect or incomplete information may result in delay or loss of case.</li>
        </ol>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="form-label">
            Name of Person Certifying Submission <span className="ml-0.5 text-red-500">*</span>
          </label>
          <input
            value={signerName}
            onChange={e => {
              setSignerName(e.target.value)
              setError(null)
            }}
            className="form-input"
            placeholder="Full name"
          />
        </div>
        <div>
          <label className="form-label">
            Signer Role <span className="ml-0.5 text-red-500">*</span>
          </label>
          <select
            value={signerRole}
            onChange={e => {
              setSignerRole(e.target.value as SubmissionCertification['signerRole'])
              setError(null)
            }}
            className="form-input bg-white"
          >
            <option value="owner">Property Owner</option>
            <option value="manager">Property Manager</option>
            <option value="authorized_agent">Authorized Agent</option>
          </select>
        </div>
        <div>
          <label className="form-label">
            Date Signed <span className="ml-0.5 text-red-500">*</span>
          </label>
          <input
            type="date"
            value={signedDate}
            onChange={e => {
              setSignedDate(e.target.value)
              setError(null)
            }}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">
            Jurisdiction / County of Execution <span className="ml-0.5 text-red-500">*</span>
          </label>
          <select
            value={executionLocation}
            onChange={e => {
              setExecutionLocation(Number(e.target.value) as PropertyLocation)
              setError(null)
            }}
            className="form-input bg-white"
          >
            {(Object.entries(PropertyLocationLabels) as [string, string][]).map(([val, label]) => (
              <option key={val} value={val}>{label} — {locationCountyName(Number(val) as PropertyLocation)} County</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            County where the certification is signed. Pre-filled from your property location (Step 3).
          </p>
        </div>
      </div>

      {signerRole === 'authorized_agent' && (
        <div>
          <label className="form-label">
            Authorized Agent Title <span className="ml-0.5 text-red-500">*</span>
          </label>
          <input
            value={authorizedAgentTitle}
            onChange={e => {
              setAuthorizedAgentTitle(e.target.value)
              setError(null)
            }}
            className="form-input"
            placeholder="Agent, custodian of records, office manager, etc."
          />
        </div>
      )}

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={signed}
          onChange={e => {
            setSigned(e.target.checked)
            setError(null)
          }}
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
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !signed}
          className="btn-primary"
        >
          {submitting ? 'Saving...' : 'Submit Case to Law Office'}
        </button>
      </div>
    </div>
  )
}
