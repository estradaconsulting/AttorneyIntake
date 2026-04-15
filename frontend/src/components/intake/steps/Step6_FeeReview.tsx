import { useEffect, useState } from 'react'
import { PropertyLocation, PropertyLocationLabels, type FeeCalculationResult, type FeeLineItem, type IntakeWizardState } from '../../../types/intake'
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

/** Human-readable county name for a location. */
function countyOf(loc: PropertyLocation): string {
  switch (loc) {
    case PropertyLocation.Sacramento:
    case PropertyLocation.ElkGroveRosevileFolsom:
      return 'Sacramento County'
    case PropertyLocation.Loomis:
    case PropertyLocation.Placer:
      return 'Placer County'
    case PropertyLocation.YoloDavis:
    case PropertyLocation.Woodland:
    case PropertyLocation.WestSacramento:
      return 'Yolo County'
    case PropertyLocation.AuburnElDoradoGalt:
      return 'El Dorado / Placer County'
    default:
      return 'Sacramento County'
  }
}

export default function Step6_FeeReview({ wizardState, onNext, onBack }: Props) {
  const [fees, setFees] = useState<FeeCalculationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)

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

  const locationLabel = prop ? PropertyLocationLabels[prop.location] : null
  const countyLabel  = prop ? countyOf(prop.location) : null

  return (
    <div className="space-y-6">
      <div className="alert-info">
        <strong>Estimated Fee Summary</strong>
        <p className="mt-1 text-xs">
          Based on your selected location, requested services, and claim amount. Fees are required
          in advance of filing unless otherwise agreed.
        </p>
      </div>

      {/* Jurisdiction badge — confirms which location/county the fees are based on */}
      {locationLabel && (
        <div className="flex items-start gap-3 rounded border border-[#1e3a5f] bg-[#eef2f7] px-4 py-3">
          <span className="mt-0.5 text-[#1e3a5f]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          <div className="text-sm">
            <span className="font-semibold text-[#1e3a5f]">Jurisdiction: </span>
            <span className="font-medium text-gray-800">{locationLabel}</span>
            <span className="mx-2 text-gray-400">·</span>
            <span className="font-semibold text-[#8b1414]">{countyLabel}</span>
            <p className="mt-0.5 text-xs text-gray-500">
              Fees below are calculated for this jurisdiction. If this is incorrect, go back to Step 3 and update the property location.
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="py-8 text-center text-gray-500">
          <div className="mb-2 text-3xl">⚖️</div>
          Calculating fees...
        </div>
      )}

      {!loading && isOffline && (
        <div className="alert-warning text-xs">
          Fee estimate calculated locally using the 2025 price list. Totals will be confirmed by the office before filing.
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
                  <th className="w-24 px-4 py-3 text-center font-semibold">Required</th>
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
            <strong>Additional Possible Charges:</strong> Hearings or trial $350 · default money judgment $350 ·
            reposting writ $300 · witness subpoena preparation and service $400 plus witness fees ·
            hourly attorney rate $300/hr in contested actions.
          </div>
        </>
      )}

      {/* ── 2025 Complete Fee Schedule (collapsible) ───────────────────────────── */}
      <div className="rounded border border-gray-300 overflow-hidden">
        <button
          type="button"
          onClick={() => setScheduleOpen(o => !o)}
          className="flex w-full items-center justify-between bg-[#f5f7f4] px-4 py-3 text-left text-sm font-semibold text-[#1e3a5f] hover:bg-[#e8ede6] transition-colors"
        >
          <span>📋 View Complete 2025 Fee Schedule (All Jurisdictions)</span>
          <span className="text-lg leading-none">{scheduleOpen ? '▲' : '▼'}</span>
        </button>

        {scheduleOpen && (
          <div className="p-4 space-y-5 text-xs">

            {/* Uncontested Eviction */}
            <div>
              <h4 className="font-bold text-[#1e3a5f] mb-2 text-sm">Uncontested Eviction — Attorney Fees</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#1e2840] text-white">
                      <th className="px-3 py-2 text-left font-semibold">Jurisdiction</th>
                      <th className="px-3 py-2 text-center font-semibold">County</th>
                      <th className="px-3 py-2 text-right font-semibold">Claim &lt; $10k</th>
                      <th className="px-3 py-2 text-right font-semibold">Claim $10k–$35k</th>
                      <th className="px-3 py-2 text-right font-semibold">Claim &gt; $35k</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { loc: PropertyLocation.Sacramento,            county: 'Sacramento', lt10: 995,   mid: 1350, gt35: '—'   },
                      { loc: PropertyLocation.ElkGroveRosevileFolsom, county: 'Sacramento', lt10: 1100, mid: 1900, gt35: '—'   },
                      { loc: PropertyLocation.Loomis,                county: 'Placer',     lt10: 1250, mid: 1900, gt35: 2500   },
                      { loc: PropertyLocation.YoloDavis,             county: 'Yolo',       lt10: 1100, mid: 1900, gt35: 2500   },
                      { loc: PropertyLocation.AuburnElDoradoGalt,    county: 'El Dorado / Placer', lt10: 1350, mid: 1900, gt35: 2500 },
                      { loc: PropertyLocation.Woodland,              county: 'Yolo',       lt10: 1100, mid: 1900, gt35: 2500   },
                      { loc: PropertyLocation.Placer,                county: 'Placer',     lt10: 1250, mid: 1900, gt35: 2500   },
                      { loc: PropertyLocation.WestSacramento,        county: 'Yolo',       lt10: 1100, mid: 1900, gt35: 2500   },
                    ].map((row, i) => (
                      <tr
                        key={row.loc}
                        className={[
                          i % 2 === 0 ? 'bg-white' : 'bg-[#f5f7f4]',
                          prop?.location === row.loc ? 'ring-2 ring-inset ring-[#8b1414]' : '',
                        ].join(' ')}
                      >
                        <td className="px-3 py-2 font-medium text-gray-800">
                          {PropertyLocationLabels[row.loc]}
                          {prop?.location === row.loc && (
                            <span className="ml-2 rounded bg-[#8b1414] px-1.5 py-0.5 text-[10px] font-bold text-white">YOUR CASE</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-600">{row.county}</td>
                        <td className="px-3 py-2 text-right font-mono">{typeof row.lt10 === 'number' ? fmt(row.lt10) : row.lt10}</td>
                        <td className="px-3 py-2 text-right font-mono">{typeof row.mid === 'number' ? fmt(row.mid) : row.mid}</td>
                        <td className="px-3 py-2 text-right font-mono">{typeof row.gt35 === 'number' ? fmt(row.gt35) : row.gt35}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Commercial Eviction */}
            <div>
              <h4 className="font-bold text-[#1e3a5f] mb-2 text-sm">Commercial Eviction — Attorney Fees</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#1e2840] text-white">
                      <th className="px-3 py-2 text-left font-semibold">Jurisdiction</th>
                      <th className="px-3 py-2 text-right font-semibold">Base Fee</th>
                      <th className="px-3 py-2 text-right font-semibold">+ Claim $10k–$25k</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Sacramento City / County',            fee: 1350 },
                      { label: 'All Other Jurisdictions',             fee: 1500 },
                    ].map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f5f7f4]'}>
                        <td className="px-3 py-2 font-medium text-gray-800">{row.label}</td>
                        <td className="px-3 py-2 text-right font-mono">{fmt(row.fee)}</td>
                        <td className="px-3 py-2 text-right font-mono text-gray-500">+ $250.00</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notice Preparation */}
            <div>
              <h4 className="font-bold text-[#1e3a5f] mb-2 text-sm">Notice Preparation &amp; Service</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#1e2840] text-white">
                      <th className="px-3 py-2 text-left font-semibold">Jurisdiction</th>
                      <th className="px-3 py-2 text-right font-semibold">Residential</th>
                      <th className="px-3 py-2 text-right font-semibold">Commercial / Foreclosure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Sacramento City / County',       res: 175, comm: 200 },
                      { label: 'Elk Grove / Roseville / Folsom', res: 200, comm: 300 },
                      { label: 'All Other Jurisdictions',        res: 250, comm: 300 },
                    ].map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f5f7f4]'}>
                        <td className="px-3 py-2 font-medium text-gray-800">{row.label}</td>
                        <td className="px-3 py-2 text-right font-mono">{fmt(row.res)}</td>
                        <td className="px-3 py-2 text-right font-mono">{fmt(row.comm)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add-ons & Flat Fees */}
            <div>
              <h4 className="font-bold text-[#1e3a5f] mb-2 text-sm">Add-Ons &amp; Flat Fees</h4>
              <table className="w-full border-collapse text-xs">
                <tbody>
                  {[
                    ['Court Appearance Add-On (Yolo / Auburn / El Dorado)', '$45.00', 'Added to all cases in these counties'],
                    ['Additional Defendants — Sacramento', '$35.00 each', 'Per defendant beyond the first'],
                    ['Additional Defendants — Woodland', '$55.00 each', 'Per defendant beyond the first'],
                    ['Additional Defendants — All Other', '$45.00 each', 'Per defendant beyond the first'],
                    ['Foreclosure Case Add-On', '$300.00', 'Applied to all foreclosure matters'],
                    ['Consultation (up to ½ hour)', '$150.00', 'If applicable'],
                    ['Consultation (1 hour)', '$300.00', 'If applicable'],
                    ['Contested Hearing / Trial', '$350.00', 'If applicable'],
                    ['Default Money Judgment (incl. stip. defaults)', '$350.00', 'If applicable'],
                    ['Reposting Writ', '$300.00', 'If applicable'],
                    ['Witness Subpoena Prep &amp; Service', '$400.00 + witness fees', 'If applicable'],
                    ['Hourly Attorney Rate (contested actions)', '$300.00 / hr', 'If applicable'],
                  ].map(([service, fee, note], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f5f7f4]'}>
                      <td className="px-3 py-2 font-medium text-gray-800" dangerouslySetInnerHTML={{ __html: service }} />
                      <td className="px-3 py-2 text-right font-mono text-gray-800 whitespace-nowrap">{fee}</td>
                      <td className="px-3 py-2 text-gray-500">{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-gray-500 italic">
              2025 Price List — Law Office of Thomas M. Hogan. Fees are required in advance of filing unless otherwise agreed.
              Court filing fees, process server fees, and other third-party costs are separate and not included above.
            </p>
          </div>
        )}
      </div>

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
