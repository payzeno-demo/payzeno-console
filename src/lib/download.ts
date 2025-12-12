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
