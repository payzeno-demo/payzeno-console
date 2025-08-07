import { runtime } from '@config/runtime';
import type { ConsoleNotification } from '@features/notifications/notification.types';
import { isConsoleNotification } from '@features/notifications/notification.types';

import { SocketClient } from './socket-client';
import type { SocketHandlers } from './socket-client';

