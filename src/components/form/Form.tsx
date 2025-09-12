/**
 * The form element.
 *
 * Everything here exists because a `<form>` with a `<div>` around some inputs gets four things
 * wrong, every time:
 *
 *  1. no `noValidate`, so the browser's own bubble validation fights ours and wins;
 *  2. no form-level error region, so a 400 with no field attribution lands nowhere;
 *  3. the submit button outside the form, so Enter does not submit;
 *  4. the error summary not focused, so a keyboard user submits and nothing appears to happen.
 *
 * The summary is `role="alert"` and takes focus on appearance. That is the single most
 * important accessibility behaviour in this repo and `Form.test.tsx` asserts it.
 */
import { useEffect, useRef } from 'react';
import type { FormEvent, ReactNode } from 'react';

import { pz } from '@lib/cn';

import { color, font, radius, space } from '../ui/tokens';

