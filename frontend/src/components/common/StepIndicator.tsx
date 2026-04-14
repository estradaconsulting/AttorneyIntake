import clsx from 'clsx'

interface Step {
  label: string
  description: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="mb-6">
      <ol className="flex flex-wrap gap-y-2 items-center">
        {steps.map((step, index) => {
          const stepNum = index + 1
          const isComplete = stepNum < currentStep
          const isCurrent = stepNum === currentStep
          return (
            <li key={step.label} className="flex items-center">
              {index > 0 && (
                <div className={clsx(
                  'h-0.5 w-4 sm:w-6 mx-1',
                  isComplete ? 'bg-[#8b1414]' : 'bg-[#d4ddd0]'
                )} />
              )}
              <div className="flex items-center gap-1.5" title={step.description}>
                <span className={clsx(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                  isComplete && 'step-complete',
                  isCurrent && 'step-current',
                  !isComplete && !isCurrent && 'step-pending'
                )}>
                  {isComplete ? '✓' : stepNum}
                </span>
                <span className={clsx(
                  'hidden md:block text-xs font-medium',
                  isCurrent && 'text-[#8b1414]',
                  isComplete && 'text-gray-600',
                  !isComplete && !isCurrent && 'text-gray-400'
                )}>
                  {step.label}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
      {/* Current step description on mobile */}
      <p className="mt-2 text-sm text-gray-500 md:hidden">
        Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.description}
      </p>
    </nav>
  )
}
