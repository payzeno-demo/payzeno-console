/**
 * Turns a `RawResponse` into a typed payload, or into the parsed `ApiError` body that
 * `error-mapper.ts` needs.
 *
 * arc PCI: there was a `console.debug('response body', text)` here. `dhotfix` removed it in
 * review with "we do not log response bodies, ever — a charge carries a card object and an
