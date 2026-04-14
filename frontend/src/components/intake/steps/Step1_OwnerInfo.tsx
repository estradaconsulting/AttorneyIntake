import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { OwnerType, OwnerTypeLabels, type Step1_OwnerData } from '../../../types/intake'
import { FormField, Input } from '../../common/FormField'

interface Props {
  defaultValues?: Step1_OwnerData
  onNext: (data: Step1_OwnerData) => void
}

// Text-only fields that react-hook-form manages
interface TextFields {
  name: string
  address: string
  phone: string
  alternatePhone: string
  email: string
  fax: string
  trusteeName: string
}

export default function Step1_OwnerInfo({ defaultValues, onNext }: Props) {
  // Manage owner-type checkboxes with plain React state —
  // this avoids react-hook-form's unreliable checkbox-array tracking.
  const [selectedTypes, setSelectedTypes] = useState<number[]>(
    defaultValues?.ownerTypes?.map(Number) ?? []
  )
  const [typeError, setTypeError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TextFields>({
    defaultValues: {
      name: defaultValues?.name ?? '',
      address: defaultValues?.address ?? '',
      phone: defaultValues?.phone ?? '',
      alternatePhone: defaultValues?.alternatePhone ?? '',
      email: defaultValues?.email ?? '',
      fax: defaultValues?.fax ?? '',
      trusteeName: defaultValues?.trusteeName ?? '',
    },
    mode: 'onChange',
  })

  const needsTrustee =
    selectedTypes.includes(OwnerType.FamilyTrust) ||
    selectedTypes.includes(OwnerType.RealEstateInvestmentTrust)

  function toggleType(value: number) {
    setTypeError(null)
    setSelectedTypes(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const onSubmit = (textData: TextFields) => {
    if (selectedTypes.length === 0) {
      setTypeError('Please select at least one owner type')
      return
    }
    onNext({
      ...textData,
      ownerTypes: selectedTypes as OwnerType[],
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Property Owner's Full Name"
          required
          error={errors.name?.message}
          className="sm:col-span-2"
        >
          <Input
            {...register('name', { required: "Owner's name is required" })}
            error={!!errors.name}
            placeholder="Full legal name"
          />
        </FormField>

        <FormField label="Owner's Address" className="sm:col-span-2">
          <Input {...register('address')} placeholder="Street, City, State, Zip" />
        </FormField>

        <FormField label="Telephone #">
          <Input {...register('phone')} type="tel" placeholder="(916) 000-0000" />
        </FormField>

        <FormField label="Alternate Phone #">
          <Input {...register('alternatePhone')} type="tel" placeholder="Optional alternate number" />
        </FormField>

        <FormField label="Email Address">
          <Input {...register('email')} type="email" placeholder="you@example.com" />
        </FormField>

        <FormField label="Fax #">
          <Input {...register('fax')} type="tel" placeholder="Optional fax number" />
        </FormField>
      </div>

      {/* Owner Type checkboxes — controlled via useState, no RHF involvement */}
      <fieldset>
        <legend className="form-label">
          The Owner is <span className="text-red-500">*</span> (check all that apply)
        </legend>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.entries(OwnerTypeLabels) as [string, string][]).map(([val, label]) => {
            const numVal = Number(val)
            return (
              <label key={val} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                  checked={selectedTypes.includes(numVal)}
                  onChange={() => toggleType(numVal)}
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            )
          })}
        </div>
        {typeError && <p className="form-error mt-1">{typeError}</p>}
      </fieldset>

      {needsTrustee && (
        <FormField label="Name of Trustee" required error={errors.trusteeName?.message}>
          <Input
            {...register('trusteeName', {
              required: 'Trustee name is required for Trust / REIT',
            })}
            placeholder="Full name of trustee"
          />
        </FormField>
      )}

      <div className="flex justify-end pt-4">
        <button type="submit" className="btn-primary">
          Continue to Step 2 →
        </button>
      </div>
    </form>
  )
}
