/**
 * `ResourceEndpoint` — interfaces.md §4.2, frozen.
 *
 * Every resource with a list/get pair extends this **directly**. There is no intermediate
 * base: the contract names ten direct concretes and an intermediate would move the
 * `INHERITS` edge off the class the contract names.
 *
 * The four non-resource endpoints (`auth`, `balance`, `reporting`, `webhook-endpoints`) are
 * plain classes taking an `HttpTransport`. Forcing them under this base would produce an
 * `IMPLEMENTS` edge that lies about their shape.
 */
import type { ListQuery, Paginated } from '@payzeno/contracts';

import { pathSegment } from '../http/request-builder';
import { listQueryToParams } from '../transport';
import type { HttpTransport, QueryParams } from '../transport';

export abstract class ResourceEndpoint<TResource, TListQuery extends ListQuery = ListQuery> {
  /** Version-free, leading slash: `/settlements`. `VITE_PAYZENO_API_URL` carries `/v1`. */
  protected abstract readonly basePath: string;

  protected constructor(protected readonly client: HttpTransport) {}

  list(q?: TListQuery): Promise<Paginated<TResource>> {
    return this.client.get<Paginated<TResource>>(this.basePath, this.toParams(q));
  }

  get(id: string): Promise<TResource> {
    return this.client.get<TResource>(this.resourcePath(id));
  }

  /** `/settlements/sb_123` — every subclass builds sub-resource paths from this. */
  protected resourcePath(id: string, ...suffix: string[]): string {
    const tail = suffix.length > 0 ? `/${suffix.join('/')}` : '';
    return `${this.basePath}/${pathSegment(id)}${tail}`;
  }

  protected toParams(q?: TListQuery): QueryParams {
    return listQueryToParams(q as (ListQuery & Record<string, unknown>) | undefined);
  }
}
