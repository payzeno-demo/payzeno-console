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

      {showSummary ? (
        <div
          ref={summaryRef}
          role="alert"
          tabIndex={-1}
          className={pz('form', 'summary')}
          style={{
            padding: space[3],
            color: color.danger,
            background: color.dangerSubtle,
            border: `1px solid ${color.danger}`,
            borderRadius: radius.md,
            outline: 'none',
          }}
        >
          <p style={{ margin: 0, fontWeight: font.weight.medium }}>
            We could not save this. Please check the following:
          </p>
          <ul style={{ margin: `${space[2]} 0 0`, paddingInlineStart: space[5] }}>
            {errors?.formLevel.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: space[4] }}>{children}</div>

      {actions ? (
        <div style={{ display: 'flex', gap: space[2], justifyContent: 'flex-end' }}>{actions}</div>
      ) : null}
    </form>
  );
}

/**
 * Fieldset for a group of related controls. The legend is what makes a screen reader announce
 * "Bank details, group" before the first input; without it the fields are orphans.
 */
export function FormSection({
  legend,
  description,
  children,
}: {
  legend: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset
      className={pz('form', 'section')}
      style={{ margin: 0, padding: 0, border: 'none', display: 'grid', gap: space[3] }}
    >
      <legend
        style={{
          padding: 0,
          fontSize: font.size.md,
          fontWeight: font.weight.semibold,
          color: color.textPrimary,
        }}
      >
        {legend}
      </legend>
