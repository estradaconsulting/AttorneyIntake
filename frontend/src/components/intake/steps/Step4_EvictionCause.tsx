import { useForm } from 'react-hook-form'
import type { Step4_EvictionCauseData } from '../../../types/intake'
import { FormField, Input, Textarea, Checkbox, Radio } from '../../common/FormField'

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
      rentalAssistanceDeclarantRole: 'owner',
    }
  })

  const noticeServed = watch('noticeServed')
  const rentAccepted = watch('rentAcceptedAfterNoticeExpired')
  const nonMilitaryConfirmed = watch('nonMilitaryConfirmed')
  const nonMilitaryStatusBasis = watch('nonMilitaryStatusBasis')

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

      {/* Rental assistance disclosures (UD-101 Q12 / UD-120) */}
      <div>
        <h3 className="section-title">Rental Assistance Statements (UD-101 Q12)</h3>
        <p className="text-xs text-gray-500 mb-4">
          Required for all cases based on non-payment of rent. Answer each question as it
          will appear on the mandatory court cover sheet (UD-101).
        </p>

        {/* Helper to render a single Yes/No question matching UD-101 format */}
        {([
          {
            field: 'receivedRentalAssistanceForNoticeAmount' as const,
            question: 'a. Has plaintiff received rental assistance or other financial compensation corresponding to the amount demanded in the notice?',
          },
          {
            field: 'receivedRentalAssistanceAfterNoticeDate' as const,
            question: 'b. Has plaintiff received rental assistance or other financial compensation for rent accruing after the date of the notice?',
          },
          {
            field: 'pendingApplicationForNoticeAmount' as const,
            question: 'c. Does plaintiff have any pending application for rental assistance corresponding to the amount demanded in the notice?',
          },
          {
            field: 'pendingApplicationAfterNoticeDate' as const,
            question: 'd. Does plaintiff have any pending application for rental assistance for rent accruing after the date of the notice?',
          },
        ] as const).map(({ field, question }) => (
          <div key={field} className="mb-4 rounded border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm text-gray-700 mb-2">{question}</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" value="true"
                  {...register(field, { setValueAs: (v: string) => v === 'true' })}
                  className="text-[#8b1414]" />
                <span className="text-red-700 font-medium">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" value="false"
                  {...register(field, { setValueAs: (v: string) => v === 'true' })}
                  className="text-[#1e3a5f]" />
                <span className="text-green-700 font-medium">No</span>
              </label>
            </div>
          </div>
        ))}

        <div className="mt-2 border-l-4 border-[#d4ddd0] pl-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Who will sign the rental assistance verification (UD-120)?
          </p>
          <div className="flex flex-wrap gap-4">
            <Radio label="Property Owner" value="owner"
              {...register('rentalAssistanceDeclarantRole')} />
            <Radio label="Property Manager" value="manager"
              {...register('rentalAssistanceDeclarantRole')} />
          </div>
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

        {nonMilitaryConfirmed && (
          <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Basis for non-military declaration
              </p>
              <div className="space-y-2">
                <Radio
                  label="I checked military status through public records / DMDC."
                  value="a"
                  {...register('nonMilitaryStatusBasis', { required: 'Please select a basis for the declaration' })}
                />
                <Radio
                  label="I am in regular communication with the defendant/respondent and know they are not in military service."
                  value="b"
                  {...register('nonMilitaryStatusBasis', { required: 'Please select a basis for the declaration' })}
                />
                <Radio
                  label="I recently contacted the defendant/respondent and they said they are not in military service."
                  value="c"
                  {...register('nonMilitaryStatusBasis', { required: 'Please select a basis for the declaration' })}
                />
                <Radio
                  label="The defendant/respondent was discharged from military service on or about this date."
                  value="d"
                  {...register('nonMilitaryStatusBasis', { required: 'Please select a basis for the declaration' })}
                />
                <Radio
                  label="The defendant/respondent is not eligible because they are incarcerated or a business entity."
                  value="e"
                  {...register('nonMilitaryStatusBasis', { required: 'Please select a basis for the declaration' })}
                />
                <Radio
                  label="Other basis."
                  value="f"
                  {...register('nonMilitaryStatusBasis', { required: 'Please select a basis for the declaration' })}
                />
              </div>
              {errors.nonMilitaryStatusBasis && (
                <p className="form-error mt-1">{errors.nonMilitaryStatusBasis.message}</p>
              )}
            </div>

            {nonMilitaryStatusBasis === 'd' && (
              <FormField label="Approximate Discharge Date" required>
                <Input {...register('nonMilitaryDischargeDate', { required: 'Please provide the discharge date' })} type="date" />
              </FormField>
            )}

            {nonMilitaryStatusBasis === 'f' && (
              <FormField label="Other Basis Explanation" required>
                <Textarea
                  {...register('nonMilitaryOtherExplanation', { required: 'Please explain the basis used for the declaration' })}
                  placeholder="Describe how you know the tenant is not in active U.S. military service"
                />
              </FormField>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="btn-secondary">← Back</button>
        <button type="submit" className="btn-primary">Continue to Step 5 →</button>
      </div>
    </form>
  )
}
