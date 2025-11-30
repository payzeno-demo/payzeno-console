import { runtime } from '@config/runtime';
import type { ConsoleNotification } from '@features/notifications/notification.types';
import { isConsoleNotification } from '@features/notifications/notification.types';

import { SocketClient } from './socket-client';
import type { SocketHandlers } from './socket-client';

/**
 * `NotificationSocket` — connects to payzeno-api's `/ws/notifications` at `VITE_WS_URL`.
 *
 * The server side is `NotificationsGateway`, fed by `NotificationRelayConsumer` off the
 * `payzeno-console-notifications` queue. Auth is the ordinary session cookie plus the CSRF
 * header on the upgrade request; the socket is scoped to `principal.merchant_id` and
