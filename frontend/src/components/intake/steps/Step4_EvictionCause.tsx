import { useForm } from 'react-hook-form'
import type { Step4_EvictionCauseData } from '../../../types/intake'
import { FormField, Input, Textarea, Checkbox } from '../../common/FormField'

interface Props {
  defaultValues?: Step4_EvictionCauseData
  onNext: (data: Step4_EvictionCauseData) => void
  onBack: () => void
}

export default function Step4_EvictionCause({ defaultValues, onNext, onBack }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Step4_EvictionCauseData>({
    defaultValues: defaultValues ?? {
      noticeServed: false,
      isSubjectToRentEvictionControl: false,
      rentAcceptedAfterNoticeExpired: false,
      receivedRentalAssistanceForNoticeAmount: false,
      receivedRentalAssistanceAfterNoticeDate: false,
      pendingApplicationForNoticeAmount: false,
      pendingApplicationAfterNoticeDate: false,
      nonMilitaryConfirmed: false,
    }
  })

  const noticeServed = watch('noticeServed')
  const rentAccepted = watch('rentAcceptedAfterNoticeExpired')

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">

      {/* Notice served */}
      <div className="space-y-3">
        <Checkbox label="A notice has already been served on the tenant(s)" {...register('noticeServed')} />

        {noticeServed && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-l-4 border-[#8b1414] pl-4">
            <FormField label="What form of notice was served?">
              <Input {...register('noticeForm')} placeholder="e.g. 3-Day Pay or Quit" />
            </FormField>

            <FormField label="Amount Owed at Time of Notice ($)"
              hint="Excluding late fees and utilities">
              <Input {...register('amountOwedAtNotice', { valueAsNumber: true })}
                type="number" step="0.01" min="0" placeholder="0.00" />
            </FormField>

            <FormField label="How was the rent balance calculated?" className="sm:col-span-2">
              <Textarea {...register('balanceCalculationExplanation')}
                placeholder="Describe how the balance was calculated (include unpaid months)" />
            </FormField>
          </div>
        )}
      </div>

      {/* Rent accepted after notice */}
      <div>
        <Checkbox
          label="Rent was accepted AFTER the notice expired (Note: this voids the notice)"
          {...register('rentAcceptedAfterNoticeExpired')}
        />
        {rentAccepted && (
          <div className="alert-warning mt-2">
            <strong>Important:</strong> Once any notice expires, no rent may be accepted or the notice is
            void. You must start over with a new notice. If your tenant direct deposits money, return the
            funds by check with certified mail and keep copies for proof.
          </div>
        )}
      </div>

      {/* Rent / eviction control */}
      <div className="space-y-3">
        <Checkbox
          label="This property is subject to rent control / eviction control"
          {...register('isSubjectToRentEvictionControl')}
        />

        {watch('isSubjectToRentEvictionControl') && (
          <div className="border-l-4 border-[#d4ddd0] pl-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Have all applicable rent/eviction control laws and ordinances been complied with?
            </p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" value="true" {...register('hasCompliedWithRentEvictionControlLaws')}
                  className="text-[#8b1414]" /> Yes
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" value="false" {...register('hasCompliedWithRentEvictionControlLaws')}
                  className="text-[#8b1414]" /> No
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Rental assistance disclosures (UD-101 / UD-120) */}
      <div>
        <h3 className="section-title">Rental Assistance Statements (Required)</h3>
        <p className="text-xs text-gray-500 mb-3">
          Required for all cases based on non-payment of rent (UD-101 / UD-120 compliance).
        </p>
        <div className="space-y-3">
          <Checkbox
            label="I have NOT received rental assistance corresponding to the amount demanded in the notice"
            {...register('receivedRentalAssistanceForNoticeAmount')}
          />
          <Checkbox
            label="I have NOT received rental assistance for rent accruing after the notice date"
            {...register('receivedRentalAssistanceAfterNoticeDate')}
          />
          <Checkbox
            label="I do NOT have a pending application for rental assistance for the notice amount"
            {...register('pendingApplicationForNoticeAmount')}
          />
          <Checkbox
            label="I do NOT have a pending application for rental assistance for rent after the notice date"
            {...register('pendingApplicationAfterNoticeDate')}
          />
        </div>
      </div>

      {/* Non-military declaration (CIV-100) */}
      <div>
        <h3 className="section-title">Non-Military Declaration (CIV-100 Q8)</h3>
        <Checkbox
          label="I confirm that no defendant/tenant is in active U.S. military service (required for default judgment)"
          {...register('nonMilitaryConfirmed')}
        />
        <p className="text-xs text-gray-500 mt-1">
          U.S. military status can be verified at{' '}
          <a href="https://scra.dmdc.osd.mil/" target="_blank" rel="noreferrer"
             className="text-[#8b1414] hover:underline">scra.dmdc.osd.mil</a>
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="btn-secondary">← Back</button>
        <button type="submit" className="btn-primary">Continue to Step 5 →</button>
      </div>
    </form>
  )
}
