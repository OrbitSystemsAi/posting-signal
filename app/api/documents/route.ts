export async function POST() {
  return Response.json({ error: "Document storage requires BLOB_READ_WRITE_TOKEN." }, { status: 503 });
}
