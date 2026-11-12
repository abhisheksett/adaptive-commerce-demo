import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reserveDemoGeneration } from "./demo-usage";

const blobs = vi.hoisted(() => ({
  getStore: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
}));
vi.mock("@netlify/blobs", () => ({ getStore: blobs.getStore }));
let data: unknown;
let revision: number;

beforeEach(() => {
  data = null;
  revision = 0;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-12T12:00:00Z"));
  vi.stubEnv("NETLIFY", "true");
  vi.stubEnv("DEMO_AI_ENABLED", "true");
  vi.stubEnv("DEMO_DAILY_LIMIT", "40");
  vi.stubEnv("DEMO_PER_MINUTE_LIMIT", "4");
  blobs.getStore.mockReturnValue({
    getWithMetadata: blobs.get,
    setJSON: blobs.set,
  });
  blobs.get.mockImplementation(async () =>
    data === null
      ? null
      : { data: structuredClone(data), etag: String(revision) },
  );
  blobs.set.mockImplementation(async (_key, next, options) => {
    if (
      options.onlyIfNew
        ? data !== null
        : options.onlyIfMatch !== String(revision)
    )
      return { modified: false };
    data = structuredClone(next);
    revision += 1;
    return { modified: true, etag: String(revision) };
  });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe("persistent demo usage", () => {
  it("reserves atomically and releases concurrency without refunding daily usage", async () => {
    const reservation = await reserveDemoGeneration();
    expect(reservation).not.toBeInstanceOf(Response);
    expect(blobs.getStore).toHaveBeenCalledWith(
      expect.objectContaining({ consistency: "strong" }),
    );
    expect(blobs.set.mock.calls[0][2]).toEqual({ onlyIfNew: true });
    expect(data).toMatchObject({
      daily: 1,
      minuteCount: 1,
      leases: [expect.any(Object)],
    });
    if (reservation instanceof Response)
      throw new Error("Expected reservation.");
    await reservation.release();
    expect(data).toMatchObject({ daily: 1, minuteCount: 1, leases: [] });
    expect(blobs.set.mock.calls[1][2]).toEqual({ onlyIfMatch: "1" });
  });
  it("enforces the daily cap across separate module instances and resets only on a new UTC day", async () => {
    vi.stubEnv("DEMO_DAILY_LIMIT", "1");
    const reservation = await reserveDemoGeneration();
    if (reservation instanceof Response)
      throw new Error("Expected reservation.");
    await reservation.release();
    vi.resetModules();
    const anotherInstance = await import("./demo-usage");
    const denied = await anotherInstance.reserveDemoGeneration();
    expect(denied).toBeInstanceOf(Response);
    expect(await (denied as Response).json()).toMatchObject({
      code: "DEMO_DAILY_LIMIT",
    });
    vi.setSystemTime(new Date("2026-11-13T00:00:00Z"));
    expect(await reserveDemoGeneration()).not.toBeInstanceOf(Response);
    expect(data).toMatchObject({ daily: 1 });
  });
  it("enforces a shared minute limit even after a generation finishes", async () => {
    vi.stubEnv("DEMO_PER_MINUTE_LIMIT", "1");
    const reservation = await reserveDemoGeneration();
    if (reservation instanceof Response)
      throw new Error("Expected reservation.");
    await reservation.release();
    const denied = await reserveDemoGeneration();
    expect((denied as Response).status).toBe(429);
    expect(await (denied as Response).json()).toMatchObject({
      code: "DEMO_RATE_LIMIT",
    });
    vi.setSystemTime(new Date("2026-11-12T12:01:00Z"));
    expect(await reserveDemoGeneration()).not.toBeInstanceOf(Response);
  });
  it("admits only two simultaneous requests under competing conditional writes", async () => {
    const results = await Promise.all(
      Array.from({ length: 15 }, () => reserveDemoGeneration()),
    );
    expect(
      results.filter((result) => !(result instanceof Response)),
    ).toHaveLength(2);
    expect(
      results
        .filter((result) => result instanceof Response)
        .every((result) => (result as Response).status === 429),
    ).toBe(true);
    expect(data).toMatchObject({
      daily: 2,
      leases: [expect.any(Object), expect.any(Object)],
    });
  });
  it("recovers expired leases without refunding abandoned generations", async () => {
    await reserveDemoGeneration();
    await reserveDemoGeneration();
    expect(((await reserveDemoGeneration()) as Response).status).toBe(429);
    vi.setSystemTime(new Date("2026-11-12T12:03:00Z"));
    expect(await reserveDemoGeneration()).not.toBeInstanceOf(Response);
    expect(data).toMatchObject({ daily: 3, leases: [expect.any(Object)] });
  });
  it("refuses work when disabled without touching storage", async () => {
    vi.stubEnv("DEMO_AI_ENABLED", "false");
    const denied = await reserveDemoGeneration();
    expect((denied as Response).status).toBe(503);
    expect(blobs.getStore).not.toHaveBeenCalled();
  });
  it("fails closed on unavailable storage, corrupt state or unsafe limit configuration", async () => {
    blobs.get.mockRejectedValueOnce(new Error("unavailable"));
    expect(((await reserveDemoGeneration()) as Response).status).toBe(503);
    data = { daily: -1 };
    expect(((await reserveDemoGeneration()) as Response).status).toBe(503);
    data = null;
    vi.stubEnv("DEMO_DAILY_LIMIT", "999999");
    expect(((await reserveDemoGeneration()) as Response).status).toBe(503);
    expect(blobs.set).not.toHaveBeenCalled();
  });
  it("fails closed if conditional writes never succeed", async () => {
    blobs.set.mockResolvedValue({ modified: false });
    expect(((await reserveDemoGeneration()) as Response).status).toBe(503);
    expect(blobs.set).toHaveBeenCalledTimes(8);
    expect(data).toBeNull();
  });
});
