/**
 * The avatar menu at the far right of the top bar.
 *
 * It holds the things that are about *you* rather than about the account: your profile, your
 * role, and signing out. Account-level settings live in the Settings route, not here — putting
 * them in a menu behind an avatar is where nobody finds them.
 *
 * a11y: the trigger's accessible name is the user's name and role, not "user menu"; the menu
 * is a real `role="menu"` via `<DropdownMenu>`; the avatar initials are `aria-hidden` because
 * they are a decorative rendering of the name that is already announced.
 */
import { useNavigate } from 'react-router-dom';

import type { User } from '@payzeno/contracts';

import { ROUTES } from '@/routes';
import { initialsOf } from '@/types/session';

import { pz } from '@lib/cn';
import { labelise } from '@lib/format';

import { DropdownMenu } from '../ui/DropdownMenu';
import type { MenuItem } from '../ui/DropdownMenu';
import { color, font, radius, space } from '../ui/tokens';

export interface UserMenuProps {
  user: User;
  onSignOut: () => void;
  /** Signing out is a mutation; while it is in flight the item is disabled. */
  isSigningOut?: boolean;
}

export function UserMenu({ user, onSignOut, isSigningOut = false }: UserMenuProps) {
  const navigate = useNavigate();

  const items: MenuItem[] = [
    {
      id: 'settings',
      label: 'Account settings',
      onSelect: () => navigate(ROUTES.settings.index),
    },
    {
      id: 'developers',
      label: 'API keys',
      onSelect: () => navigate(ROUTES.developers.index),
    },
    {
      id: 'sign-out',
      label: isSigningOut ? 'Signing out…' : 'Sign out',
      onSelect: onSignOut,
      disabled: isSigningOut,
      disabledReason: isSigningOut ? 'Already signing out' : undefined,
      destructive: true,
    },
  ];

  return (
    <DropdownMenu
      label="Account menu"
      align="end"
      items={items}
      trigger={
        <button
          type="button"
          aria-label={`${user.full_name}, ${labelise(user.role)}. Open account menu`}
          className={pz('user-menu', 'trigger')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: space[2],
            padding: space[1],
            background: 'transparent',
            border: 'none',
            borderRadius: radius.pill,
            cursor: 'pointer',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: radius.pill,
              background: color.brandSubtle,
              color: color.brand,
              fontFamily: font.family,
              fontSize: font.size.sm,
              fontWeight: font.weight.semibold,
            }}
          >
            {initialsOf(user)}
          </span>
          <span aria-hidden="true" style={{ color: color.textSecondary }}>
            ⌄
          </span>
        </button>
      }
    />
  );
}
