import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const projectId = process.env.PROJECT_ID;

  if (!projectId) {
    return NextResponse.json({ error: "missing_project_id" }, { status: 500 });
  }

  return NextResponse.json(
    { projectId },
    {
      headers: {
        "Cache-Control": "private, max-age=3600, must-revalidate",
      },
    },
  );
}
