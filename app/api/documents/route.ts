import { auth } from "@clerk/nextjs/server";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({ error: "Document storage requires BLOB_READ_WRITE_TOKEN." }, { status: 503 });
}
