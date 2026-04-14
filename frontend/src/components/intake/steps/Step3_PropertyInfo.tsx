import { useForm, useFieldArray } from 'react-hook-form'
import { PropertyLocation, PropertyLocationLabels, type Step3_PropertyData } from '../../../types/intake'
import { FormField, Input, Select, Checkbox, Radio } from '../../common/FormField'

interface Props {
  defaultValues?: Step3_PropertyData
  onNext: (data: Step3_PropertyData) => void
  onBack: () => void
}

const defaultTenant = { fullName: '', race: '', height: '', weight: '', hairColor: '',
  facialHair: '', eyes: '', hairstyle: '', carDescription: '', comments: '' }

export default function Step3_PropertyInfo({ defaultValues, onNext, onBack }: Props) {
  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<Step3_PropertyData>({
    defaultValues: defaultValues ?? {
      isResidential: true,
      isCommercial: false,
      location: PropertyLocation.Sacramento,
      hasWrittenAgreement: false,
      isVerbalOnly: false,
      noAgreement: false,
      isTermLease: false,
      isMonthToMonth: true,
      hasAB1482Exemption: false,
      hasTenantsBeenAdded: false,
      constructedWithinLast15Years: false,
      isSection8OrSubsidy: false,
      isForeclosure: false,
      tenants: [{ ...defaultTenant }],
    }
  })

  const { fields: tenants, append, remove } = useFieldArray({ control, name: 'tenants' })
  const hasTenantsBeenAdded = watch('hasTenantsBeenAdded')
  const isForeclosure = watch('isForeclosure')

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">

      {/* Property basics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Property Address" required error={errors.address?.message} className="sm:col-span-2">
          <Input
            {...register('address', { required: 'Property address is required' })}
            error={!!errors.address}
            placeholder="Street, City, State, Zip"
          />
        </FormField>

        <FormField label="Gate Code (if any)">
          <Input {...register('gateCode')} placeholder="e.g. #1234" />
        </FormField>
      </div>

      {/* Property type & location */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="form-label">Property Type</legend>
          <div className="flex gap-4 mt-1">
            <Radio label="Residential" value="residential" {...register('isResidential')} />
            <Radio label="Commercial" value="commercial" {...register('isCommercial')} />
          </div>
        </fieldset>

        <FormField label="Location / Jurisdiction" required>
          <Select {...register('location', { valueAsNumber: true })}>
            {Object.entries(PropertyLocationLabels).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Select>
        </FormField>
      </div>

      {/* Tenant info */}
      <div>
        <h3 className="section-title">Known Adult Tenants <span className="text-red-500">*</span></h3>

        {tenants.map((field, index) => (
          <div key={field.id} className="mb-4 rounded border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-sm text-gray-700">Tenant #{index + 1}</span>
              {index > 0 && (
                <button type="button" onClick={() => remove(index)}
                  className="text-xs text-red-500 hover:text-red-700">Remove</button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Full Name" required className="sm:col-span-2">
                <Input
                  {...register(`tenants.${index}.fullName`, { required: 'Tenant name required' })}
                  placeholder="Full legal name"
                />
              </FormField>
              <FormField label="Race / Ethnicity (for process server)">
                <Input {...register(`tenants.${index}.race`)} />
              </FormField>
              <FormField label="Height">
                <Input {...register(`tenants.${index}.height`)} placeholder={`e.g. 5'10"`} />
              </FormField>
              <FormField label="Weight">
                <Input {...register(`tenants.${index}.weight`)} placeholder="e.g. 180 lbs" />
              </FormField>
              <FormField label="Hair Color">
                <Input {...register(`tenants.${index}.hairColor`)} />
              </FormField>
              <FormField label="Facial Hair">
                <Input {...register(`tenants.${index}.facialHair`)} placeholder="Beard, mustache, clean shaven" />
              </FormField>
              <FormField label="Eyes">
                <Input {...register(`tenants.${index}.eyes`)} />
              </FormField>
              <FormField label="Hairstyle">
                <Input {...register(`tenants.${index}.hairstyle`)} placeholder="Short, long, braided, shaved, etc." />
              </FormField>
              <FormField label="Car (make/model/color)">
                <Input {...register(`tenants.${index}.carDescription`)} />
              </FormField>
              <FormField label="Comments" className="sm:col-span-2">
                <Input {...register(`tenants.${index}.comments`)} />
              </FormField>
            </div>
          </div>
        ))}

        <button type="button" onClick={() => append({ ...defaultTenant })}
          className="text-sm text-[#1e3a5f] hover:underline font-medium">
          + Add Another Tenant
        </button>
      </div>

      {/* Tenancy dates & rent */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Tenant Move-In Date">
          <Input {...register('tenantMoveInDate')} type="date" />
        </FormField>
        <FormField label="Original Monthly Rent ($)">
          <Input {...register('originalMonthlyRent', { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="0.00" />
        </FormField>
        <FormField label="Current Rent ($)" hint="Excluding utilities & late fees">
          <Input {...register('currentRent', { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="0.00" />
        </FormField>
      </div>

      {/* Rent history */}
      <div>
        <h3 className="section-title text-base">Rent History (AB 1482 / Rent Control Compliance)</h3>
        <p className="text-xs text-gray-500 mb-3">If rent has been changed or increased, fill in amounts before these dates:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[2020, 2021, 2022, 2023, 2024, 2025].map(year => (
            <FormField key={year} label={`Before 6/30/${year} ($)`}>
              <Input
                {...register(`rentBefore_${year}` as keyof Step3_PropertyData, { valueAsNumber: true })}
                type="number" step="0.01" min="0" placeholder="0.00"
              />
            </FormField>
          ))}
        </div>
      </div>

      {/* Rental agreement type */}
      <div>
        <h3 className="section-title text-base">Rental Agreement</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Checkbox label="Yes, written agreement (please upload)" {...register('hasWrittenAgreement')} />
          <Checkbox label="Verbal only" {...register('isVerbalOnly')} />
          <Checkbox label="No agreement" {...register('noAgreement')} />
          <Checkbox label="Includes AB1482 exemption" {...register('hasAB1482Exemption')} />
        </div>
        <div className="flex gap-6 mt-3">
          <Radio label="Term Lease" value="term" {...register('isTermLease')} />
          <Radio label="Month-to-Month" value="m2m" {...register('isMonthToMonth')} />
        </div>
      </div>

      {/* Additional flags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Checkbox label="Tenants have been added to rental" {...register('hasTenantsBeenAdded')} />
        <Checkbox label="Property constructed within last 15 years" {...register('constructedWithinLast15Years')} />
        <Checkbox label="Tenancy under Section 8 or other subsidy" {...register('isSection8OrSubsidy')} />
        <Checkbox label="Foreclosure case (Trustee's deed required)" {...register('isForeclosure')} />
      </div>

      {hasTenantsBeenAdded && (
        <FormField label="Added Tenant Move-In Date">
          <Input {...register('addedTenantMoveInDate')} type="date" />
        </FormField>
      )}

      {isForeclosure && (
        <div className="rounded bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          Please upload the Trustee's Deed in the Documents step.
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="btn-secondary">← Back</button>
        <button type="submit" className="btn-primary">Continue to Step 4 →</button>
      </div>
    </form>
  )
}
