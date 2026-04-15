/**
 * Shared react-hook-form validation helpers.
 */

/**
 * Validates a US phone or fax number.
 * Strips common formatting characters (spaces, dashes, dots, parens) then
 * requires exactly 10 digits.  Returns true when the field is empty so that
 * optional fields can use this rule without also marking the field required.
 */
export function validatePhone(value: string | undefined): true | string {
  if (!value || value.trim() === '') return true
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 10) {
    return 'Must be a 10-digit US phone number (digits only)'
  }
  return true
}
