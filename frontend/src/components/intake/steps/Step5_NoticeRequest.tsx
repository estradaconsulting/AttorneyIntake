import { useForm } from 'react-hook-form'
import {
  NoticeType, NoticeTypeLabels,
  type Step5_NoticeRequestData,
  type Step3_PropertyData,
} from '../../../types/intake'
import { FormField, Input, Select, Textarea, Checkbox, Radio } from '../../common/FormField'
import { validatePhone } from '../../../utils/validation'

interface Props {
  defaultValues?: Step5_NoticeRequestData
  property?: Step3_PropertyData
  onNext: (data: Step5_NoticeRequestData) => void
  onBack: () => void
}

export default function Step5_NoticeRequest({ defaultValues, onNext, onBack }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Step5_NoticeRequestData>({
    defaultValues: defaultValues ?? {
      wantsNoticePrep: false,
      isResidential: true,
      isCommercial: false,
      hasWrittenAgreement: false,
      isVerbalOnly: false,
      noAgreement: false,
      paymentDueOnFirst: true,
      paymentByMailOnly: false,
    }
  })

  const wantsNoticePrep = watch('wantsNoticePrep')
  const selectedNoticeType = watch('noticeType')

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">

      <div className="alert-info">
        <strong>Do you need the law office to prepare and serve a notice?</strong>
        <p className="mt-1 text-xs">
          If you already have a valid notice that has been properly served, you can skip this step.
          If you need the office to write and serve the notice for your tenant(s), complete this section.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Radio
          label="I already have a valid notice — skip this step"
          value="false"
          {...register('wantsNoticePrep', { setValueAs: v => v === 'true' })}
        />
        <Radio
          label="Please prepare and serve a notice for me (fill in details below)"
          value="true"
          {...register('wantsNoticePrep', { setValueAs: v => v === 'true' })}
        />
      </div>

      {wantsNoticePrep && (
        <div className="space-y-5 border-l-4 border-[#8b1414] pl-5">

          {/* Owner contact for notice form (page 6) */}
          <div>
            <h3 className="section-title text-sm">Owner Contact (for Notice)</h3>
            <p className="text-xs text-gray-500 mb-3">
              The address and phone below appear on the notice delivered to your tenant.
              Leave blank to use the information from Step 1.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Billing Address" hint="To include City/State/Zip" className="sm:col-span-2">
                <Input {...register('ownerBillingAddress')} placeholder="Street, City, State, Zip (if different from owner address)" />
              </FormField>
              <FormField label="Alternative Phone #" error={errors.ownerAlternativePhone?.message}>
                <Input
                  {...register('ownerAlternativePhone', { validate: validatePhone })}
                  type="tel"
                  placeholder="Optional"
                  error={!!errors.ownerAlternativePhone}
                />
              </FormField>
              <FormField label="Fax #" error={errors.ownerFax?.message}>
                <Input
                  {...register('ownerFax', { validate: validatePhone })}
                  type="tel"
                  placeholder="Optional"
                  error={!!errors.ownerFax}
                />
              </FormField>
            </div>
          </div>

          {/* Property type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Property Type">
              <div className="flex gap-4 mt-1">
                <Radio label="Residential" value="residential" {...register('isResidential')} />
                <Radio label="Commercial" value="commercial" {...register('isCommercial')} />
              </div>
            </FormField>
          </div>

          {/* Notice type */}
          <FormField label="Notice Type to Serve" required>
            <Select {...register('noticeType', { valueAsNumber: true })}>
              <option value="">— Select notice type —</option>
              {Object.entries(NoticeTypeLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </Select>
          </FormField>

          {selectedNoticeType === NoticeType.Other && (
            <FormField label="Specify notice type">
              <Input {...register('otherNoticeSpecification')} placeholder="Describe the notice" />
            </FormField>
          )}

          {/* Tenant / property */}
          <FormField label="Tenant Property Address" required hint="Include City/State/Zip and gate code">
            <Input {...register('tenantPropertyAddress')} placeholder="Street, City, State, Zip — Gate Code: #____" />
          </FormField>

          {/* Rent amounts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Monthly Rent ($)">
              <Input {...register('monthlyRent', { valueAsNumber: true })}
                type="number" step="0.01" min="0" placeholder="0.00" />
            </FormField>
            <FormField label="Current Balance Due ($)"
              hint="Within 11 months, NO late fees">
              <Input {...register('currentBalanceDue', { valueAsNumber: true })}
                type="number" step="0.01" min="0" placeholder="0.00" />
            </FormField>
          </div>

          <FormField label="How was balance calculated?" hint="Include unpaid months">
            <Textarea {...register('balanceCalculationExplanation')}
              placeholder="e.g. April–June 2025 unpaid @ $1,500/mo = $4,500" />
          </FormField>

          {/* Payment details */}
          <h3 className="section-title text-sm">Payment Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Method of Payment Usually Used by Tenant">
              <Input {...register('methodOfPayment')} placeholder="e.g. check, Zelle, money order" />
            </FormField>
            <FormField label="Person/Business to Receive Payment">
              <Input {...register('paymentRecipient')} placeholder="Owner or management company name" />
            </FormField>
          </div>

          <FormField label="Address Where Payment is to be Delivered">
            <Input {...register('paymentDeliveryAddress')} placeholder="Full address" />
          </FormField>

          <FormField label="Alternative Payment Address (if different)">
            <Input {...register('alternatePaymentAddress')} />
          </FormField>

          <div className="flex flex-wrap gap-4">
            <Checkbox label="Payment due on the 1st of each month" {...register('paymentDueOnFirst')} />
            <Checkbox label="Payment by mail only" {...register('paymentByMailOnly')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Phone # for Tenant to Reach You" error={errors.tenantContactPhone?.message}>
              <Input
                {...register('tenantContactPhone', { validate: validatePhone })}
                type="tel"
                placeholder="(916) 000-0000"
                error={!!errors.tenantContactPhone}
              />
            </FormField>
            <FormField label="Usual Days & Hours for Payment Delivery">
              <Input {...register('usualPaymentDaysHours')} placeholder="e.g. Mon–Fri 9am–5pm" />
            </FormField>
          </div>

          <FormField label="Other Causes for Notice (if any)">
            <Textarea {...register('otherCausesForNotice')} rows={2} />
          </FormField>

          {/* Rental agreement */}
          <h3 className="section-title text-sm">Rental Agreement</h3>
          <div className="flex flex-wrap gap-4">
            <Checkbox label="Yes, written (please upload)" {...register('hasWrittenAgreement')} />
            <Checkbox label="Verbal only" {...register('isVerbalOnly')} />
            <Checkbox label="No agreement" {...register('noAgreement')} />
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="btn-secondary">← Back</button>
        <button type="submit" className="btn-primary">Continue to Step 6 →</button>
      </div>
    </form>
  )
}
