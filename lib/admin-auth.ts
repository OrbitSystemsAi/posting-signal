import { currentUser } from "@clerk/nextjs/server";
import { hasAdminEmail } from "@/lib/admin-access";

export async function requireAdminUser() {
  const user = await currentUser();
  return user && hasAdminEmail(user.emailAddresses) ? user : null;
}
