import { useState } from 'react'
import type { IntakeWizardState } from '../../types/intake'
import StepIndicator from '../common/StepIndicator'
import Step1_OwnerInfo from './steps/Step1_OwnerInfo'
import Step2_ManagerInfo from './steps/Step2_ManagerInfo'
import Step3_PropertyInfo from './steps/Step3_PropertyInfo'
import Step4_EvictionCause from './steps/Step4_EvictionCause'
import Step5_NoticeRequest from './steps/Step5_NoticeRequest'
import Step6_FeeReview from './steps/Step6_FeeReview'
import Step7_PaymentAuthorization from './steps/Step7_PaymentAuthorization'
import Step7_Documents from './steps/Step7_Documents'
import Step8_Confirmation from './steps/Step8_Confirmation'

const STEPS = [
  { label: 'Owner',    description: 'Property Owner Information' },
  { label: 'Manager', description: 'Property Manager Information' },
  { label: 'Property', description: 'Property & Tenant Details' },
  { label: 'Eviction', description: 'Cause for Eviction' },
  { label: 'Notice',   description: 'Notice Request' },
  { label: 'Fees',     description: 'Fee Estimate' },
  { label: 'Payment', description: 'Payment Authorization' },
  { label: 'Documents', description: 'Upload Documents' },
  { label: 'Confirm',  description: 'Submit & Confirm' },
]

export default function IntakeWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardState, setWizardState] = useState<IntakeWizardState>({})

  const goNext = () => setCurrentStep(s => Math.min(s + 1, STEPS.length))
  const goBack = () => setCurrentStep(s => Math.max(s - 1, 1))

  const updateState = (patch: Partial<IntakeWizardState>) => {
    setWizardState(prev => ({ ...prev, ...patch }))
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-[#1e3a5f]">
          Client Intake Form
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Please complete all required fields. Your progress is saved as you advance through each step.
        </p>
      </div>

      <StepIndicator steps={STEPS} currentStep={currentStep} />

      <div className="card">
        <h2 className="section-title">
          Step {currentStep}: {STEPS[currentStep - 1].description}
        </h2>

        {currentStep === 1 && (
          <Step1_OwnerInfo
            defaultValues={wizardState.step1}
            onNext={data => { updateState({ step1: data }); goNext() }}
          />
        )}
        {currentStep === 2 && (
          <Step2_ManagerInfo
            defaultValues={wizardState.step2}
            onNext={data => { updateState({ step2: data }); goNext() }}
            onBack={goBack}
          />
        )}
        {currentStep === 3 && (
          <Step3_PropertyInfo
            defaultValues={wizardState.step3}
            onNext={data => { updateState({ step3: data }); goNext() }}
            onBack={goBack}
          />
        )}
        {currentStep === 4 && (
          <Step4_EvictionCause
            defaultValues={wizardState.step4}
            onNext={data => { updateState({ step4: data }); goNext() }}
            onBack={goBack}
          />
        )}
        {currentStep === 5 && (
          <Step5_NoticeRequest
            defaultValues={wizardState.step5}
            property={wizardState.step3}
            onNext={data => { updateState({ step5: data }); goNext() }}
            onBack={goBack}
          />
        )}
        {currentStep === 6 && (
          <Step6_FeeReview
            wizardState={wizardState}
            onNext={feeEstimate => { updateState({ feeEstimate }); goNext() }}
            onBack={goBack}
          />
        )}
        {currentStep === 7 && (
          <Step7_PaymentAuthorization
            defaultValues={wizardState.paymentAuthorization}
            onNext={data => { updateState({ paymentAuthorization: data }); goNext() }}
            onBack={goBack}
          />
        )}
        {currentStep === 8 && (
          <Step7_Documents
            wizardState={wizardState}
            onPrepared={(refNum, documents) => updateState({
              createdCaseId: undefined,
              referenceNumber: refNum,
              documents,
            })}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {currentStep === 9 && (
          <Step8_Confirmation
            wizardState={wizardState}
            onBack={goBack}
          />
        )}
      </div>

      {/* Legal disclaimer */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        By submitting this form you confirm the information provided is true and accurate.
        Incorrect or incomplete information may result in delay or loss of case.
      </p>
    </div>
  )
}
