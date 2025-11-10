/**
 * The form element.
 *
 * Everything here exists because a `<form>` with a `<div>` around some inputs gets four things
 * wrong, every time:
 *
 *  1. no `noValidate`, so the browser's own bubble validation fights ours and wins;
 *  2. no form-level error region, so a 400 with no field attribution lands nowhere;
 *  3. the submit button outside the form, so Enter does not submit;
 *  4. the error summary not focused, so a keyboard user submits and nothing appears to happen.
 *
 * The summary is `role="alert"` and takes focus on appearance. That is the single most
 * important accessibility behaviour in this repo and `Form.test.tsx` asserts it.
 */
import { useEffect, useRef } from 'react';
import type { FormEvent, ReactNode } from 'react';

import { pz } from '@lib/cn';

import { color, font, radius, space } from '../ui/tokens';

import { hasErrors } from './field-errors';
import type { FormErrors } from './field-errors';

export interface FormProps {
  id: string;
  /** Accessible name. Rendered as the legend when `heading` is true. */
  label: string;
  onSubmit: () => void | Promise<void>;
  children: ReactNode;
  /** Buttons. Rendered inside the form so Enter submits. */
  actions?: ReactNode;
  errors?: FormErrors;
  /** Render `label` as a visible `<h2>` rather than only as the accessible name. */
  heading?: boolean;
  className?: string;
}

export function Form({
  id,
  label,
  onSubmit,
  children,
  actions,
  errors,
  heading = false,
  className,
}: FormProps) {
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const showSummary = errors !== undefined && errors.formLevel.length > 0;

  useEffect(() => {
    if (showSummary) summaryRef.current?.focus();
  }, [showSummary]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void onSubmit();
  }

  return (
    <form
      id={id}
      noValidate
      aria-label={heading ? undefined : label}
      aria-labelledby={heading ? `${id}-heading` : undefined}
      onSubmit={handleSubmit}
      className={pz('form') + (className ? ` ${className}` : '')}
      style={{
        display: 'grid',
        gap: space[4],
        fontFamily: font.family,
        color: color.textPrimary,
      }}
    >
      {heading ? (
        <h2
          id={`${id}-heading`}
          style={{ margin: 0, fontSize: font.size.xl, fontWeight: font.weight.semibold }}
        >
          {label}
        </h2>
      ) : null}

