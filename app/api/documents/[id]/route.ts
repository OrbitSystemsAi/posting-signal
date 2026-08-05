export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await params;
  return Response.json({ error: "Document storage requires BLOB_READ_WRITE_TOKEN." }, { status: 503 });
}
