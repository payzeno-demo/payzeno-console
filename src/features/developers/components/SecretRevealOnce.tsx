/**
 * The one-time secret reveal. **arc PCI-adjacent — dhotfix reviews changes here.**
 *
 * Rules this component exists to enforce:
 *  1. The plaintext secret is rendered exactly once, immediately after creation.
 *  2. It is dropped from memory when this component unmounts (`onDismiss` → `clearSecret`).
