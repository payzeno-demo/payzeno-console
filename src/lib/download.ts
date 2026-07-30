/**
 * Browser downloads.
 *
 * One object-URL lifecycle, in one place. Every leaked blob URL pins its buffer for the
 * lifetime of the tab, and a merchant exporting settlement batches all afternoon will notice.
 */
import { assert } from './assert';

/**
 * Trigger a download of `blob` as `filename`.
 *
 * The anchor is created detached, clicked, and removed synchronously; the object URL is
 * revoked on the next macrotask (Safari cancels the download if it is revoked in the same
 * tick).
 */
export function downloadBlob(blob: Blob, filename: string): void {
  assert(filename.length > 0, 'download filename must not be empty');

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Download a string as a file. Used for CSV and for the webhook payload viewer's "save". */
export function downloadText(text: string, filename: string, mimeType = 'text/plain'): void {
  downloadBlob(new Blob([text], { type: `${mimeType};charset=utf-8` }), filename);
}

/** Pretty-printed JSON download, for a webhook event payload. */
export function downloadJson(value: unknown, filename: string): void {
  downloadText(JSON.stringify(value, null, 2), filename, 'application/json');
}

/**
 * Open a URL the API handed us (a signed evidence-file link, a settlement report) in a new
 * tab. `noopener` is not optional: these URLs point at a storage host we do not control.
 */
export function openExternal(url: string): void {
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (opened) opened.opener = null;
}
