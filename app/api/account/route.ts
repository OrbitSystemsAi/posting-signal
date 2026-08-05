import { auth } from "@clerk/nextjs/server";

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({ error: "Account deletion requires authenticated database mode." }, { status: 503 });
}
