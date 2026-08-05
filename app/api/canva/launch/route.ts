export async function POST() {
  return Response.json({ error: "Canva must be reconnected after production deployment." }, { status: 503 });
}
