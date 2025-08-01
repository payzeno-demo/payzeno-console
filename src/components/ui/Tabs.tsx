/**
 * Tabs.
 *
 * Radix handles the roving tabindex and the arrow-key contract. What this wrapper adds is the
 * URL binding: a tab that does not survive a refresh is a tab a merchant cannot link a
 * colleague to, and every detail page in this console gets linked into a support thread.
 */
import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';

import { cn, pz } from '@lib/cn';

import { color, font, space } from './tokens';

export interface TabSpec {
  id: string;
  label: string;
  content: ReactNode;
  /** Rendered after the label — an unread count, a warning dot. */
  adornment?: ReactNode;
  disabled?: boolean;
}

export function Tabs({ tabs, value, onValueChange, label, className }: TabsProps) {
  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange} className={cn(pz('tabs'), className)}>
      <RadixTabs.List
        aria-label={label}
        style={{
          display: 'flex',
          gap: space[1],
          borderBottom: `1px solid ${color.border}`,
          marginBottom: space[4],
        }}
      >
        {tabs.map((tab) => {
          const active = tab.id === value;
          return (
            <RadixTabs.Trigger
              key={tab.id}
              value={tab.id}
              disabled={tab.disabled}
              className={pz('tabs', 'trigger', active ? 'active' : undefined)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: space[2],
                padding: `${space[2]} ${space[3]}`,
                fontFamily: font.family,
                fontSize: font.size.md,
                fontWeight: active ? font.weight.semibold : font.weight.regular,
                color: tab.disabled ? color.textMuted : active ? color.brand : color.textSecondary,
                background: 'transparent',
                border: 'none',
                // The 2px underline is the only active indicator, so it must be a real border
                // and not a box-shadow — Windows high-contrast mode drops box-shadows.
                borderBottom: `2px solid ${active ? color.brand : 'transparent'}`,
                marginBottom: '-1px',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {tab.label}
              {tab.adornment}
            </RadixTabs.Trigger>
          );
        })}
      </RadixTabs.List>

      {tabs.map((tab) => (
        <RadixTabs.Content key={tab.id} value={tab.id}>
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}

