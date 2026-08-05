import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users, workspaces } from "@/db/schema";

export async function requireCurrentWorkspace() {
  const { userId } = await auth();
  if (!userId) return null;

  const [member, db] = await Promise.all([currentUser(), Promise.resolve(getDb())]);
  if (!member || !db) return null;
  const email = member.primaryEmailAddress?.emailAddress;
  if (!email) throw new Error("The signed-in account has no primary email address");
  const name = member.fullName || member.firstName || email;

  const [databaseUser] = await db
    .insert(users)
    .values({ email, name })
    .onConflictDoUpdate({ target: users.email, set: { name } })
    .returning();

  let [workspace] = await db.select().from(workspaces).where(eq(workspaces.ownerId, databaseUser.id)).limit(1);
  if (!workspace) {
    [workspace] = await db
      .insert(workspaces)
      .values({ ownerId: databaseUser.id, name: `${name}'s workspace`, slug: `personal-${userId.toLowerCase()}` })
      .onConflictDoNothing()
      .returning();
    if (!workspace) {
      [workspace] = await db.select().from(workspaces).where(eq(workspaces.ownerId, databaseUser.id)).limit(1);
    }
  }

  if (!workspace) throw new Error("Unable to resolve the authenticated workspace");
  return { db, member, workspace };
}
