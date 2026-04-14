import { useForm } from 'react-hook-form'
import type { Step2_ManagerData } from '../../../types/intake'
import { FormField, Input, Checkbox } from '../../common/FormField'

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
          <FormField label="Property Manager's Name" className="sm:col-span-2">
            <Input {...register('name')} placeholder="Full name" />
          </FormField>

          <FormField label="Management Company">
            <Input {...register('company')} placeholder="Company name" />
          </FormField>

          <FormField label="Manager's Phone #">
            <Input {...register('phone')} type="tel" placeholder="(916) 000-0000" />
          </FormField>

          <FormField label="Manager's Address" className="sm:col-span-2">
            <Input {...register('address')} placeholder="Street, City, State, Zip" />
          </FormField>

          <FormField label="Manager's Email" className="sm:col-span-2">
            <Input {...register('email')} type="email" placeholder="manager@example.com" />
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
