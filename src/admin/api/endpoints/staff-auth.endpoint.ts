import type { StaffLoginRequest, StaffSessionResponse } from '@payzeno/contracts';

import { newIdempotencyKey } from '@api/http/idempotency';
import type { HttpTransport } from '@api/transport';

/**
 * `POST /v1/staff/auth/login`, `POST /v1/staff/auth/logout`, `GET /v1/staff/auth/me`
 * (RFC platform-v2 §1).
 *
 * The staff session is its own cookie (`pz_staff_session`, HttpOnly) with the same `pz_csrf`
 * double-submit as a merchant session, so `ApiClient` needs nothing new: it reads `pz_csrf` and
 * sets `X-Payzeno-CSRF` on every mutation exactly as it does for the console.
 */
export class StaffAuthEndpoint {
  constructor(private readonly client: HttpTransport) {}

  /** The admin bootstrap call. 401 means "not signed in", not "something broke". */
  me(): Promise<StaffSessionResponse> {
    return this.client.get<StaffSessionResponse>('/staff/auth/me');
  }

  login(
    req: StaffLoginRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<StaffSessionResponse> {
    return this.client.post<StaffSessionResponse, StaffLoginRequest>(
      '/staff/auth/login',
      req,
      idempotencyKey,
    );
  }

  /** 204. Clears `pz_staff_session`. */
  logout(idempotencyKey: string = newIdempotencyKey()): Promise<void> {
    return this.client.post<void, Record<string, never>>('/staff/auth/logout', {}, idempotencyKey);
  }
}
