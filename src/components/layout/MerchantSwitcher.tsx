/**
 * The account picker in the top bar.
 *
 * Most merchant users have exactly one account, in which case this renders as static text
 * rather than a dead dropdown. Platform users (marketplaces) have many, and support staff
 * acting on a merchant see the acting account here too.
 *
 * Switching account is a full reload rather than a state change: the session cookie is
 * re-issued by `POST /v1/auth/switch`, and every query in the cache belongs to the old
 * merchant. Trying to be clever about that produced a bug where a payout list from account A
 * rendered under account B's header for one frame.
 *
 * a11y: the trigger says which account is active ("Account: Acme Ltd"), the list is a real
 * listbox, and the filter input is labelled. Tal's review on PR #211.
 */
import { useMemo, useState } from 'react';

import type { Merchant } from '@payzeno/contracts';

import { useDebouncedValue } from '@hooks/useDebouncedValue';
import { pz } from '@lib/cn';

import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Popover } from '../ui/Popover';
import { color, font, radius, space } from '../ui/tokens';

export interface MerchantSwitcherProps {
  current: Merchant;
  /** Everything this session may act on. One entry means no dropdown at all. */
  available?: ReadonlyArray<Merchant>;
  onSwitch?: (merchantId: string) => void;
}

/** Case-insensitive match on display name, legal name or id. */
export function filterMerchants(
  merchants: ReadonlyArray<Merchant>,
  query: string,
): ReadonlyArray<Merchant> {
  const needle = query.trim().toLowerCase();
  if (needle === '') return merchants;

  return merchants.filter(
    (merchant) =>
      merchant.display_name.toLowerCase().includes(needle) ||
      merchant.legal_name.toLowerCase().includes(needle) ||
      merchant.id.toLowerCase().includes(needle),
  );
}

export function MerchantSwitcher({ current, available = [], onSwitch }: MerchantSwitcherProps) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);

  const single = available.length <= 1;

  if (single) {
    return (
      <p
        className={pz('merchant-switcher', 'static')}
        style={{
          margin: 0,
          fontFamily: font.family,
          fontSize: font.size.md,
          fontWeight: font.weight.semibold,
          color: color.textPrimary,
        }}
      >
        <span style={{ fontWeight: font.weight.regular, color: color.textMuted }}>Account: </span>
        {current.display_name}
      </p>
    );
  }

  return (
    <Popover
      label="Switch account"
      trigger={
        <button
          type="button"
          aria-label={`Account: ${current.display_name}. Switch account`}
          className={pz('merchant-switcher', 'trigger')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: space[2],
            padding: `${space[1]} ${space[3]}`,
            fontFamily: font.family,
            fontSize: font.size.md,
            fontWeight: font.weight.medium,
            color: color.textPrimary,
            background: color.surface,
            border: `1px solid ${color.border}`,
            borderRadius: radius.md,
            cursor: 'pointer',
          }}
        >
          {current.display_name}
          <span aria-hidden="true">⌄</span>
        </button>
      }
    >
      <div style={{ display: 'grid', gap: space[2] }}>
        <Input
          id="merchant-switcher-filter"
          type="search"
          aria-label="Filter accounts"
          placeholder="Filter accounts"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <ul role="listbox" aria-label="Accounts" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {matches.map((merchant) => {
            const active = merchant.id === current.id;

            return (
              <li key={merchant.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => onSwitch?.(merchant.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: space[2],
                    width: '100%',
                    padding: `${space[2]} ${space[2]}`,
                    fontFamily: font.family,
                    fontSize: font.size.md,
                    textAlign: 'start',
                    color: color.textPrimary,
                    background: active ? color.brandSubtle : 'transparent',
                    border: 'none',
                    borderRadius: radius.sm,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ flex: 1 }}>{merchant.display_name}</span>
                  {merchant.status !== 'active' ? (
                    <Badge tone="warning" size="sm" srPrefix="Status">
                      {merchant.status.replace(/_/g, ' ')}
                    </Badge>
                  ) : null}
                </button>
              </li>
            );
          })}

          {matches.length === 0 ? (
            <li style={{ padding: space[2], fontSize: font.size.sm, color: color.textMuted }}>
              No account matches “{debounced}”.
            </li>
          ) : null}
        </ul>
      </div>
    </Popover>
  );
}
