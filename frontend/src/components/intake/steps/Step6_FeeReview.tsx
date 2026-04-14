import { useEffect, useState } from 'react'
import { PropertyLocation, type FeeCalculationResult, type FeeLineItem, type IntakeWizardState } from '../../../types/intake'
import { calculateFee } from '../../../services/api'

interface Props {
  wizardState: IntakeWizardState
  onNext: (feeEstimate: FeeCalculationResult) => void
  onBack: () => void
}

// ── Offline fee calculator ────────────────────────────────────────────────────
// Direct TypeScript port of backend/src/Hogan4Eviction.Core/Services/FeeCalculatorService.cs
// Keeps the form fully functional even when the API is unreachable.

interface FeeRequest {
  location: PropertyLocation
  isCommercial: boolean
  claimAmount?: number
  needsNoticePreparation: boolean
  numberOfAdditionalDefendants: number
  isForeclosure: boolean
}

function calculateFeeOffline(req: FeeRequest): FeeCalculationResult {
  const lines: FeeLineItem[] = []

  // 1. Notice preparation
  let noticeFee = 0
  if (req.needsNoticePreparation) {
    const loc = req.location
    if (loc === PropertyLocation.Sacramento) noticeFee = req.isCommercial ? 200 : 175
    else if (loc === PropertyLocation.ElkGroveRosevileFolsom) noticeFee = req.isCommercial ? 300 : 200
    else if (loc === PropertyLocation.Loomis) noticeFee = 200
    else if (loc === PropertyLocation.YoloDavis) noticeFee = req.isCommercial ? 300 : 250
    else if (loc === PropertyLocation.AuburnElDoradoGalt) noticeFee = req.isCommercial ? 300 : 250
    else if (loc === PropertyLocation.Woodland) noticeFee = req.isCommercial ? 300 : 250
    else if (loc === PropertyLocation.Placer) noticeFee = 250
    else if (loc === PropertyLocation.WestSacramento) noticeFee = 250
    else noticeFee = 175
    lines.push({ description: 'Notice Preparation & Service', amount: noticeFee, isRequired: false })
  }

  // 2. Base eviction fee
  let baseFee = 0
  let baseFeeDesc = ''
  const claim = req.claimAmount ?? 0

  if (req.isCommercial) {
    baseFee = req.location === PropertyLocation.Sacramento ? 1350 : 1500
    if (claim >= 10_000 && claim <= 25_000) baseFee += 250
    baseFeeDesc = 'Commercial Eviction Filing'
  } else if (claim > 35_000) {
    const loc = req.location
    if (loc === PropertyLocation.YoloDavis || loc === PropertyLocation.WestSacramento) baseFee = 2500
    else if (loc === PropertyLocation.Placer) baseFee = 2500
    else if (loc === PropertyLocation.AuburnElDoradoGalt) baseFee = 2500
    else baseFee = 0
    baseFeeDesc = 'Uncontested Eviction (claim > $35k)'
  } else if (claim >= 10_000) {
    const loc = req.location
    if (loc === PropertyLocation.Sacramento) baseFee = 1350
    else baseFee = 1900
    baseFeeDesc = 'Uncontested Eviction (claim $10k–$35k)'
  } else {
    const loc = req.location
    if (loc === PropertyLocation.Sacramento) baseFee = 995
    else if (loc === PropertyLocation.ElkGroveRosevileFolsom) baseFee = 1100
    else if (loc === PropertyLocation.Loomis) baseFee = 1100
    else if (loc === PropertyLocation.YoloDavis || loc === PropertyLocation.WestSacramento) baseFee = 1100
    else if (loc === PropertyLocation.AuburnElDoradoGalt) baseFee = 1350
    else if (loc === PropertyLocation.Woodland) baseFee = 1100
    else if (loc === PropertyLocation.Placer) baseFee = 1250
    else baseFee = 995
    baseFeeDesc = 'Uncontested Eviction (claim < $10k)'
  }

  if (baseFee === 0 && !req.isCommercial && claim > 35_000)
    lines.push({ description: `${baseFeeDesc} — NOT AVAILABLE for this location`, amount: 0, isRequired: false })
  else
    lines.push({ description: baseFeeDesc, amount: baseFee, isRequired: true })

  // 3. Location surcharge
  let locationSurcharge = 0
  const surchargeLocations = [PropertyLocation.YoloDavis, PropertyLocation.AuburnElDoradoGalt, PropertyLocation.WestSacramento]
  if (surchargeLocations.includes(req.location)) {
    locationSurcharge = 45
    lines.push({ description: 'Court Appearance Surcharge (Yolo / Auburn / El Dorado)', amount: 45, isRequired: true })
  }

  // 4. Additional defendants
  let additionalDefendantFee = 0
  if (req.numberOfAdditionalDefendants > 0) {
    const perDef = req.location === PropertyLocation.Sacramento ? 35
                 : req.location === PropertyLocation.Woodland ? 55
                 : 45
    additionalDefendantFee = perDef * req.numberOfAdditionalDefendants
    lines.push({
      description: `Additional Defendants (${req.numberOfAdditionalDefendants} × $${perDef})`,
      amount: additionalDefendantFee,
      isRequired: true,
    })
  }

  // 5. Foreclosure add-on
  let foreclosureFee = 0
  if (req.isForeclosure) {
    foreclosureFee = 300
    lines.push({ description: 'Foreclosure Case Add-On', amount: 300, isRequired: true })
  }

  // 6. Standard informational add-ons
  lines.push({ description: 'Contested Hearing / Trial (if applicable)', amount: 350, isRequired: false })
  lines.push({ description: 'Default Money Judgment (if applicable)', amount: 350, isRequired: false })
  lines.push({ description: 'Reposting Writ (if stayed)', amount: 300, isRequired: false })

  const total = noticeFee + baseFee + locationSurcharge + additionalDefendantFee + foreclosureFee

  return {
    baseEvictionFee: baseFee,
    noticePreparationFee: noticeFee,
    locationSurcharge,
    additionalDefendantFees: additionalDefendantFee,
    foreclosureSurcharge: foreclosureFee,
    estimatedTotal: total,
    disclaimer:
      'Fees are estimates based on the 2025 price list. Final fees may vary depending on the ' +
      'number of tenants, property address specifics, and case complexity. ' +
      'Fees are required in advance of filing unless otherwise agreed.',
    lineItems: lines,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Step6_FeeReview({ wizardState, onNext, onBack }: Props) {
  const [fees, setFees] = useState<FeeCalculationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)

  const prop = wizardState.step3
  const noticeStep = wizardState.step5

  useEffect(() => {
    if (!prop) {
      setLoading(false)
      return
    }

    const req: FeeRequest = {
      location: prop.location,
      isCommercial: prop.isCommercial,
      claimAmount: wizardState.step4?.amountOwedAtNotice,
      needsNoticePreparation: noticeStep?.wantsNoticePrep ?? false,
      numberOfAdditionalDefendants: Math.max(0, (prop.tenants?.length ?? 1) - 1),
      isForeclosure: prop.isForeclosure,
    }

    calculateFee(req)
      .then(result => {
        setFees(result)
        setLoading(false)
      })
      .catch(() => {
        // API unavailable — calculate locally using the ported fee logic
        setFees(calculateFeeOffline(req))
        setIsOffline(true)
        setLoading(false)
      })
  }, [])

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      <div className="alert-info">
        <strong>Estimated Fee Summary</strong>
        <p className="text-xs mt-1">
          Based on your location, case type, and claim amount. Fees are required in advance of filing
          unless otherwise agreed.
        </p>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">⚖️</div>
          Calculating fees…
        </div>
      )}

      {!loading && isOffline && (
        <div className="alert-warning text-xs">
          Fee estimate calculated locally — totals will be confirmed by the office before filing.
        </div>
      )}

      {fees && (
        <>
          <div className="overflow-hidden rounded border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1e2840] text-white text-left">
                  <th className="px-4 py-3 font-semibold">Service</th>
                  <th className="px-4 py-3 font-semibold text-right">Fee</th>
                  <th className="px-4 py-3 font-semibold text-center w-20">Required</th>
                </tr>
              </thead>
              <tbody>
                {fees.lineItems.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f5f7f4]'}>
                    <td className="px-4 py-2.5 text-gray-800">{item.description}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium">
                      {item.amount > 0 ? fmt(item.amount) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {item.isRequired
                        ? <span className="text-green-700 font-bold">✓</span>
                        : <span className="text-gray-400 text-xs">if applicable</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#1e2840] text-white font-bold">
                  <td className="px-4 py-3">Estimated Total (Required Fees)</td>
                  <td className="px-4 py-3 text-right font-mono text-lg">{fmt(fees.estimatedTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="rounded border border-[#b8c4b0] bg-[#d4ddd0] p-4 text-xs text-gray-700">
            <strong>Disclaimer:</strong> {fees.disclaimer}
          </div>

          <div className="alert-warning text-xs">
            <strong>Consultation Fee:</strong> $150 for up to ½ hour · $300 for one hour.
            In some cases a consultation with the attorney may be required before filing.
          </div>
        </>
      )}

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="btn-secondary">← Back</button>
        <button
          onClick={() => fees && onNext(fees)}
          disabled={loading || !fees}
          className="btn-primary"
        >
          Continue to Documents →
        </button>
      </div>
    </div>
  )
}
