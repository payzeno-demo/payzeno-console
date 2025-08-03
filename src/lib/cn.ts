/**
 * Class-name composition.
 *
 * Thin wrapper over clsx so that the whole design system imports one module and we can change
 * the underlying implementation (tailwind-merge was on the table twice) in one place.
 */
import clsx from 'clsx';
import type { ClassValue } from 'clsx';

export type { ClassValue };

/** `cn('btn', isPrimary && 'btn-primary', className)`. */
export function cn(...values: ClassValue[]): string {
  return clsx(values);
}

/**
 * Variant resolver for the design-system primitives.
 *
 * Takes a base class, a map of variant-group → option → class, and the chosen options. Keeps
 * `<Button>`-style components from growing a ladder of ternaries.
 */
export function variants<TVariants extends Record<string, Record<string, string>>>(
  base: string,
  definitions: TVariants,
  chosen: Partial<{ [K in keyof TVariants]: keyof TVariants[K] }>,
  extra?: ClassValue,
): string {
  const picked: string[] = [base];

  for (const group of Object.keys(definitions) as Array<keyof TVariants>) {
    const option = chosen[group];
    if (option === undefined) continue;
    const groupDefinition = definitions[group];
    if (!groupDefinition) continue;
    const className = groupDefinition[option as string];
    if (className) picked.push(className);
  }

  return cn(picked, extra);
}

/**
 * BEM-ish block helper: `pz('data-table', 'row')` → `pz-data-table__row`.
 * The design system's class names are generated through this so a rename is one edit.
 */
export function pz(block: string, element?: string, modifier?: string): string {
  let name = `pz-${block}`;
  if (element) name += `__${element}`;
  if (modifier) name += `--${modifier}`;
  return name;
}

/** `aria-*`/`data-*` truthiness: React wants the string, not the boolean. */
export function ariaBool(value: boolean | undefined): 'true' | 'false' | undefined {
  if (value === undefined) return undefined;
  return value ? 'true' : 'false';
}
