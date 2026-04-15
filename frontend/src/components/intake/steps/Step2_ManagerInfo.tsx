import { useForm } from 'react-hook-form'
import type { Step2_ManagerData } from '../../../types/intake'
import { FormField, Input, Checkbox } from '../../common/FormField'
import { validatePhone } from '../../../utils/validation'

interface Props {
  defaultValues?: Step2_ManagerData
  onNext: (data: Step2_ManagerData) => void
  onBack: () => void
}

export default function Step2_ManagerInfo({ defaultValues, onNext, onBack }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Step2_ManagerData>({
    defaultValues: defaultValues ?? { hasManager: false },
  })

  const hasManager = watch('hasManager')

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <p className="text-sm text-gray-600">
        If a property manager handles this property on the owner's behalf, provide their information below.
      </p>

      <Checkbox
        label="This property has a property manager / management company"
        {...register('hasManager')}
      />

      {hasManager && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-l-4 border-blue-100 pl-4">
          <FormField
            label="Property Manager's Name"
            required
            error={errors.name?.message}
            className="sm:col-span-2"
          >
            <Input
              {...register('name', { required: 'Manager name is required' })}
              placeholder="Full name"
              error={!!errors.name}
            />
          </FormField>

          <FormField
            label="Management Company"
            required
            error={errors.company?.message}
          >
            <Input
              {...register('company', { required: 'Company name is required' })}
              placeholder="Company name"
              error={!!errors.company}
            />
          </FormField>

          <FormField
            label="Manager's Phone #"
            required
            error={errors.phone?.message}
          >
            <Input
              {...register('phone', {
                required: 'Phone number is required',
                validate: validatePhone,
              })}
              type="tel"
              placeholder="(916) 000-0000"
              error={!!errors.phone}
            />
          </FormField>

          <FormField label="Manager's Address" className="sm:col-span-2">
            <Input {...register('address')} placeholder="Street, City, State, Zip" />
          </FormField>

          <FormField
            label="Manager's Email"
            required
            error={errors.email?.message}
            className="sm:col-span-2"
          >
            <Input
              {...register('email', {
                required: 'Email address is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
              })}
              type="email"
              placeholder="manager@example.com"
              error={!!errors.email}
            />
          </FormField>

          <FormField label="Manager's Fax" error={errors.fax?.message} className="sm:col-span-2">
            <Input
              {...register('fax', { validate: validatePhone })}
              type="tel"
              placeholder="Optional fax number"
              error={!!errors.fax}
            />
          </FormField>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="btn-secondary">
          ← Back
        </button>
        <button type="submit" className="btn-primary">
          Continue to Step 3 →
        </button>
      </div>
    </form>
  )
}
