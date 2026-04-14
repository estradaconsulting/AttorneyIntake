// ── Enums (must mirror backend C# enums) ─────────────────────────────────────

export enum OwnerType {
  Individual = 1,
  LlcWithoutCorporateMember = 2,
  LlcWithCorporateMember = 3,
  FamilyTrust = 4,
  RealEstateInvestmentTrust = 5,
  Corporation = 6,
  Partnership = 7,
}

export const OwnerTypeLabels: Record<OwnerType, string> = {
  [OwnerType.Individual]: 'An Individual over 18 years old',
  [OwnerType.LlcWithoutCorporateMember]: 'A LLC without a Corporate Member',
  [OwnerType.LlcWithCorporateMember]: 'A LLC with a Corporate Member',
  [OwnerType.FamilyTrust]: 'A Family Trust',
  [OwnerType.RealEstateInvestmentTrust]: 'A Real Estate Investment Trust',
  [OwnerType.Corporation]: 'A Corporation',
  [OwnerType.Partnership]: 'A Partnership',
}

export enum NoticeType {
  ThreeDayPayOrQuit = 1,
  ThreeDayPayPerform = 2,
  ThirtyDayPayOrQuit_Section8 = 3,
  ThirtyDayTermination = 4,
  SixtyDayTermination_JustCause = 5,
  SixtyDay_AB1482Exempt = 6,
  NinetyDay_Subsidized = 7,
  NinetyDay_Foreclosure = 8,
  ThreeDay_Quit_Foreclosure = 9,
  ThreeDay_Quit_IncurableBreach = 10,
  Other = 99,
}

export const NoticeTypeLabels: Record<NoticeType, string> = {
  [NoticeType.ThreeDayPayOrQuit]: '3-Day Pay or Quit',
  [NoticeType.ThreeDayPayPerform]: '3-Day Pay or Perform',
  [NoticeType.ThirtyDayPayOrQuit_Section8]: '30-Day Pay or Quit (Section 8 / Bank Mortgage)',
  [NoticeType.ThirtyDayTermination]: '30-Day Termination',
  [NoticeType.SixtyDayTermination_JustCause]: '60-Day Termination (Just Cause)',
  [NoticeType.SixtyDay_AB1482Exempt]: '60-Day (AB 1482 Exempt)',
  [NoticeType.NinetyDay_Subsidized]: '90-Day Subsidized',
  [NoticeType.NinetyDay_Foreclosure]: '90-Day Foreclosure',
  [NoticeType.ThreeDay_Quit_Foreclosure]: '3-Day Quit / Foreclosure',
  [NoticeType.ThreeDay_Quit_IncurableBreach]: '3-Day Quit / Incurable Breach',
  [NoticeType.Other]: 'Other (specify)',
}

export enum PropertyLocation {
  Sacramento = 1,
  ElkGroveRosevileFolsom = 2,
  Loomis = 3,
  YoloDavis = 4,
  AuburnElDoradoGalt = 5,
  Woodland = 6,
  Placer = 7,
  WestSacramento = 8,
}

export const PropertyLocationLabels: Record<PropertyLocation, string> = {
  [PropertyLocation.Sacramento]: 'Sacramento City / County',
  [PropertyLocation.ElkGroveRosevileFolsom]: 'Elk Grove / Roseville / Folsom',
  [PropertyLocation.Loomis]: 'Loomis',
  [PropertyLocation.YoloDavis]: 'Yolo / Davis',
  [PropertyLocation.AuburnElDoradoGalt]: 'Auburn / El Dorado / Galt',
  [PropertyLocation.Woodland]: 'Woodland',
  [PropertyLocation.Placer]: 'Placer County',
  [PropertyLocation.WestSacramento]: 'West Sacramento (Yolo)',
}

export enum CaseStatus {
  Draft = 0,
  Submitted = 1,
  UnderReview = 2,
  PendingDocuments = 3,
  ConsultationRequired = 4,
  Active = 5,
  FiledWithCourt = 6,
  HearingScheduled = 7,
  Judgment = 8,
  Closed = 9,
  Cancelled = 10,
}

export enum DocumentType {
  RentalAgreement = 1,
  RentIncreaseNotice = 2,
  NoticeToTenant = 3,
  ProofOfService = 4,
  TrusteesDeed = 5,
  Other = 99,
}

export const DocumentTypeLabels: Record<DocumentType, string> = {
  [DocumentType.RentalAgreement]: 'Rental Agreement',
  [DocumentType.RentIncreaseNotice]: 'Notice of Rent Increase',
  [DocumentType.NoticeToTenant]: 'Notice to Tenant (latest)',
  [DocumentType.ProofOfService]: 'Proof of Service',
  [DocumentType.TrusteesDeed]: "Trustee's Deed",
  [DocumentType.Other]: 'Other',
}

// ── Form data shapes ──────────────────────────────────────────────────────────

export interface TenantFormData {
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

export interface Step1_OwnerData {
  name: string
  address: string
  phone: string
  alternatePhone?: string
  email: string
  fax?: string
  ownerTypes: OwnerType[]
  trusteeName?: string
}

export interface Step2_ManagerData {
  hasManager: boolean
  name?: string
  company?: string
  address?: string
  phone?: string
  email?: string
  fax?: string
}

export interface Step3_PropertyData {
  address: string
  gateCode?: string
  isResidential: boolean
  isCommercial: boolean
  location: PropertyLocation
  tenantMoveInDate?: string
  originalMonthlyRent?: number
  currentRent?: number
  rentBefore_2020?: number
  rentBefore_2021?: number
  rentBefore_2022?: number
  rentBefore_2023?: number
  rentBefore_2024?: number
  rentBefore_2025?: number
  hasWrittenAgreement: boolean
  isVerbalOnly: boolean
  noAgreement: boolean
  isTermLease: boolean
  isMonthToMonth: boolean
  hasAB1482Exemption: boolean
  hasTenantsBeenAdded: boolean
  addedTenantMoveInDate?: string
  constructedWithinLast15Years: boolean
  isSection8OrSubsidy: boolean
  isForeclosure: boolean
  tenants: TenantFormData[]
}

export interface Step4_EvictionCauseData {
  noticeServed: boolean
  noticeForm?: string
  amountOwedAtNotice?: number
  balanceCalculationExplanation?: string
  isSubjectToRentEvictionControl: boolean
  hasCompliedWithRentEvictionControlLaws?: boolean
  rentAcceptedAfterNoticeExpired: boolean
  receivedRentalAssistanceForNoticeAmount: boolean
  receivedRentalAssistanceAfterNoticeDate: boolean
  pendingApplicationForNoticeAmount: boolean
  pendingApplicationAfterNoticeDate: boolean
  nonMilitaryConfirmed: boolean
  nonMilitaryStatusBasis?: 'a' | 'b' | 'c' | 'd' | 'e' | 'f'
  nonMilitaryDischargeDate?: string
  nonMilitaryOtherExplanation?: string
  rentalAssistanceDeclarantRole?: 'owner' | 'manager'
}

export interface Step5_NoticeRequestData {
  wantsNoticePrep: boolean   // false = they already have a valid notice
  noticeType?: NoticeType
  otherNoticeSpecification?: string
  isResidential: boolean
  isCommercial: boolean
  tenantPropertyAddress?: string
  monthlyRent?: number
  currentBalanceDue?: number
  balanceCalculationExplanation?: string
  methodOfPayment?: string
  paymentDueOnFirst?: boolean
  paymentRecipient?: string
  paymentDeliveryAddress?: string
  alternatePaymentAddress?: string
  tenantContactPhone?: string
  usualPaymentDaysHours?: string
  paymentByMailOnly?: boolean
  otherCausesForNotice?: string
  hasWrittenAgreement: boolean
  isVerbalOnly: boolean
  noAgreement: boolean
}

export interface PaymentAuthorizationData {
  acknowledgeOfficeWillCollectCardLater: boolean
  cardholderName: string
  billingPhone?: string
  billingZip?: string
  authorizedAmount?: number
  preferredFollowUp?: 'phone' | 'email'
  notes?: string
}

export interface UploadedDocument {
  id: number
  documentType: DocumentType
  originalFileName: string
  fileSizeBytes: number
  uploadedAt: string
}

export interface PendingDocumentUpload {
  file: File
  documentType: DocumentType
}

export interface SubmissionCertification {
  signerName: string
  signedDate: string
  signerRole: 'owner' | 'manager' | 'authorized_agent'
  executionCounty: string
  authorizedAgentTitle?: string
  agreed: boolean
}

// ── API response types ────────────────────────────────────────────────────────

export interface IntakeCaseCreatedResponse {
  id: number
  referenceNumber: string
  status: CaseStatus
  message: string
}

export interface LocalSubmissionResponse {
  referenceNumber: string
  savedAt: string
  message: string
}

export interface FeeLineItem {
  description: string
  amount: number
  isRequired: boolean
}

export interface FeeCalculationResult {
  baseEvictionFee: number
  noticePreparationFee: number
  locationSurcharge: number
  additionalDefendantFees: number
  foreclosureSurcharge: number
  estimatedTotal: number
  disclaimer: string
  lineItems: FeeLineItem[]
}

// ── Combined wizard state ─────────────────────────────────────────────────────

export interface IntakeWizardState {
  step1?: Step1_OwnerData
  step2?: Step2_ManagerData
  step3?: Step3_PropertyData
  step4?: Step4_EvictionCauseData
  step5?: Step5_NoticeRequestData
  paymentAuthorization?: PaymentAuthorizationData
  createdCaseId?: number
  referenceNumber?: string
  feeEstimate?: FeeCalculationResult
  documents?: PendingDocumentUpload[]
  certification?: SubmissionCertification
}
