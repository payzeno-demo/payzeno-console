/**
 * A very small form hook over zod.
 *
 * We deliberately did not adopt react-hook-form: the console has eleven forms, none of them
 * with more than six fields, and the bundle cost plus the resolver plumbing was not worth it
 * (ADR discussion on PAY-1744, tflexbox and rrefactor agreeing for once).
 *
 * What this does give us, and what a hand-rolled `useState` per field does not:
 *  - validation on blur and on submit, never on every keystroke (which is hostile);
 *  - a single place where a `ValidationApiError` from the server merges into the same error
 *    map as the client-side schema, so the rendering path is identical;
 *  - `fieldProps(name)` returning the `aria-describedby` / `aria-invalid` pair, so a field
 *    cannot be wired up wrongly.
 */
import { useCallback, useMemo, useState } from 'react';
import type { z } from 'zod';

import { NO_ERRORS, describedBy, errorIdFor, toFormErrors } from './field-errors';
import type { FormErrors } from './field-errors';

export interface FieldProps {
  id: string;
  name: string;
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  onBlur: () => void;
  'aria-invalid': boolean | undefined;
  'aria-describedby': string | undefined;
}

export interface ZodForm<TValues extends Record<string, string>> {
  values: TValues;
  errors: FormErrors;
  isSubmitting: boolean;
  /** Set one field. Clears that field's error; does not re-validate until blur. */
  setValue: (name: keyof TValues & string, value: string) => void;
  /** Everything a controlled input needs, correctly wired for assistive technology. */
  fieldProps: (name: keyof TValues & string, hintId?: string) => FieldProps;
  /** Validate and, if valid, run `onValid`. Server validation errors land back in `errors`. */
  submit: (onValid: (parsed: unknown) => Promise<void> | void) => Promise<void>;
  reset: () => void;
  /** Merge a rejected mutation's errors in. Rethrows anything that is not 4xx-validation. */
  applyServerError: (error: unknown) => void;
}

export function useZodForm<TValues extends Record<string, string>>(
  schema: z.ZodTypeAny,
  initialValues: TValues,
  formId: string,
): ZodForm<TValues> {
  const [values, setValues] = useState<TValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>(NO_ERRORS);
  const [isSubmitting, setSubmitting] = useState(false);

  const fieldNames = useMemo(() => Object.keys(initialValues), [initialValues]);

  const setValue = useCallback((name: keyof TValues & string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (current.fields[name] === undefined) return current;
      const { [name]: _removed, ...rest } = current.fields;
      return { ...current, fields: rest };
    });
  }, []);

  /** Validate a single field on blur, by parsing the whole object and picking its issues. */
  const validateField = useCallback(
    (name: string) => {
      const result = schema.safeParse(values);
      if (result.success) return;

      const issue = result.error.issues.find((candidate) => candidate.path[0] === name);
      if (!issue) return;

      setErrors((current) => ({
        ...current,
        fields: { ...current.fields, [name]: issue.message },
        firstField: current.firstField ?? name,
      }));
    },
    [schema, values],
  );

  const fieldProps = useCallback(
    (name: keyof TValues & string, hintId?: string): FieldProps => ({
      id: `${formId}-${name}`,
      name,
      value: values[name] ?? '',
      onChange: (event) => setValue(name, event.target.value),
      onBlur: () => validateField(name),
      'aria-invalid': errors.fields[name] !== undefined ? true : undefined,
      'aria-describedby': describedBy(name, errors, hintId),
    }),
    [errors, formId, setValue, validateField, values],
  );

  const submit = useCallback(
    async (onValid: (parsed: unknown) => Promise<void> | void) => {
      const result = schema.safeParse(values);

      if (!result.success) {
        const fields: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const key = String(issue.path[0] ?? '');
          if (key && fields[key] === undefined) fields[key] = issue.message;
        }
        const first = Object.keys(fields)[0] ?? null;
        setErrors({ fields, formLevel: [], firstField: first });
        if (first) document.getElementById(`${formId}-${first}`)?.focus();
        return;
      }

      setErrors(NO_ERRORS);
      setSubmitting(true);
      try {
        await onValid(result.data);
      } catch (error) {
        const mapped = toFormErrors(error, fieldNames);
        setErrors(mapped);
        if (mapped.firstField) document.getElementById(`${formId}-${mapped.firstField}`)?.focus();
      } finally {
        setSubmitting(false);
      }
    },
    [fieldNames, formId, schema, values],
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors(NO_ERRORS);
  }, [initialValues]);

  return { values, errors, isSubmitting, setValue, fieldProps, submit, reset, applyServerError };
}

export { errorIdFor };
