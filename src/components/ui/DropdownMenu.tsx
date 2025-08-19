/**
 * Dropdown menu.
 *
 * Row actions ("refund", "cancel payout", "retry item") and the user menu. Items are data, not
 * children, so a table column can build a menu from a permission-filtered array without JSX
 * gymnastics.
 *
 * A destructive item renders in the danger tone and is separated from the benign ones — a
 * "cancel payout" sitting immediately below "copy id" gets clicked by accident.
 */
import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';

import { cn, pz } from '@lib/cn';

import { color, font, radius, shadow, space, zIndex } from './tokens';

export interface MenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  /** Explains why the item is disabled. Rendered as a second line, not a tooltip. */
  disabledReason?: string;
  destructive?: boolean;
}

export interface DropdownMenuProps {
  trigger: ReactNode;
  items: ReadonlyArray<MenuItem>;
  /** Accessible name of the menu itself. */
  label: string;
  align?: 'start' | 'end';
  className?: string;
}

export function DropdownMenu({ trigger, items, label, align = 'end', className }: DropdownMenuProps) {
  const benign = items.filter((item) => !item.destructive);
  const destructive = items.filter((item) => item.destructive);

  function renderItem(item: MenuItem) {
    return (
      <RadixMenu.Item
        key={item.id}
        disabled={item.disabled}
        onSelect={item.onSelect}
        className={pz('menu', 'item')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: space[2],
          padding: `${space[2]} ${space[3]}`,
          fontSize: font.size.md,
          color: item.disabled
            ? color.textMuted
            : item.destructive
              ? color.danger
              : color.textPrimary,
          borderRadius: radius.sm,
          cursor: item.disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
        }}
      >
        {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
        <span>
          {item.label}
          {item.disabled && item.disabledReason ? (
            <span style={{ display: 'block', fontSize: font.size.xs, color: color.textMuted }}>
              {item.disabledReason}
            </span>
          ) : null}
        </span>
      </RadixMenu.Item>
    );
  }

  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          align={align}
          sideOffset={4}
          aria-label={label}
          className={cn(pz('menu'), className)}
          style={{
            minWidth: '200px',
            padding: space[1],
            fontFamily: font.family,
            background: color.surface,
            border: `1px solid ${color.border}`,
            borderRadius: radius.md,
            boxShadow: shadow.md,
            zIndex: zIndex.popover,
          }}
        >
          {benign.map(renderItem)}
          {destructive.length > 0 && benign.length > 0 ? (
            <RadixMenu.Separator
              style={{ height: '1px', margin: `${space[1]} 0`, background: color.border }}
            />
          ) : null}
          {destructive.map(renderItem)}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}
