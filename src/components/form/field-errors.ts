/**
 * Mapping a `ValidationApiError` onto form state.
 *
 * payzeno-api returns `field_errors[]` with a dotted path into the *request body*
 * (`payment_method.exp_month`). Form field names are flat and camel-cased. This module is the
 * one translation layer between the two, so a rename on either side breaks in exactly one
 * place.
 *
 * a11y consequence, which is why this file exists at all: an error that cannot be attributed
 * to a field has to be rendered as a form-level message and focus has to move to it. Silently
 * dropping an unmapped `field_errors` entry means the user gets a rejected form with no
 * explanation anywhere on screen.
 */
import type { FieldError } from '@payzeno/contracts';

import { ValidationApiError, isConsoleApiError } from '@api/errors';

/** `payment_method.exp_month` → `paymentMethodExpMonth`. */
export function pathToFieldName(path: string): string {
  return path
    .split('.')
    .flatMap((segment) => segment.split('_'))
    .filter(Boolean)
    .map((segment, index) => (index === 0 ? segment : segment.charAt(0).toUpperCase() + segment.slice(1)))
    .join('');
}

export interface FormErrors {
  /** Field name → first message for that field. */
  fields: Record<string, string>;
  /** Everything that could not be attributed to a field on this form. */
  formLevel: string[];
  /** Field name of the first error, for focus management. */
  firstField: string | null;
}

export const NO_ERRORS: FormErrors = { fields: {}, formLevel: [], firstField: null };

/**
 * Split `field_errors` into per-field and form-level messages.
 *
 * @param knownFields the field names this form actually renders. Anything outside it becomes a
 * form-level message rather than vanishing.
 */
export function mapFieldErrors(
  errors: ReadonlyArray<FieldError>,
  knownFields: ReadonlyArray<string>,
): FormErrors {
  const known = new Set(knownFields);
  const fields: Record<string, string> = {};
  const formLevel: string[] = [];
  let firstField: string | null = null;

  for (const error of errors) {
    const name = pathToFieldName(error.path);

    if (known.has(name)) {
      if (fields[name] === undefined) fields[name] = error.message;
      if (firstField === null) firstField = name;
    } else {
      formLevel.push(`${error.path}: ${error.message}`);
    }
  }

  return { fields, formLevel, firstField };
}

/**
 * Turn any thrown value into `FormErrors`.
 *
 * A 422 becomes field errors. A 400 becomes a single form-level message. Anything else is not
 * this form's problem and is rethrown for the error boundary — swallowing a 502 into a form
 * message is how "Save failed" ended up being the only diagnostic for an upstream outage.
 */
export function toFormErrors(error: unknown, knownFields: ReadonlyArray<string>): FormErrors {
  if (error instanceof ValidationApiError) {
    return mapFieldErrors(error.fieldErrors, knownFields);
  }

  if (isConsoleApiError(error) && error.status === 400) {
    return { fields: {}, formLevel: [error.message], firstField: null };
  }

  if (isConsoleApiError(error) && error.status === 409) {
    return { fields: {}, formLevel: [error.message], firstField: null };
  }

  throw error;
}

/** `aria-describedby` value for a field: its error id when it has one, otherwise the hint. */
export function describedBy(
  fieldName: string,
  errors: FormErrors,
  hintId?: string,
): string | undefined {
  const ids: string[] = [];
  if (errors.fields[fieldName] !== undefined) ids.push(errorIdFor(fieldName));
  if (hintId) ids.push(hintId);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

export function errorIdFor(fieldName: string): string {
  return `${fieldName}-error`;
}

export function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors.fields).length > 0 || errors.formLevel.length > 0;
}
