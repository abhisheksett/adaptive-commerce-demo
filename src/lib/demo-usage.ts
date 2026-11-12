import { getStore } from "@netlify/blobs";
import { z } from "zod/v4";

const usageSchema = z
  .object({
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    daily: z.number().int().nonnegative(),
    minute: z.number().int().nonnegative(),
    minuteCount: z.number().int().nonnegative(),
    leases: z
      .array(z.object({ id: z.string().uuid(), expires: z.number().int() }))
      .max(2),
  })
  .strict();
type Usage = z.infer<typeof usageSchema>;

function refusal(error: string, code: string, retryAfter = 60, status = 429) {
  return Response.json(
    { error, code },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(retryAfter),
      },
    },
  );
}

function limit(name: string, fallback: number, ceiling: number) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > ceiling)
    throw new Error("Invalid demo limit.");
  return value;
}

export async function reserveDemoGeneration(): Promise<
  Response | { release: () => Promise<void> }
> {
  if (process.env.DEMO_AI_ENABLED === "false")
    return refusal(
      "AI edits are paused by the demo owner. Browsing and your bag remain available.",
      "DEMO_DISABLED",
      60,
      503,
    );
  if (process.env.NODE_ENV !== "production" && process.env.NETLIFY !== "true")
    return { release: async () => {} };

  try {
    const dailyLimit = limit("DEMO_DAILY_LIMIT", 40, 200);
    const minuteLimit = limit("DEMO_PER_MINUTE_LIMIT", 4, 10);
    const store = getStore({
      name: "demo-guardrails-v1",
      consistency: "strong",
      fetch: (input, options) =>
        fetch(input, {
          ...options,
          signal: AbortSignal.any([
            AbortSignal.timeout(4000),
            ...(options?.signal ? [options.signal] : []),
          ]),
        }),
    });
    async function update(
      change: (usage: Usage, now: number) => Usage | Response,
    ) {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const entry = await store.getWithMetadata("usage", {
          type: "json",
          consistency: "strong",
        });
        const previous = entry ? usageSchema.parse(entry.data) : null;
        const now = Date.now();
        const day = new Date(now).toISOString().slice(0, 10);
        const minute = Math.floor(now / 60000);
        const next = change(
          {
            day,
            daily: previous?.day === day ? previous.daily : 0,
            minute,
            minuteCount: previous?.minute === minute ? previous.minuteCount : 0,
            leases:
              previous?.leases.filter((lease) => lease.expires > now) ?? [],
          },
          now,
        );
        if (next instanceof Response) return next;
        const written = await store.setJSON(
          "usage",
          next,
          entry ? { onlyIfMatch: entry.etag } : { onlyIfNew: true },
        );
        if (written.modified) return null;
      }
      throw new Error("Usage reservation contention.");
    }
    const id = crypto.randomUUID();
    const denied = await update((usage, now) => {
      if (usage.daily >= dailyLimit) {
        const midnight = Date.parse(`${usage.day}T00:00:00Z`) + 86400000;
        return refusal(
          "The demo's daily AI allowance is used. Please return after midnight UTC; browsing and checkout still work.",
          "DEMO_DAILY_LIMIT",
          Math.max(1, Math.ceil((midnight - now) / 1000)),
        );
      }
      if (usage.minuteCount >= minuteLimit)
        return refusal(
          "The demo is receiving requests too quickly. Please wait a minute.",
          "DEMO_RATE_LIMIT",
          60 - (Math.floor(now / 1000) % 60),
        );
      if (usage.leases.length >= 2)
        return refusal(
          "Two edits are already composing. Please wait for one to finish.",
          "DEMO_BUSY",
          15,
        );
      return {
        ...usage,
        daily: usage.daily + 1,
        minuteCount: usage.minuteCount + 1,
        leases: [...usage.leases, { id, expires: now + 120000 }],
      };
    });
    if (denied) return denied;
    return {
      release: async () => {
        try {
          await update((usage) => ({
            ...usage,
            leases: usage.leases.filter((lease) => lease.id !== id),
          }));
        } catch {
          console.warn("Demo usage lease release failed; lease will expire.");
        }
      },
    };
  } catch {
    console.warn("Demo usage protection unavailable; paid request refused.");
    return refusal(
      "AI edits are temporarily unavailable because usage protection could not be verified. Your current edit is unchanged.",
      "USAGE_GUARD_UNAVAILABLE",
      60,
      503,
    );
  }
}
