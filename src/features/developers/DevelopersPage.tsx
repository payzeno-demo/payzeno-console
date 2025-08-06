/**
 * `DevelopersPage` — API keys, webhook endpoints and webhook delivery, in one route.
 * `ApiKeyDetailPage` and `WebhookEventDetailPage` are its children.
 *
 * The create-key form lives inline rather than in a dialog: the secret reveal that follows it
 * must stay on screen while the developer copies the key, and a dialog that closes takes the
 * only copy of the secret with it.
 */
import { useState } from 'react';

import { API_KEY_SCOPES } from '@payzeno/contracts';
import type { ApiKeyMode, ApiKeyScope, PublicEventType } from '@payzeno/contracts';
