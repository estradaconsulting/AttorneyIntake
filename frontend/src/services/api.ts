import axios from 'axios'
import type {
  IntakeCaseCreatedResponse,
  FeeCalculationResult,
  Step1_OwnerData,
  Step2_ManagerData,
  Step3_PropertyData,
  Step4_EvictionCauseData,
  Step5_NoticeRequestData,
  DocumentType,
  PropertyLocation,
} from '../types/intake'

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({ baseURL })

// ── Intake Cases ──────────────────────────────────────────────────────────────

export async function createIntakeCase(data: {
  owner: Step1_OwnerData
  manager?: Step2_ManagerData
  property: Step3_PropertyData
  evictionCause?: Step4_EvictionCauseData
  noticeRequest?: Step5_NoticeRequestData
}): Promise<IntakeCaseCreatedResponse> {
  const payload = {
    owner: {
      name: data.owner.name,
      address: data.owner.address,
      phone: data.owner.phone,
      email: data.owner.email,
      ownerTypes: data.owner.ownerTypes.map(Number),  // DOM returns strings; API expects ints
      trusteeName: data.owner.trusteeName,
    },
    manager: data.manager?.hasManager
      ? {
          name: data.manager.name,
          company: data.manager.company,
          address: data.manager.address,
          phone: data.manager.phone,
          email: data.manager.email,
        }
      : null,
    property: {
      address: data.property.address,
      gateCode: data.property.gateCode,
      isResidential: data.property.isResidential,
      isCommercial: data.property.isCommercial,
      location: data.property.location,
      tenantMoveInDate: data.property.tenantMoveInDate || null,
      originalMonthlyRent: data.property.originalMonthlyRent || null,
      currentRent: data.property.currentRent || null,
      rentBefore_2020_06_30: data.property.rentBefore_2020 || null,
      rentBefore_2021_06_30: data.property.rentBefore_2021 || null,
      rentBefore_2022_06_30: data.property.rentBefore_2022 || null,
      rentBefore_2023_06_30: data.property.rentBefore_2023 || null,
      rentBefore_2024_06_30: data.property.rentBefore_2024 || null,
      rentBefore_2025_06_30: data.property.rentBefore_2025 || null,
      hasWrittenAgreement: data.property.hasWrittenAgreement,
      isVerbalOnly: data.property.isVerbalOnly,
      noAgreement: data.property.noAgreement,
      isTermLease: data.property.isTermLease,
      isMonthToMonth: data.property.isMonthToMonth,
      hasAB1482Exemption: data.property.hasAB1482Exemption,
      hasTenantsBeenAdded: data.property.hasTenantsBeenAdded,
      addedTenantMoveInDate: data.property.addedTenantMoveInDate || null,
      constructedWithinLast15Years: data.property.constructedWithinLast15Years,
      isSection8OrSubsidy: data.property.isSection8OrSubsidy,
      isForeclosure: data.property.isForeclosure,
      tenants: data.property.tenants.map(t => ({
        fullName: t.fullName,
        race: t.race,
        height: t.height,
        weight: t.weight,
        hairColor: t.hairColor,
        facialHair: t.facialHair,
        eyes: t.eyes,
        hairstyle: t.hairstyle,
        carDescription: t.carDescription,
        comments: t.comments,
      })),
    },
    evictionCause: data.evictionCause ?? null,
    noticeRequest: data.noticeRequest?.wantsNoticePrep
      ? {
          noticeType: data.noticeRequest.noticeType,
          otherNoticeSpecification: data.noticeRequest.otherNoticeSpecification,
          isResidential: data.noticeRequest.isResidential,
          isCommercial: data.noticeRequest.isCommercial,
          tenantPropertyAddress: data.noticeRequest.tenantPropertyAddress,
          monthlyRent: data.noticeRequest.monthlyRent,
          currentBalanceDue: data.noticeRequest.currentBalanceDue,
          balanceCalculationExplanation: data.noticeRequest.balanceCalculationExplanation,
          methodOfPayment: data.noticeRequest.methodOfPayment,
          paymentDueOnFirst: data.noticeRequest.paymentDueOnFirst ?? true,
          paymentRecipient: data.noticeRequest.paymentRecipient,
          paymentDeliveryAddress: data.noticeRequest.paymentDeliveryAddress,
          alternatePaymentAddress: data.noticeRequest.alternatePaymentAddress,
          tenantContactPhone: data.noticeRequest.tenantContactPhone,
          usualPaymentDaysHours: data.noticeRequest.usualPaymentDaysHours,
          paymentByMailOnly: data.noticeRequest.paymentByMailOnly ?? false,
          otherCausesForNotice: data.noticeRequest.otherCausesForNotice,
          hasWrittenAgreement: data.noticeRequest.hasWrittenAgreement,
          isVerbalOnly: data.noticeRequest.isVerbalOnly,
          noAgreement: data.noticeRequest.noAgreement,
          isForeclosure: false,
        }
      : null,
  }

  const response = await api.post<IntakeCaseCreatedResponse>('/intakecases', payload)
  return response.data
}

export async function submitCase(caseId: number): Promise<void> {
  await api.post(`/intakecases/${caseId}/submit`)
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function uploadDocument(
  caseId: number,
  file: File,
  documentType: DocumentType,
  notes?: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  form.append('documentType', String(documentType))
  if (notes) form.append('notes', notes)

  await api.post(`/documents/upload/${caseId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => {
      if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  })
}

// ── Fees ──────────────────────────────────────────────────────────────────────

export async function calculateFee(params: {
  location: PropertyLocation
  isCommercial: boolean
  claimAmount?: number
  needsNoticePreparation: boolean
  numberOfAdditionalDefendants: number
  isForeclosure: boolean
}): Promise<FeeCalculationResult> {
  const response = await api.post<FeeCalculationResult>('/fees/calculate', params)
  return response.data
}
