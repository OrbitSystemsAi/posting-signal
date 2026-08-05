import { auth } from "@clerk/nextjs/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await params;
  return Response.json({ error: "Document storage requires BLOB_READ_WRITE_TOKEN." }, { status: 503 });
}
