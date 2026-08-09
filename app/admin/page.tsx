import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { hasAdminEmail } from "@/lib/admin-access";
import AdminConsole from "./admin-console";

export default async function AdminPage() {
  const user = await currentUser();

  if (!user || !hasAdminEmail(user.emailAddresses)) {
    notFound();
  }

  return (
    <AdminConsole
      adminName={user.fullName || user.firstName || "Administrator"}
      adminEmail={user.primaryEmailAddress?.emailAddress || "epowery@icloud.com"}
    />
  );
}
