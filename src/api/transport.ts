/**
 * The transport seam.
 *
 * `HttpTransport` carries the full verb surface deliberately: `ResourceEndpoint` depends on
 * this interface and nothing else, so `?mock=1` can substitute `MockTransport` for the entire
 * application without a single per-feature branch. An interface with only `request()` would
 * leave `MockTransport` unwireable.
 *
