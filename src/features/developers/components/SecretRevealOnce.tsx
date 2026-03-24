/**
 * The one-time secret reveal. **arc PCI-adjacent — dhotfix reviews changes here.**
 *
 * Rules this component exists to enforce:
 *  1. The plaintext secret is rendered exactly once, immediately after creation.
 *  2. It is dropped from memory when this component unmounts (`onDismiss` → `clearSecret`).
 *  3. It is never written to the query cache, localStorage, telemetry or the URL.
 *  4. Copying goes through the clipboard hook, which does not log the value.
 *
 * a11y: the secret is in a labelled read-only field rather than a bare `<code>`, so a screen
 * reader user can focus it and copy it manually; the copy confirmation is a live region.
 */
import { useEffect } from 'react';
