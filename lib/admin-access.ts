export const DEFAULT_ADMIN_EMAILS = ["epowery@icloud.com"] as const;

const configuredAdminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;

  const allowed = new Set([
    ...DEFAULT_ADMIN_EMAILS,
    ...configuredAdminEmails(),
  ]);

  return allowed.has(email.trim().toLowerCase());
}

export function hasAdminEmail(
  emailAddresses: ReadonlyArray<{ emailAddress?: string | null }> | null | undefined,
) {
  return Boolean(emailAddresses?.some(({ emailAddress }) => isAdminEmail(emailAddress)));
}
