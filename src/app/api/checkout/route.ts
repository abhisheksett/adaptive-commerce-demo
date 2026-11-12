import { randomUUID } from "node:crypto";
import { calculateOrder, checkoutSchema } from "@/lib/commerce";
import { allowRequest, readRequestBody } from "@/lib/server";
import { requireDemoAccess } from "@/lib/demo-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await requireDemoAccess(request);
  if (denied) return denied;
  if (!allowRequest("checkout", 40))
    return Response.json(
      { error: "Please try again in a minute." },
      { status: 429 },
    );
  try {
    const input = checkoutSchema.parse(await readRequestBody(request));
    const totals = calculateOrder(input.items);
    return Response.json({
      order: {
        id: `DEMO-${randomUUID().slice(0, 8).toUpperCase()}`,
        ...totals,
        brandId: input.brandId,
        simulated: true,
      },
    });
  } catch {
    return Response.json(
      {
        error:
          "Your bag contains an invalid product, size, or quantity. Please review it and try again.",
      },
      { status: 400 },
    );
  }
}
