/**
 * The console's client-side password check, shared by signup, accept-invite and reset.
 * payzeno-api is authoritative and its `field_errors` still render; this only saves a round
 * trip for the two mistakes everyone makes.
 */
export const MIN_PASSWORD_LENGTH = 10;

export function passwordProblem(password: string, confirmation: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password !== confirmation) return 'The two passwords do not match.';
  return null;
}
