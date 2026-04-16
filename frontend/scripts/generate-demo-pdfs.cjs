const fs = require('fs')
const path = require('path')
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib')

const dataSeederPath = path.resolve(__dirname, '../../backend/src/Hogan4Eviction.Infrastructure/Data/DataSeeder.cs')
const outputDir = path.resolve(__dirname, '../public/sample-documents')

function titleFromFilename(fileName) {
  const lower = fileName.toLowerCase()
  if (lower.includes('trustees_deed')) return "Trustee's Deed Upon Sale"
  if (lower.includes('commercial_lease')) return 'Commercial Lease Agreement'
  if (lower.includes('lease')) return 'Residential Rental Agreement'
  if (lower.includes('3day') || lower.includes('pay_or_quit') || lower.includes('quit_notice')) return 'Three-Day Notice'
  if (lower.includes('30day') || lower.includes('60day') || lower.includes('termination')) return 'Termination Notice'
  if (lower.includes('breach')) return 'Notice of Lease Breach'
  if (lower.includes('proof') || lower.includes('pos') || lower.includes('service')) return 'Proof of Service'
  if (lower.includes('court_filing')) return 'Unlawful Detainer Filing Packet'
  if (lower.includes('answer_packet')) return 'Tenant Answer Packet'
  if (lower.includes('hearing_notice')) return 'Court Hearing Notice'
  if (lower.includes('judgment_packet')) return 'Judgment Package'
  if (lower.includes('writ_request')) return 'Request for Writ of Possession'
  if (lower.includes('housing_auth_ltr')) return 'Housing Authority Correspondence'
  if (lower.includes('owner_declaration')) return 'Owner Declaration'
  if (lower.includes('repair_log')) return 'Repair Log'
  if (lower.includes('rent_history')) return 'Rent History Ledger'
  if (lower.includes('hoa_violation')) return 'HOA Violation Notice'
  if (lower.includes('sms_log')) return 'Tenant Communication Log'
  if (lower.includes('notice')) return 'Notice Document'
  return 'Supporting Case Document'
}

function categoryFromFilename(fileName) {
  const lower = fileName.toLowerCase()
  if (lower.includes('lease')) return 'lease'
  if (lower.includes('notice') || lower.includes('quit') || lower.includes('termination') || lower.includes('breach')) return 'notice'
  if (lower.includes('proof') || lower.includes('pos') || lower.includes('service')) return 'service'
  if (lower.includes('trustees_deed')) return 'deed'
  if (lower.includes('court') || lower.includes('answer') || lower.includes('hearing') || lower.includes('judgment') || lower.includes('writ')) return 'court'
  return 'support'
}

function linesForFile(fileName) {
  const title = titleFromFilename(fileName)
  const category = categoryFromFilename(fileName)
  const common = [
    'Prepared for product demonstration use only.',
    `Demo file name: ${fileName}`,
    '',
  ]

  if (category === 'lease') {
    return [
      ...common,
      'Landlord: Meridian Portfolio Management',
      'Tenant: Sample Occupant',
      'Property: 4455 Norwood Ave, Sacramento, CA 95838',
      'Lease Term: Month-to-Month',
      'Monthly Rent: $1,945.00',
      'Security Deposit: $1,950.00',
      '',
      'This lease packet demonstrates how executed rental agreements would appear',
      'inside the admin document viewer for intake review.',
    ]
  }

  if (category === 'notice') {
    return [
      ...common,
      'To: Current Occupants',
      'Service Address: 4455 Norwood Ave, Sacramento, CA 95838',
      'Notice Date: April 8, 2026',
      'Prepared By: Hogan4Eviction Demo Intake',
      '',
      'This notice is included as a realistic sample showing how customer-uploaded',
      'service notices, cure notices, and termination notices can be previewed.',
    ]
  }

  if (category === 'service') {
    return [
      ...common,
      'Server: Marisol Vega',
      'Service Method: Personal service / substituted service',
      'Service Date: April 9, 2026',
      'Property Address: 4455 Norwood Ave, Sacramento, CA 95838',
      '',
      'This exhibit demonstrates proof-of-service style documents commonly attached',
      'to an intake before filing or status review.',
    ]
  }

  if (category === 'deed') {
    return [
      ...common,
      'Recording Requested By: Golden State Default Services, LLC',
      'Loan No.: 2026-45811',
      'Trustee Sale No.: TS-26-1142',
      'APN: 275-0440-018-0000',
      '',
      'Trustee hereby grants and conveys to First Pacific Bank, N.A. all right, title,',
      'and interest in the real property situated in Sacramento County, California.',
    ]
  }

  if (category === 'court') {
    return [
      ...common,
      'Court: Superior Court of California, County of Sacramento',
      'Case Type: Unlawful Detainer',
      'Plaintiff: Demo Property Owner',
      'Defendant: Demo Tenant',
      '',
      'This sample packet shows how filing documents, hearing notices, and post-judgment',
      'materials would appear to staff reviewing the case file.',
    ]
  }

  return [
    ...common,
    'Supporting Exhibit',
    'Prepared for attorney intake workflow demonstration.',
    'This file represents customer-submitted evidence or staff-prepared support material.',
  ]
}

async function createPdf(fileName) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const { width, height } = page.getSize()
  const title = titleFromFilename(fileName)
  const lines = linesForFile(fileName)

  page.drawRectangle({
    x: 36,
    y: 36,
    width: width - 72,
    height: height - 72,
    borderColor: rgb(0.84, 0.87, 0.91),
    borderWidth: 1,
  })

  page.drawText(title, {
    x: 56,
    y: height - 72,
    size: 18,
    font: bold,
    color: rgb(0.12, 0.22, 0.39),
  })

  page.drawText('Hogan4Eviction Demo Document Preview', {
    x: 56,
    y: height - 94,
    size: 10,
    font,
    color: rgb(0.42, 0.47, 0.54),
  })

  let y = height - 132
  for (const line of lines) {
    if (line === '') {
      y -= 10
      continue
    }

    page.drawText(line, {
      x: 56,
      y,
      size: 11,
      font,
      color: rgb(0.16, 0.18, 0.22),
      maxWidth: width - 112,
      lineHeight: 14,
    })
    y -= 18
  }

  page.drawRectangle({
    x: 56,
    y: 92,
    width: width - 112,
    height: 92,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.84, 0.87, 0.91),
    borderWidth: 1,
  })

  page.drawText('Demo Notes', {
    x: 72,
    y: 160,
    size: 12,
    font: bold,
    color: rgb(0.12, 0.22, 0.39),
  })

  page.drawText(
    'These PDFs are intentionally realistic-looking placeholders for product demos. In production, this viewer would open the actual uploaded file associated with the intake case.',
    {
      x: 72,
      y: 136,
      size: 10,
      font,
      color: rgb(0.26, 0.29, 0.33),
      maxWidth: width - 144,
      lineHeight: 13,
    }
  )

  const bytes = await pdfDoc.save()
  fs.writeFileSync(path.join(outputDir, fileName), bytes)
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true })
  const source = fs.readFileSync(dataSeederPath, 'utf8')
  const fileNames = [...source.matchAll(/CreateDocument\([^,]+,\s*"([^"]+)"/g)]
    .map(match => match[1])
    .filter(name => name.toLowerCase().endsWith('.pdf'))
  const uniqueFileNames = [...new Set(fileNames)].sort()

  for (const fileName of uniqueFileNames) {
    await createPdf(fileName)
  }

  console.log(`Generated ${uniqueFileNames.length} demo PDFs in ${outputDir}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
