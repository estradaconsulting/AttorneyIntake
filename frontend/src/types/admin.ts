import type { CaseStatus, NoticeType, OwnerType, PropertyLocation } from './intake'

// ── List view (matches IntakeCaseSummaryDto) ──────────────────────────────────

export interface AdminCaseSummary {
  id: number
  referenceNumber: string
  status: CaseStatus
  ownerName: string
  propertyAddress: string
  createdAt: string
  submittedAt: string | null
  documentCount: number
}

// ── Detail view (matches IntakeCaseDetailDto + domain models) ─────────────────

export interface PropertyOwnerModel {
  name: string
  address?: string
  phone?: string
  alternatePhone?: string
  email?: string
  fax?: string
  ownerTypes: OwnerType[]
  trusteeName?: string
}

export interface PropertyManagerModel {
  name?: string
  company?: string
  address?: string
  phone?: string
  email?: string
  fax?: string
}

export interface TenantModel {
  fullName: string
  race?: string
  height?: string
  weight?: string
  hairColor?: string
  facialHair?: string
  eyes?: string
  hairstyle?: string
  carDescription?: string
  comments?: string
}

export interface PropertyModel {
  address: string
  gateCode?: string
  isResidential: boolean
  isCommercial: boolean
  location: PropertyLocation
  tenantMoveInDate?: string
  originalMonthlyRent?: number
  currentRent?: number
  hasWrittenAgreement: boolean
  isVerbalOnly: boolean
  noAgreement: boolean
  isTermLease: boolean
  isMonthToMonth: boolean
  hasAB1482Exemption: boolean
  isSection8OrSubsidy: boolean
  isForeclosure: boolean
  tenants: TenantModel[]
}

export interface EvictionCauseModel {
  noticeServed: boolean
  noticeForm?: string
  amountOwedAtNotice?: number
  balanceCalculationExplanation?: string
  isSubjectToRentEvictionControl: boolean
  hasCompliedWithRentEvictionControlLaws?: boolean
  rentAcceptedAfterNoticeExpired: boolean
  nonMilitaryConfirmed: boolean
}

export interface NoticeRequestModel {
  noticeType: NoticeType
  otherNoticeSpecification?: string
  isResidential: boolean
  isCommercial: boolean
  tenantPropertyAddress?: string
  monthlyRent?: number
  currentBalanceDue?: number
  methodOfPayment?: string
  paymentRecipient?: string
  paymentDeliveryAddress?: string
  otherCausesForNotice?: string
}

export interface CaseDocumentModel {
  id: number
  documentType: number
  originalFileName: string
  fileSizeBytes: number
  uploadedAt: string
}

export interface CaseActivityModel {
  id: number
  actor: string
  action: string
  resourceId: string
  detail?: string
  occurredAt: string
}

export interface AdminCaseDetail {
  id: number
  referenceNumber: string
  status: CaseStatus
  createdAt: string
  submittedAt: string | null
  ourFileNumber?: string | null
  staffNotes?: string | null
  propertyOwner: PropertyOwnerModel | null
  propertyManager: PropertyManagerModel | null
  property: PropertyModel | null
  evictionCause: EvictionCauseModel | null
  noticeRequest: NoticeRequestModel | null
  documents: CaseDocumentModel[]
  activity: CaseActivityModel[]
}
