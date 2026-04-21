import { NextResponse } from "next/server";
import { getAlerts } from "@/lib/api/queries";
import { jsonable } from "@/lib/json";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(jsonable(await getAlerts()));
}
