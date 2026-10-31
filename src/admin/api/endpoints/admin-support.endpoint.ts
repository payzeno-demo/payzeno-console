import type {
  EmailMessage,
  Paginated,
  ResolveSupportTaskRequest,
  SupportTask,
} from '@payzeno/contracts';

import { newIdempotencyKey } from '@api/http/idempotency';
import { pathSegment } from '@api/http/request-builder';
import type { HttpTransport } from '@api/transport';

import type { EmailLookupQuery } from '../../types/admin-views';
import type { SupportTaskListQuery } from '../../types/support-task';

import { adminQueryParams } from './params';

/**
 * `GET /v1/admin/support-tasks`, `POST /v1/admin/support-tasks/:id/resolve`, and
 * `GET /v1/admin/emails?to=` — support's "did we email them?" (RFC platform-v2 §1).
 *
 * The task is the contracts' `SupportTask`; only its list query is still local.
 */
export class AdminSupportEndpoint {
  constructor(private readonly client: HttpTransport) {}

  listTasks(q?: SupportTaskListQuery): Promise<Paginated<SupportTask>> {
    return this.client.get<Paginated<SupportTask>>('/admin/support-tasks', adminQueryParams(q));
  }

  resolveTask(
    taskId: string,
    req: ResolveSupportTaskRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<SupportTask> {
    return this.client.post<SupportTask, ResolveSupportTaskRequest>(
      `/admin/support-tasks/${pathSegment(taskId)}/resolve`,
      req,
      idempotencyKey,
    );
  }

  /** Every email Payzeno queued to an address, newest first. Read-only; bodies are not exposed. */
  emails(q: EmailLookupQuery): Promise<Paginated<EmailMessage>> {
    return this.client.get<Paginated<EmailMessage>>('/admin/emails', adminQueryParams(q));
  }
}
