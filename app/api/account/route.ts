export async function DELETE() {
  return Response.json({ error: "Account deletion requires authenticated database mode." }, { status: 503 });
}
