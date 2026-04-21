import { NextResponse } from "next/server";
import { getChain } from "@/lib/chains/registry";
import { getGasDetail } from "@/lib/api/queries";
import { jsonable } from "@/lib/json";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const chain = getChain(params.id);
  if (!chain) return NextResponse.json({ error: "unknown chain" }, { status: 404 });
  const data = await getGasDetail(chain);
  return NextResponse.json(jsonable(data));
}
