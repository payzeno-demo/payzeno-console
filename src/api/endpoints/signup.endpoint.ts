import type {
  LoginResponse,
  SignupRequest,
  SignupResponse,
  VerifyEmailRequest,
} from '@payzeno/contracts';

import { newIdempotencyKey } from '../http/idempotency';
import type { HttpTransport } from '../transport';

/**
 * `POST /v1/signup`, `POST /v1/signup/verify` (RFC platform-v2 §3).
 *
 * Both are public: there is no session yet. `create` makes the merchant (`pending_review`),
 * the owner (`invited`) and emails `signup_verify`; it never logs anyone in, because the owner
 * has not proved they hold the address. `verify` spends the emailed token, activates the owner
 * and sets `pz_session` + `pz_csrf` exactly like `POST /v1/auth/login` does.
 *
 * Not a `ResourceEndpoint`: there is nothing to list and no id to read.
 */
export class SignupEndpoint {
  constructor(private readonly client: HttpTransport) {}

  create(
    req: SignupRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<SignupResponse> {
    return this.client.post<SignupResponse, SignupRequest>('/signup', req, idempotencyKey);
  }

  verify(
    req: VerifyEmailRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<LoginResponse> {
    return this.client.post<LoginResponse, VerifyEmailRequest>(
      '/signup/verify',
      req,
      idempotencyKey,
    );
  }
}
