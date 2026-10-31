/**
 * Query and mutation factories for support: tasks and the email lookup. The only caller of
 * `AdminSupportEndpoint`.
 */
import type { EmailMessage, Paginated, SupportTask } from '@payzeno/contracts';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { adminQueryKeys } from '../../api/adminQueryKeys';
import type { AdminEndpointRegistry } from '../../api/endpoints';
import type { EmailLookupQuery } from '../../types/admin-views';
import type { SupportTaskListQuery } from '../../types/support-task';

export function supportTasksQuery(e: AdminEndpointRegistry, q: SupportTaskListQuery = {}) {
  return queryOptions<Paginated<SupportTask>>({
    queryKey: adminQueryKeys.supportTasks.list(q),
    queryFn: () => e.support.listTasks(q),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function emailLookupQuery(e: AdminEndpointRegistry, q: EmailLookupQuery) {
  return queryOptions<Paginated<EmailMessage>>({
    queryKey: adminQueryKeys.emails.lookup(q),
    queryFn: () => e.support.emails(q),
    // Delivery status moves from queued to sent within seconds; a support agent re-checking
    // "did it go?" wants the current answer.
    staleTime: 0,
  });
}

export interface ResolveTaskInput {
  taskId: string;
  note?: string;
}

/** `POST /v1/admin/support-tasks/:id/resolve` (`support`). */
export function resolveSupportTaskMutation(e: AdminEndpointRegistry) {
  return {
    mutationKey: ['admin', 'support-tasks', 'resolve'] as const,
    mutationFn: ({ taskId, note }: ResolveTaskInput) =>
      e.support.resolveTask(taskId, note ? { note } : {}),
  };
}
