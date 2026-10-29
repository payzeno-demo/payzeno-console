import { adminApiBaseUrl } from './base-url';

describe('adminApiBaseUrl', () => {
  it('keeps the configured path but talks to the admin host, so cookies stay first-party', () => {
    expect(adminApiBaseUrl('http://admin.localhost', 'http://localhost/v1')).toBe('http://admin.localhost/v1');
    expect(adminApiBaseUrl('https://admin.payzeno.com', 'https://api.payzeno.com/v1/')).toBe(
      'https://admin.payzeno.com/v1',
    );
  });

  it('defaults to the page origin and the build-time api url', () => {
    expect(adminApiBaseUrl()).toBe(`${window.location.origin}/v1`);
  });

  it('falls back to /v1 for a configured value that is not a url', () => {
    expect(adminApiBaseUrl('http://admin.localhost', 'not a url')).toBe('http://admin.localhost/v1');
  });
});
