/**
 * The one confirmation dialog every staff action goes through.
 *
 * Staff actions are consequential and mostly irreversible — approving a merchant turns on live
 * payments, declining a review voids a shopper's authorisation, accepting a dispute writes the
 * money off — so none of them fires from a single click. Each opens this: what will happen, in
 * one sentence, an optional or required note, and a confirm button that says the verb.
 *
 * The dialog is `destructive` (no overlay dismissal) for the same reason the refund dialog is.
 * The note is validated here, before any request: a required message that is blank never
 * reaches the api, and the error is wired to the textarea with `aria-describedby`.
 */
import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

import { InlineError } from '@components/feedback/InlineError';
import { FormField } from '@components/form/FormField';
import { Button } from '@components/ui/Button';
import { Dialog } from '@components/ui/Dialog';
import { Textarea } from '@components/ui/Textarea';
import { color, space } from '@components/ui/tokens';

export interface ConfirmNoteField {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  /** Shown when `required` and blank. */
  requiredMessage?: string;
  /** Mirrors the api's `@MinLength` so a too-short reason never becomes a 422. */
  minLength?: number;
  /** Mirrors the api's `@MaxLength`; the textarea shows a counter against it. */
  maxLength?: number;
}

export interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** What happens if you confirm, in one or two sentences. */
  description: string;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'danger';
  note?: ConfirmNoteField;
  /** Receives the trimmed note ('' when there is no note field or it was left blank). */
  onConfirm: (note: string) => void;
  isPending: boolean;
  /** The last attempt's failure, already in words. */
  errorMessage?: string | null;
  /** Extra context above the note — the amount, the merchant, the rules that fired. */
  children?: ReactNode;
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = 'primary',
  note,
  onConfirm,
  isPending,
  errorMessage,
  children,
}: ConfirmActionDialogProps) {
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(false);

  // A fresh dialog every time it opens: a half-typed rejection reason for one merchant must not
  // reappear on the next.
  useEffect(() => {
    if (open) {
      setText('');
      setTouched(false);
    }
  }, [open]);

  const trimmed = text.trim();
  const missing = Boolean(note?.required) && trimmed.length === 0;
  const tooShort =
    !missing && trimmed.length > 0 && note?.minLength !== undefined && trimmed.length < note.minLength;
  const invalid = missing || tooShort;
  const noteError = !touched
    ? undefined
    : missing
      ? (note?.requiredMessage ?? `${note?.label ?? 'This'} is required.`)
      : tooShort
        ? `Write at least ${note?.minLength ?? 0} characters.`
        : undefined;
  const formErrorId = `${note?.id ?? 'confirm'}-form-error`;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (invalid || isPending) return;
    onConfirm(trimmed);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
      title={title}
      description={description}
      destructive
    >
      <form onSubmit={submit} noValidate style={{ display: 'grid', gap: space[4] }}>
        {children}

        {note ? (
          <FormField
            id={note.id}
            label={note.label}
            hint={note.hint}
            required={note.required}
            labelHint={note.required ? undefined : 'optional'}
            error={noteError}
          >
            {(wiring) => (
              <Textarea
                id={wiring.id}
                value={text}
                maxLength={note.maxLength ?? 2000}
                showCounter
                rows={4}
                invalid={Boolean(noteError)}
                describedBy={wiring['aria-describedby']}
                required={note.required}
                onChange={(event) => setText(event.target.value)}
                onBlur={() => setTouched(true)}
              />
            )}
          </FormField>
        ) : null}

        {errorMessage ? <InlineError id={formErrorId}>{errorMessage}</InlineError> : null}

        {/*
          The actions live inside the form (not in the Dialog's footer slot) so Enter in the note
          and the confirm button are one submit path, with no cross-tree form attribute.
        */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: space[2],
            padding: `${space[4]} 0 ${space[5]}`,
            borderTop: `1px solid ${color.border}`,
          }}
        >
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant={confirmVariant} isLoading={isPending}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
