/**
 * Path + query serialisation and header assembly. One place, so the shape of every outgoing
 * request is inspectable in one diff.
 */
import { runtime } from '@config/runtime';

import type { QueryParams, RequestSpec } from '../transport';

import { withCsrf } from './csrf';
import { buildHeaders } from './headers';

export interface BuiltRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | undefined;
  timeoutMs: number | undefined;
}

/**
