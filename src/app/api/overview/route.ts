import { NextResponse } from "next/server";
import { getOverview } from "@/lib/api/queries";
import { jsonable } from "@/lib/json";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getOverview();
  return NextResponse.json(jsonable(data));
}
