import clsx from 'clsx'
import { forwardRef, type ReactNode } from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

export function FormField({ label, required, error, hint, children, className }: FormFieldProps) {
  return (
    <div className={clsx('', className)}>
      <label className="form-label">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
// Must use forwardRef so react-hook-form's ref (used for value reading and
// focus management) is properly connected to the underlying DOM element.

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx('form-input', error && 'form-input-error', className)}
      {...props}
    />
  )
)
Input.displayName = 'Input'

// ── Select ────────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  children: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={clsx('form-input bg-white', error && 'form-input-error', className)}
      {...props}
    >
      {children}
    </select>
  )
)
Select.displayName = 'Select'

// ── Textarea ──────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={3}
      className={clsx('form-input resize-y', error && 'form-input-error', className)}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

// ── Checkbox ──────────────────────────────────────────────────────────────────

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, ...props }, ref) => (
    <label className={clsx('flex items-start gap-2 cursor-pointer', className)}>
      <input
        ref={ref}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
        {...props}
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
)
Checkbox.displayName = 'Checkbox'

// ── Radio ─────────────────────────────────────────────────────────────────────

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className, ...props }, ref) => (
    <label className={clsx('flex items-center gap-2 cursor-pointer', className)}>
      <input
        ref={ref}
        type="radio"
        className="h-4 w-4 border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
        {...props}
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
)
Radio.displayName = 'Radio'
