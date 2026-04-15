import { useForm } from 'react-hook-form'
import type { PaymentAuthorizationData } from '../../../types/intake'
import { FormField, Input, Textarea, Checkbox, Radio } from '../../common/FormField'
import { validatePhone } from '../../../utils/validation'

interface Props {
  defaultValues?: PaymentAuthorizationData
  onNext: (data: PaymentAuthorizationData) => void
  onBack: () => void
}

export default function Step7_PaymentAuthorization({ defaultValues, onNext, onBack }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PaymentAuthorizationData>({
    defaultValues: defaultValues ?? {
      acknowledgeOfficeWillCollectCardLater: false,
      cardholderName: '',
      billingPhone: '',
      billingZip: '',
      preferredFollowUp: 'phone',
      notes: '',
    },
  })

  const acknowledged = watch('acknowledgeOfficeWillCollectCardLater')

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="rounded border border-[#d4ddd0] bg-[#f7faf5] p-4 text-sm text-gray-700">
        <p className="font-semibold text-[#1e3a5f]">Payment Authorization Placeholder</p>
        <p className="mt-2">
          This step is only collecting the authorization details we need for the intake packet.
          Card numbers, expiration dates, and CVV codes are not stored here. The law office will
          collect payment securely later.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Cardholder Name"
          required
          error={errors.cardholderName?.message}
          className="sm:col-span-2"
        >
          <Input
            {...register('cardholderName', { required: 'Cardholder name is required' })}
            error={!!errors.cardholderName}
            placeholder="Name as it appears on the card"
          />
        </FormField>

        <FormField label="Best Billing Phone #" error={errors.billingPhone?.message}>
          <Input
            {...register('billingPhone', { validate: validatePhone })}
            type="tel"
            placeholder="(916) 000-0000"
            error={!!errors.billingPhone}
          />
        </FormField>

        <FormField label="Billing Zip Code">
          <Input {...register('billingZip')} placeholder="ZIP code" />
        </FormField>

        <FormField label="Authorized Amount ($)">
          <Input
            {...register('authorizedAmount', { valueAsNumber: true })}
            type="number"
            min="0"
            step="0.01"
            placeholder="Optional amount to authorize"
          />
        </FormField>

        <div>
          <label className="form-label">Preferred Follow-Up Method</label>
          <div className="flex gap-4 mt-1">
            <Radio label="Phone" value="phone" {...register('preferredFollowUp')} />
            <Radio label="Email" value="email" {...register('preferredFollowUp')} />
          </div>
        </div>

        <FormField label="Payment Notes" className="sm:col-span-2">
          <Textarea
            {...register('notes')}
            placeholder="Optional notes about billing contact, authorization limits, or follow-up instructions"
          />
        </FormField>
      </div>

      <Checkbox
        label="I understand the office will collect my card details securely later, and this form should not store raw credit card information."
        {...register('acknowledgeOfficeWillCollectCardLater', {
          required: 'Please confirm the payment authorization notice before continuing',
        })}
      />
      {errors.acknowledgeOfficeWillCollectCardLater && (
        <p className="form-error">{errors.acknowledgeOfficeWillCollectCardLater.message}</p>
      )}

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button type="submit" disabled={!acknowledged} className="btn-primary">
          Continue to Documents
        </button>
      </div>
    </form>
  )
}
