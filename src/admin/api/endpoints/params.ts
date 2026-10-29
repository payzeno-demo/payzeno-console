import type { QueryParams } from '@api/transport';

/**
 * Flatten an admin list query into query params.
 *
 * `listQueryToParams` (api/transport.ts) is frozen to `ListQuery & Record<string, unknown>`,
 * which an interface such as the contracts' `AdminMerchantListQuery` cannot satisfy without a
 * cast. This does the same job for any plain query object. Empty values are dropped so an
 * unset filter never becomes `?status=`.
 */
export function adminQueryParams(q?: object): QueryParams {
  const params: QueryParams = {};
  if (!q) return params;

  for (const [key, value] of Object.entries(q as Record<string, unknown>)) {
    if (value === undefined || value === null || value === '') continue;
    params[key] = typeof value === 'number' || typeof value === 'boolean' ? value : String(value);
  }
  return params;
}
