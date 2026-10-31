/**
 * Reading a user-picked `File` in the browser.
 *
 * Used by the KYC document upload (RFC platform-v2 §3), which sends the bytes as base64 inside
 * a JSON body. The bytes never touch a log, a breadcrumb or the query cache — the upload hook
 * hands them straight to the endpoint (ADR 0003's "no bodies anywhere" applies to identity
 * documents at least as much as to card data).
 */

/** The file's bytes as base64, without the `data:…;base64,` prefix. */
export function readFileAsBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('The file could not be read.'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const comma = result.indexOf(',');
      resolve(comma === -1 ? result : result.slice(comma + 1));
    };
    reader.readAsDataURL(file);
  });
}
