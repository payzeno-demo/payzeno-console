/**
 * `TokenizedCardInput` — arc PCI, and the highest-stakes component in the repo.
 *
 * The rule it exists to enforce (ADR 0003): **card data never transits payzeno-api.** It goes
 * straight from the browser to the vault at `VITE_VAULT_PUBLIC_URL`, and what comes back is a
 * `pmt_…` token plus a last-four.
 *
 * The assertions below therefore care about two things above all:
 *  - the PAN and CVV go to the vault origin and to nothing else — in particular not to
 *    `VITE_PAYZENO_API_URL`, and not into an error report;
 *  - `onToken` receives a token, never the number that produced it.
 *
 * `dhotfix` reviews every change to this file. Weakening a case here needs his sign-off.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TokenizedCardInput,
  groupDigits,
  isExpired,
  looksLikePan,
  parseExpiry,
} from '@components/form/TokenizedCardInput';
import { runtimeConfig } from '@config/runtime';
import { renderBare, screen, waitFor } from '@/test/render';

const TEST_PAN = '4242424242424242';

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ token: 'pmt_01HW0RTTOKEN000000001', last_four: '4242' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function fillCard(user: ReturnType<typeof renderBare>['user'], pan = TEST_PAN) {
  await user.type(screen.getByLabelText(/Card number/), pan);
  await user.type(screen.getByLabelText(/Expiry/), '1230');
  await user.type(screen.getByLabelText(/Security code/), '123');
}

describe('looksLikePan', () => {
  it('accepts the lengths a card number can actually be', () => {
    expect(looksLikePan('4242424242424242')).toBe(true);
    expect(looksLikePan('4242 4242 4242 4242')).toBe(true);
    expect(looksLikePan('378282246310005')).toBe(true);
  });

  it('rejects anything too short or too long to be a card', () => {
    expect(looksLikePan('42424242424')).toBe(false);
    expect(looksLikePan('42424242424242424242')).toBe(false);
    expect(looksLikePan('')).toBe(false);
  });
});

describe('parseExpiry', () => {
  it('reads MM/YY', () => {
    expect(parseExpiry('12/30')).toEqual({ month: 12, year: 2030 });
  });

  it('reads it without the slash too', () => {
    expect(parseExpiry('0129')).toEqual({ month: 1, year: 2029 });
  });

  it('rejects an impossible month', () => {
    expect(parseExpiry('13/30')).toBeNull();
    expect(parseExpiry('00/30')).toBeNull();
  });

  it('rejects a wrong-length input', () => {
    expect(parseExpiry('1/30')).toBeNull();
    expect(parseExpiry('12/2030')).toBeNull();
  });
});

describe('isExpired', () => {
  it('treats the expiry month as valid through its final day', () => {
    expect(isExpired(3, 2026, new Date('2026-03-31T23:00:00Z'))).toBe(false);
  });

  it('treats the following month as expired', () => {
    expect(isExpired(3, 2026, new Date('2026-04-01T00:00:01Z'))).toBe(true);
  });

  it('accepts a far-future card', () => {
    expect(isExpired(12, 2030, new Date('2026-03-14T00:00:00Z'))).toBe(false);
  });
});

describe('groupDigits', () => {
  it('groups in fours for readability', () => {
    expect(groupDigits('4242424242424242')).toBe('4242 4242 4242 4242');
  });

  it('leaves a partial group ungrouped', () => {
    expect(groupDigits('424242')).toBe('4242 42');
  });

  it('drops non-digits and caps at nineteen', () => {
    expect(groupDigits('4242-4242-4242-4242-4242-4242')).toBe('4242 4242 4242 4242 424');
  });
});

describe('the form', () => {
  it('labels all three fields', () => {
    renderBare(<TokenizedCardInput clientSecret="pi_1_secret" onToken={vi.fn()} />);

    expect(screen.getByLabelText(/Card number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Expiry/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Security code/)).toBeInTheDocument();
  });

  it('tells the merchant where the details go', () => {
    renderBare(<TokenizedCardInput clientSecret="pi_1_secret" onToken={vi.fn()} />);

    expect(screen.getByText(/straight to our card vault/i)).toBeInTheDocument();
    expect(screen.getByText(/only the last four digits/i)).toBeInTheDocument();
  });

  it('masks the security code in the DOM — the digits live in a ref, not in state', async () => {
    const { user } = renderBare(
      <TokenizedCardInput clientSecret="pi_1_secret" onToken={vi.fn()} />,
    );

    await user.type(screen.getByLabelText(/Security code/), '123');

    const cvv = screen.getByLabelText(/Security code/) as HTMLInputElement;
    expect(cvv).toHaveAttribute('type', 'password');
    expect(cvv.value).not.toContain('1');
    expect(cvv.value).toBe('•••');
  });

  it('never renders the raw PAN — the visible value is the grouped form', async () => {
    const { user, container } = renderBare(
      <TokenizedCardInput clientSecret="pi_1_secret" onToken={vi.fn()} />,
    );

    await user.type(screen.getByLabelText(/Card number/), TEST_PAN);

    expect(container.innerHTML).not.toContain(TEST_PAN);
    expect(screen.getByLabelText(/Card number/)).toHaveValue('4242 4242 4242 4242');
  });
});

describe('client-side validation, before anything leaves the browser', () => {
  it('rejects a number that is not card-shaped without calling the vault', async () => {
    const { user } = renderBare(
      <TokenizedCardInput clientSecret="pi_1_secret" onToken={vi.fn()} />,
    );

    await user.type(screen.getByLabelText(/Card number/), '4242');
    await user.click(screen.getByRole('button', { name: 'Save card' }));

    expect(await screen.findByText(/does not look right/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a malformed expiry', async () => {
    const { user } = renderBare(
      <TokenizedCardInput clientSecret="pi_1_secret" onToken={vi.fn()} />,
    );

    await user.type(screen.getByLabelText(/Card number/), TEST_PAN);
    await user.type(screen.getByLabelText(/Expiry/), '99');
    await user.click(screen.getByRole('button', { name: 'Save card' }));

    expect(await screen.findByText('Enter the expiry as MM/YY.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a card that has already expired', async () => {
    const { user } = renderBare(
      <TokenizedCardInput clientSecret="pi_1_secret" onToken={vi.fn()} />,
    );

    await user.type(screen.getByLabelText(/Card number/), TEST_PAN);
    await user.type(screen.getByLabelText(/Expiry/), '0120');
    await user.type(screen.getByLabelText(/Security code/), '123');
    await user.click(screen.getByRole('button', { name: 'Save card' }));

    expect(await screen.findByText('That card has expired.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a too-short security code', async () => {
    const { user } = renderBare(
      <TokenizedCardInput clientSecret="pi_1_secret" onToken={vi.fn()} />,
    );

    await user.type(screen.getByLabelText(/Card number/), TEST_PAN);
    await user.type(screen.getByLabelText(/Expiry/), '1230');
    await user.type(screen.getByLabelText(/Security code/), '12');
    await user.click(screen.getByRole('button', { name: 'Save card' }));

    expect(await screen.findByText(/security code from the back/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('tokenisation (ADR 0003)', () => {
  it('posts to the vault origin, not to payzeno-api', async () => {
    const { user } = renderBare(
      <TokenizedCardInput clientSecret="pi_1_secret" onToken={vi.fn()} />,
    );

    await fillCard(user);
    await user.click(screen.getByRole('button', { name: 'Save card' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe(`${runtimeConfig.vaultPublicUrl}/public/tokens`);
    expect(String(url)).not.toContain(runtimeConfig.apiBaseUrl);
  });

  it('authorises with the intent client secret', async () => {
    const { user } = renderBare(
      <TokenizedCardInput clientSecret="pi_1_secret" onToken={vi.fn()} />,
    );

    await fillCard(user);
    await user.click(screen.getByRole('button', { name: 'Save card' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer pi_1_secret');
  });

  it('hands the caller a token and a last four, never the number', async () => {
    const onToken = vi.fn();
    const { user } = renderBare(
      <TokenizedCardInput clientSecret="pi_1_secret" onToken={onToken} />,
    );

    await fillCard(user);
    await user.click(screen.getByRole('button', { name: 'Save card' }));

    await waitFor(() => {
      expect(onToken).toHaveBeenCalledWith('pmt_01HW0RTTOKEN000000001', '4242');
    });
    expect(JSON.stringify(onToken.mock.calls)).not.toContain(TEST_PAN);
  });

  it('wipes the fields once the token comes back', async () => {
    const { user } = renderBare(
      <TokenizedCardInput clientSecret="pi_1_secret" onToken={vi.fn()} />,
    );

    await fillCard(user);
    await user.click(screen.getByRole('button', { name: 'Save card' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Card number/)).toHaveValue('');
    });
    expect(screen.getByLabelText(/Expiry/)).toHaveValue('');
    expect(screen.getByLabelText(/Security code/)).toHaveValue('');
  });
});

describe('when the vault refuses', () => {
  it('shows the rejection message for a 422 and calls onError', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{}', { status: 422, headers: { 'X-Vault-Reference': 'vault_ref_1' } }),
    );
    const onError = vi.fn();

    const { user } = renderBare(
      <TokenizedCardInput clientSecret="pi_1_secret" onToken={vi.fn()} onError={onError} />,
    );

    await fillCard(user);
    await user.click(screen.getByRole('button', { name: 'Save card' }));

    expect(await screen.findByText(/The card was rejected/)).toBeInTheDocument();
    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });
    expect(onError.mock.calls[0]?.[0]).toMatchObject({
      clientCode: 'vault_tokenisation_failed',
      vaultReference: 'vault_ref_1',
    });
  });

  it('reports a generic failure for any other status', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }));

    const { user } = renderBare(
      <TokenizedCardInput clientSecret="pi_1_secret" onToken={vi.fn()} />,
    );

    await fillCard(user);
    await user.click(screen.getByRole('button', { name: 'Save card' }));

    expect(await screen.findByText(/could not save that card/i)).toBeInTheDocument();
  });

  it('reports an unreachable vault without leaking the card into the message', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const { user } = renderBare(
      <TokenizedCardInput clientSecret="pi_1_secret" onToken={vi.fn()} />,
    );

    await fillCard(user);
    await user.click(screen.getByRole('button', { name: 'Save card' }));

    const message = await screen.findByText(/could not reach the card vault/i);
    expect(message.textContent).not.toContain(TEST_PAN);
    expect(message.textContent).not.toContain('123');
  });

  it('re-enables the button so the merchant can try again', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }));

    const { user } = renderBare(
      <TokenizedCardInput clientSecret="pi_1_secret" onToken={vi.fn()} />,
    );

    await fillCard(user);
    await user.click(screen.getByRole('button', { name: 'Save card' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save card' })).toBeEnabled();
    });
  });
});
