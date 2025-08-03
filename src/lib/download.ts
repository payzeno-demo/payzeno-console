/**
 * Browser downloads.
 *
 * One object-URL lifecycle, in one place. Every leaked blob URL pins its buffer for the
 * lifetime of the tab, and a merchant exporting settlement batches all afternoon will notice.
 */
import { assert } from './assert';

/**
 * Trigger a download of `blob` as `filename`.
