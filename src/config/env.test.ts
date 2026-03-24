/**
 * `config/env.ts` — the console's one `import.meta.env` read surface (blueprint §1.2, §10).
 *
 * `readEnv` takes its source as an argument precisely so this file can drive it without
 * mutating the process environment. The module-level `env` is parsed at import time from the
 * values `src/test/setup.ts` installs, which is what makes the failure loud: a console booted
 * without `VITE_PAYZENO_API_URL` throws `EnvConfigError` before React renders, rather than
 * showing an empty dashboard that looks like a data problem.
 */
import { describe, expect, it } from 'vitest';

import { ENVIRONMENTS, env, readEnv } from '@config/env';
import { EnvConfigError } from '@lib/errors';
import { TEST_ENV } from '@/test/setup';

const VALID = { ...TEST_ENV };

describe('the seven variables', () => {
  it('parses a complete configuration', () => {
    const parsed = readEnv(VALID);

    expect(parsed.apiUrl).toBe('http://localhost/v1');
    expect(parsed.wsUrl).toBe('ws://localhost/ws/notifications');
    expect(parsed.vaultPublicUrl).toBe('http://localhost:8099/public');
    expect(parsed.environment).toBe('local');
  });

  it('maps every VITE_* name onto a field on Env', () => {
    const parsed = readEnv(VALID);

    expect(Object.keys(parsed).sort()).toEqual(
      [
        'apiUrl',
        'environment',
        'featureDisputeEvidenceV2',
        'featureSettlementExplorer',
        'sentryDsn',
        'vaultPublicUrl',
        'wsUrl',
      ].sort(),
    );
  });

  it('recognises the four environments and nothing else', () => {
    expect(ENVIRONMENTS).toEqual(['local', 'qa', 'staging', 'production']);
  });
});

describe('URL handling', () => {
  it('strips a trailing slash from the API base, so joins do not double up', () => {
    expect(readEnv({ ...VALID, VITE_PAYZENO_API_URL: 'http://localhost/v1/' }).apiUrl).toBe(
      'http://localhost/v1',
    );
  });

  it('strips a trailing slash from the vault base as well', () => {
    expect(
      readEnv({ ...VALID, VITE_VAULT_PUBLIC_URL: 'http://localhost:8099/public/' })
        .vaultPublicUrl,
    ).toBe('http://localhost:8099/public');
  });

  it('accepts https', () => {
    expect(
      readEnv({ ...VALID, VITE_PAYZENO_API_URL: 'https://api.payzeno.com/v1' }).apiUrl,
    ).toBe('https://api.payzeno.com/v1');
  });

  it('accepts wss for the socket', () => {
    expect(
      readEnv({ ...VALID, VITE_WS_URL: 'wss://api.payzeno.com/ws/notifications' }).wsUrl,
    ).toBe('wss://api.payzeno.com/ws/notifications');
  });
});

describe('the Sentry DSN', () => {
  it('is null when empty, which disables telemetry entirely', () => {
    expect(readEnv({ ...VALID, VITE_SENTRY_DSN: '' }).sentryDsn).toBeNull();
  });

  it('is null when only whitespace', () => {
    expect(readEnv({ ...VALID, VITE_SENTRY_DSN: '   ' }).sentryDsn).toBeNull();
  });

  it('is trimmed when present', () => {
    expect(readEnv({ ...VALID, VITE_SENTRY_DSN: ' https://abc@sentry.io/1 ' }).sentryDsn).toBe(
      'https://abc@sentry.io/1',
    );
  });
});

describe('the feature flags', () => {
  it.each(['true', '1'])('reads %s as on', (raw) => {
    expect(
      readEnv({ ...VALID, VITE_FEATURE_SETTLEMENT_EXPLORER: raw }).featureSettlementExplorer,
    ).toBe(true);
  });

  it.each(['false', '0', ''])('reads %j as off', (raw) => {
    expect(
      readEnv({ ...VALID, VITE_FEATURE_DISPUTE_EVIDENCE_V2: raw }).featureDisputeEvidenceV2,
    ).toBe(false);
  });

  it('rejects a value that is neither', () => {
    expect(() =>
      readEnv({ ...VALID, VITE_FEATURE_SETTLEMENT_EXPLORER: 'yes' }),
    ).toThrow(EnvConfigError);
  });
});

describe('failing loudly', () => {
  it('throws EnvConfigError when the API URL is missing', () => {
    const { VITE_PAYZENO_API_URL: _removed, ...withoutApiUrl } = VALID;

    expect(() => readEnv(withoutApiUrl)).toThrow(EnvConfigError);
  });

  it('names the offending variable in the message', () => {
    const { VITE_WS_URL: _removed, ...withoutWs } = VALID;

    const thrown = (() => {
      try {
        readEnv(withoutWs);
        return null;
      } catch (error) {
        return error;
      }
    })();

    expect(thrown).toBeInstanceOf(EnvConfigError);
    expect((thrown as EnvConfigError).message).toContain('VITE_WS_URL');
  });

  it('rejects an API URL that is not http(s)', () => {
    expect(() => readEnv({ ...VALID, VITE_PAYZENO_API_URL: 'ftp://localhost/v1' })).toThrow(
      EnvConfigError,
    );
  });

  it('rejects a socket URL that is not ws(s)', () => {
    expect(() => readEnv({ ...VALID, VITE_WS_URL: 'http://localhost/ws' })).toThrow(
      EnvConfigError,
    );
  });

  it('rejects an unknown environment name', () => {
    expect(() => readEnv({ ...VALID, VITE_ENVIRONMENT: 'preprod' })).toThrow(EnvConfigError);
  });

  it('collects every issue rather than only the first', () => {
    const thrown = (() => {
      try {
        readEnv({ VITE_ENVIRONMENT: 'nowhere' });
        return null;
      } catch (error) {
        return error;
      }
    })();

    expect((thrown as EnvConfigError).issues.length).toBeGreaterThan(1);
  });

  it('is unrecoverable — there is no retry that fixes a missing build variable', () => {
    const thrown = (() => {
      try {
        readEnv({});
        return null;
      } catch (error) {
        return error as EnvConfigError;
      }
    })();

    expect(thrown?.recoverable).toBe(false);
    expect(thrown?.clientCode).toBe('env_config_invalid');
  });
});

describe('the module-level env', () => {
  it('parsed successfully at import time, from the test configuration', () => {
    expect(env.apiUrl).toBe('http://localhost/v1');
    expect(env.environment).toBe('local');
  });
});
