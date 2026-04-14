import { useEffect, useState } from 'react'
import { PropertyLocation, type FeeCalculationResult, type FeeLineItem, type IntakeWizardState } from '../../../types/intake'
import { calculateFee } from '../../../services/api'

interface Props {
  wizardState: IntakeWizardState
  onNext: (feeEstimate: FeeCalculationResult) => void
  onBack: () => void
}

interface FeeRequest {
  location: PropertyLocation
  isCommercial: boolean
  claimAmount?: number
  needsNoticePreparation: boolean
  numberOfAdditionalDefendants: number
  isForeclosure: boolean
}

function calculateFeeOffline(req: FeeRequest): FeeCalculationResult {
  const lines: FeeLineItem[] = [
    { description: 'Consultation Fee (up to 1/2 hour)', amount: 150, isRequired: false },
    { description: 'Consultation Fee (1 hour)', amount: 300, isRequired: false },
  ]

  let noticeFee = 0
  if (req.needsNoticePreparation) {
    if (req.isCommercial || req.isForeclosure) {
      noticeFee = req.location === PropertyLocation.Sacramento ? 200 : 300
    } else if (req.location === PropertyLocation.Sacramento) {
      noticeFee = 175
    } else if (req.location === PropertyLocation.ElkGroveRosevileFolsom) {
      noticeFee = 200
    } else {
      noticeFee = 250
    }

    lines.push({ description: 'Preparation and Service of Notice (or Agreement)', amount: noticeFee, isRequired: false })
  }

  const claim = req.claimAmount ?? 0
  let baseFee = 0
  let baseFeeDesc = ''

  if (req.isCommercial) {
    baseFee = req.location === PropertyLocation.Sacramento ? 1350 : 1500
    baseFeeDesc = 'Commercial Eviction Filing'

    if (claim >= 10_000 && claim <= 25_000) {
      baseFee += 250
      lines.push({ description: 'Commercial Claim Amount Add-On ($10k-$25k)', amount: 250, isRequired: true })
    }
  } else if (claim > 35_000) {
    if (
      req.location === PropertyLocation.Loomis ||
      req.location === PropertyLocation.YoloDavis ||
      req.location === PropertyLocation.AuburnElDoradoGalt ||
      req.location === PropertyLocation.Woodland ||
      req.location === PropertyLocation.Placer ||
      req.location === PropertyLocation.WestSacramento
    ) {
      baseFee = 2500
    } else {
      baseFee = 0
    }
    baseFeeDesc = 'Uncontested Eviction (claim > $35k)'
  } else if (claim >= 10_000) {
    baseFee = req.location === PropertyLocation.Sacramento ? 1350 : 1900
    baseFeeDesc = 'Uncontested Eviction (claim $10k-$35k)'
  } else {
    if (req.location === PropertyLocation.Sacramento) baseFee = 995
    else if (req.location === PropertyLocation.ElkGroveRosevileFolsom) baseFee = 1100
    else if (req.location === PropertyLocation.Loomis) baseFee = 1250
    else if (req.location === PropertyLocation.YoloDavis || req.location === PropertyLocation.WestSacramento) baseFee = 1100
    else if (req.location === PropertyLocation.AuburnElDoradoGalt) baseFee = 1350
    else if (req.location === PropertyLocation.Woodland) baseFee = 1100
    else if (req.location === PropertyLocation.Placer) baseFee = 1250
    else baseFee = 995

    baseFeeDesc = 'Uncontested Eviction (claim under $10k)'
  }

  if (baseFee === 0 && !req.isCommercial && claim > 35_000) {
    lines.push({ description: `${baseFeeDesc} - Not Available for this location`, amount: 0, isRequired: false })
  } else {
    lines.push({ description: baseFeeDesc, amount: baseFee, isRequired: true })
  }

  let locationSurcharge = 0
  if (
    req.location === PropertyLocation.YoloDavis ||
    req.location === PropertyLocation.Woodland ||
    req.location === PropertyLocation.WestSacramento ||
    req.location === PropertyLocation.AuburnElDoradoGalt
  ) {
    locationSurcharge = 45
    lines.push({ description: 'Court Appearance Add-On (Yolo / Auburn / El Dorado)', amount: 45, isRequired: true })
  }

  let additionalDefendantFee = 0
  if (req.numberOfAdditionalDefendants > 0) {
    const perDef = req.location === PropertyLocation.Sacramento
      ? 35
      : req.location === PropertyLocation.Woodland
        ? 55
        : 45

    additionalDefendantFee = perDef * req.numberOfAdditionalDefendants
    lines.push({
      description: `New Complaint - Additional Defendants (${req.numberOfAdditionalDefendants} x $${perDef})`,
      amount: additionalDefendantFee,
      isRequired: true,
    })
  }

  let foreclosureFee = 0
  if (req.isForeclosure) {
    foreclosureFee = 300
    lines.push({ description: 'Foreclosure Case Add-On', amount: 300, isRequired: true })
  }

  lines.push({ description: 'Contested Hearing / Trial', amount: 350, isRequired: false })
  lines.push({ description: 'Default Money Judgment (includes stipulation defaults)', amount: 350, isRequired: false })
  lines.push({ description: 'Reposting Writ', amount: 300, isRequired: false })
  lines.push({ description: 'Witness Subpoena Preparation and Service', amount: 400, isRequired: false })
  lines.push({ description: 'Hourly Attorney Rate in Contested Actions', amount: 300, isRequired: false })

  const total = noticeFee + baseFee + locationSurcharge + additionalDefendantFee + foreclosureFee

  return {
    baseEvictionFee: baseFee,
    noticePreparationFee: noticeFee,
    locationSurcharge,
    additionalDefendantFees: additionalDefendantFee,
    foreclosureSurcharge: foreclosureFee,
    estimatedTotal: total,
    disclaimer:
      'Fees are estimates based on the 2025 price list and attachment. Final fees may vary depending on the ' +
      'number of tenants, property address specifics, service requirements, and case complexity. ' +
      'Fees are required in advance of filing unless otherwise agreed.',
    lineItems: lines,
  }
}

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
        <p className="mt-1 text-xs">
          Based on your selected location, requested services, and claim amount. Fees are required
          in advance of filing unless otherwise agreed.
        </p>
      </div>

      {loading && (
        <div className="py-8 text-center text-gray-500">
          <div className="mb-2 text-3xl">Fee Calculator</div>
          Calculating fees...
        </div>
      )}

      {!loading && isOffline && (
        <div className="alert-warning text-xs">
          Fee estimate calculated locally. Totals will be confirmed by the office before filing.
        </div>
      )}

      {fees && (
        <>
          <div className="overflow-hidden rounded border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1e2840] text-left text-white">
                  <th className="px-4 py-3 font-semibold">Service</th>
                  <th className="px-4 py-3 text-right font-semibold">Fee</th>
                  <th className="w-20 px-4 py-3 text-center font-semibold">Required</th>
                </tr>
              </thead>
              <tbody>
                {fees.lineItems.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f5f7f4]'}>
                    <td className="px-4 py-2.5 text-gray-800">{item.description}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium">
                      {item.amount > 0 ? fmt(item.amount) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {item.isRequired
                        ? <span className="font-bold text-green-700">yes</span>
                        : <span className="text-xs text-gray-400">if applicable</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#1e2840] font-bold text-white">
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
            <strong>Additional Possible Charges:</strong> Hearings or trial $350, default money judgment $350,
            reposting writ $300, witness subpoena preparation and service $400 plus witness fees,
            and hourly attorney rates of $300 per hour may apply in contested actions.
          </div>
        </>
      )}

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button
          onClick={() => fees && onNext(fees)}
          disabled={loading || !fees}
          className="btn-primary"
        >
          Continue to Documents
        </button>
      </div>
    </div>
  )
}
