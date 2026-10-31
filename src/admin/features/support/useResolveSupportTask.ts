/**
 * `useResolveSupportTask()` — `POST /v1/admin/support-tasks/:id/resolve` (support). The note
 * lands in `support_task.resolution_note`.
 */
import { adminQueryKeys } from '../../api/adminQueryKeys';
import { useAdminEndpoints } from '../../app/AdminApiContext';
import { useStaffAction } from '../../hooks/useStaffAction';
import type { StaffActionResult } from '../../hooks/useStaffAction';

import { resolveSupportTaskMutation } from './support.queries';
import type { ResolveTaskInput } from './support.queries';

export function useResolveSupportTask(): StaffActionResult<ResolveTaskInput> {
  const endpoints = useAdminEndpoints();

  return useStaffAction({
    ...resolveSupportTaskMutation(endpoints),
    invalidate: () => [adminQueryKeys.supportTasks.all],
    success: (task, vars) => ({
      tone: 'success',
      title: `Task resolved: ${task.title}`,
      body: vars.note ? `Resolution note: “${vars.note}”.` : `Task ${task.id} is closed.`,
    }),
    forbidden: 'resolving a support task needs the support role.',
    conflict: 'This task was already closed.',
  });
}
