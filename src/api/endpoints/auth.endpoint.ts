import type { LoginRequest, LoginResponse, SessionResponse } from '@payzeno/contracts';

import { newIdempotencyKey } from '../http/idempotency';
import type { HttpTransport } from '../transport';

/**
 * `POST /v1/auth/login`, `POST /v1/auth/logout`, `GET /v1/auth/me` (api-surface.md §3).
 *
 * Not a `ResourceEndpoint`: there is no list/get pair here, and forcing one would produce an
 * `IMPLEMENTS` edge that lies about the shape.
 *
 * Both `login` and `me` set the `pz_csrf` cookie server-side; `me` is the console bootstrap
 * call and is what refreshes it every time the app mounts.
 */
export class AuthEndpoint {
  constructor(private readonly client: HttpTransport) {}

  /** The bootstrap call. 401 here means "not signed in", not "something broke". */
  me(): Promise<SessionResponse> {
    return this.client.get<SessionResponse>('/auth/me');
  }

  login(req: LoginRequest, idempotencyKey: string = newIdempotencyKey()): Promise<LoginResponse> {
    return this.client.post<LoginResponse, LoginRequest>('/auth/login', req, idempotencyKey);
  }

  /** 204. Clears `pz_session` and `pz_csrf`. */
  logout(idempotencyKey: string = newIdempotencyKey()): Promise<void> {
    return this.client.post<void, Record<string, never>>('/auth/logout', {}, idempotencyKey);
  }

  /** Always 202 — payzeno-api never leaks whether the address exists. */
  requestPasswordReset(
    email: string,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<void> {
    return this.client.post<void, { email: string }>(
      '/auth/password/reset',
      { email },
      idempotencyKey,
    );
  }
}
