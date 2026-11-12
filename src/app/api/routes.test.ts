import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as checkout } from "./checkout/route";
import { GET as status, POST as compose } from "./experience/route";

const create = vi.hoisted(() => vi.fn());
const stream = vi.hoisted(() => vi.fn());
vi.mock("@anthropic-ai/sdk", () => {
  class APIError extends Error {}
  return {
    default: class {
      static APIError = APIError;
      messages = { create, stream };
    },
  };
});

const request = (path: string, body: unknown, origin?: string) =>
  new Request(`http://localhost:3000/api/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { origin } : {}),
    },
    body: JSON.stringify(body),
  });
afterEach(() => {
  vi.unstubAllEnvs();
  create.mockReset();
  stream.mockReset();
});

const conciseEdit = {
  title: "A quieter weekend",
  description: "Easy cotton layers.",
  layout: "outfit",
  productIds: ["tee", "chinos"],
  suggestions: ["Show shirts", "Compare shoes"],
  sections: [
    {
      type: "editorial",
      title: "Room to move",
      body: "Cotton for the weekend.",
      imageId: "tee",
    },
    {
      type: "products",
      title: "Your pieces",
      body: "Easy cotton layers.",
      productIds: ["tee", "chinos"],
      presentation: "rail",
    },
    {
      type: "look",
      title: "Together",
      body: "White with olive.",
      productIds: ["tee", "chinos"],
    },
  ],
};
const providerEdit = (input: unknown = conciseEdit) => ({
  model: "claude-haiku-4-5-20251001",
  usage: {
    input_tokens: 100,
    output_tokens: 200,
    cache_read_input_tokens: 4000,
    cache_creation_input_tokens: 0,
  },
  content: [{ type: "tool_use", name: "compose_experience", input }],
});

describe("experience API", () => {
  it("uses a strict catalog schema and caches only the stable system/catalog prefix", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-placeholder");
    create.mockResolvedValue(providerEdit());
    const response = await compose(
      request("experience", { message: "Weekend", brandId: "forme" }),
    );
    expect(response.status).toBe(200);
    const parameters = create.mock.calls[0][0];
    expect(parameters.max_tokens).toBe(2600);
    expect(parameters.tools[0].strict).toBe(true);
    expect(
      parameters.tools[0].input_schema.properties.productIds.items.enum,
    ).toContain("tee");
    expect(
      parameters.tools[0].input_schema.properties.sections.required,
    ).toEqual(["first", "second", "third"]);
    expect(parameters.system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(parameters.system[0].text).toContain("APPROVED CATALOG");
    expect(parameters.messages[0].content[0]).not.toHaveProperty(
      "cache_control",
    );
    expect(await response.json()).toMatchObject({
      meta: { cacheReadTokens: 4000, attempts: 1 },
    });
  });
  it("adapts required tool section slots to the existing validated A2UI sequence", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-placeholder");
    create.mockResolvedValue(
      providerEdit({
        ...conciseEdit,
        sections: {
          first: conciseEdit.sections[0],
          second: conciseEdit.sections[1],
          third: conciseEdit.sections[2],
        },
      }),
    );
    const response = await compose(
      request("experience", { message: "Weekend", brandId: "forme" }),
    );
    expect(await response.json()).toMatchObject({
      experience: conciseEdit,
      source: "claude",
      meta: { attempts: 1 },
    });
  });
  it("repairs the actual slotted field constraint instead of reporting an array-shape error", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-placeholder");
    create
      .mockResolvedValueOnce(
        providerEdit({
          ...conciseEdit,
          sections: {
            first: { ...conciseEdit.sections[0], body: "x".repeat(401) },
            second: conciseEdit.sections[1],
            third: conciseEdit.sections[2],
          },
        }),
      )
      .mockResolvedValue(providerEdit());
    const response = await compose(
      request("experience", { message: "Weekend", brandId: "forme" }),
    );
    expect(response.status).toBe(200);
    const retry = JSON.parse(
      create.mock.calls[1][0].messages[0].content.find(
        (block: { type: string }) => block.type === "text",
      ).text,
    );
    expect(retry.correction.problems).toContain("sections.first.body");
  });
  it("routes short follow-ups to the fast model, honors quality mode and escalates a failed fast edit", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-placeholder");
    vi.stubEnv("ANTHROPIC_MODEL", "quality-model");
    vi.stubEnv("ANTHROPIC_FAST_MODEL", "fast-model");
    const history = [{ message: "Weekend", productIds: ["tee"] }];
    create
      .mockResolvedValueOnce(
        providerEdit({ ...conciseEdit, productIds: ["invented"] }),
      )
      .mockResolvedValue(providerEdit());
    expect(
      (
        await compose(
          request("experience", {
            message: "Add trousers",
            brandId: "forme",
            history,
          }),
        )
      ).status,
    ).toBe(200);
    expect(create.mock.calls.map((call) => call[0].model)).toEqual([
      "fast-model",
      "quality-model",
    ]);
    await compose(
      request("experience", {
        message: "Add trousers",
        brandId: "forme",
        speed: "quality",
        history,
      }),
    );
    expect(create.mock.calls.at(-1)?.[0].model).toBe("quality-model");
    await compose(
      request("experience", {
        message: "Style this tee",
        brandId: "forme",
        history,
        context: { lockedIds: ["tee"] },
      }),
    );
    expect(create.mock.calls.at(-1)?.[0].model).toBe("quality-model");
    expect(
      create.mock.calls.at(-1)?.[0].tools[0].input_schema.properties.sections
        .properties.third.properties.type.const,
    ).toBe("look");
    await compose(
      request("experience", {
        message: "Add trousers",
        brandId: "forme",
        history,
        context: { preferences: { budget: 500 } },
      }),
    );
    expect(create.mock.calls.at(-1)?.[0].model).toBe("quality-model");
    await compose(
      request("experience", {
        message: "A reference",
        brandId: "forme",
        speed: "fast",
        inspiration: {
          mediaType: "image/jpeg",
          data: Buffer.from([255, 216, 255, 0, 0, 0, 0, 0, 0]).toString(
            "base64",
          ),
        },
      }),
    );
    expect(create.mock.calls.at(-1)?.[0].model).toBe("quality-model");
  });
  it("streams provider-backed progress followed by only a validated result", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-placeholder");
    stream.mockReturnValue({
      async *[Symbol.asyncIterator]() {
        yield {
          type: "content_block_delta",
          delta: { type: "input_json_delta", partial_json: "{" },
        };
      },
      finalMessage: async () => providerEdit(),
    });
    const incoming = request("experience", {
      message: "Weekend",
      brandId: "forme",
    });
    incoming.headers.set("accept", "application/x-ndjson");
    const response = await compose(incoming);
    expect(response.headers.get("content-type")).toBe("application/x-ndjson");
    const events = (await response.text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(events[0]).toMatchObject({ type: "progress" });
    expect(events.some((event) => event.message?.includes("composing"))).toBe(
      true,
    );
    expect(events.at(-1)).toMatchObject({
      type: "result",
      experience: conciseEdit,
      source: "claude",
      meta: { firstTokenMs: expect.any(Number) },
    });
    expect(create).not.toHaveBeenCalled();
  });
  it("never streams an invalid composition as a result", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-placeholder");
    stream.mockReturnValue({
      async *[Symbol.asyncIterator]() {},
      finalMessage: async () =>
        providerEdit({ ...conciseEdit, productIds: ["invented"] }),
    });
    const incoming = request("experience", {
      message: "Weekend",
      brandId: "forme",
    });
    incoming.headers.set("accept", "application/x-ndjson");
    const events = (await (await compose(incoming)).text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(events.at(-1).type).toBe("error");
    expect(events.some((event) => event.type === "result")).toBe(false);
    expect(stream).toHaveBeenCalledTimes(2);
  });
  it("aborts the provider when the response reader cancels", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-placeholder");
    let providerSignal: AbortSignal | undefined;
    stream.mockImplementation(
      (_parameters: unknown, options: { signal: AbortSignal }) => {
        providerSignal = options.signal;
        return {
          async *[Symbol.asyncIterator]() {
            await new Promise((_resolve, reject) => {
              if (options.signal.aborted) reject(new Error("aborted"));
              else
                options.signal.addEventListener(
                  "abort",
                  () => reject(new Error("aborted")),
                  { once: true },
                );
            });
          },
          finalMessage: async () => providerEdit(),
        };
      },
    );
    const incoming = request("experience", {
      message: "Weekend",
      brandId: "forme",
    });
    incoming.headers.set("accept", "application/x-ndjson");
    const reader = (await compose(incoming)).body!.getReader();
    await reader.read();
    await reader.cancel();
    expect(providerSignal?.aborted).toBe(true);
  });
  it("refuses composition without a key rather than generating a rule-based edit", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(await (await status()).json()).toMatchObject({
      mode: "unconfigured",
    });
    const response = await compose(
      request("experience", { message: "A weekend away", brandId: "forme" }),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      code: "KEY_NOT_CONFIGURED",
    });
    expect(create).not.toHaveBeenCalled();
  });
  it("rejects malformed, oversized, and cross-origin requests", async () => {
    for (const body of [
      { message: "", brandId: "forme" },
      { message: "hello", brandId: "unknown" },
      { message: "x".repeat(17000), brandId: "forme" },
    ]) {
      expect((await compose(request("experience", body))).status).toBe(400);
    }
    expect(
      (
        await compose(
          request(
            "experience",
            { message: "hello", brandId: "forme" },
            "https://untrusted.example",
          ),
        )
      ).status,
    ).toBe(400);
  });
  it("uses the incoming host when a dev server normalizes the URL hostname", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const incoming = request(
      "experience",
      { message: "weekend", brandId: "forme" },
      "http://127.0.0.1:3000",
    );
    incoming.headers.set("host", "127.0.0.1:3000");
    expect((await compose(incoming)).status).toBe(503);
  });
  it("accepts a grounded Claude tool response", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-placeholder");
    create.mockResolvedValue({
      model: "claude-sonnet-4-6",
      usage: { input_tokens: 100, output_tokens: 120 },
      content: [
        {
          type: "tool_use",
          name: "compose_experience",
          input: {
            title: "A quieter weekend",
            description: "Easy layers for your plans.",
            layout: "outfit",
            productIds: ["knit", "trousers"],
            suggestions: ["Show bags", "Compare these pieces"],
            sections: [
              {
                type: "editorial",
                title: "A little room to move",
                body: "Easy layers for a slower day.",
                imageId: "knit",
              },
              {
                type: "products",
                title: "Your starting pieces",
                body: "A soft knit with easy trousers.",
                productIds: ["knit", "trousers"],
                presentation: "rail",
              },
              {
                type: "look",
                title: "Together, effortlessly",
                body: "Texture with a clean line.",
                productIds: ["knit", "trousers"],
              },
            ],
          },
        },
      ],
    });
    const response = await compose(
      request("experience", { message: "weekend", brandId: "studio" }),
    );
    expect(await response.json()).toMatchObject({
      source: "claude",
      experience: { productIds: ["knit", "trousers"] },
      a2ui: [
        { version: "v0.9", createSurface: { surfaceId: "discovery" } },
        { version: "v0.9", updateComponents: { surfaceId: "discovery" } },
      ],
    });
  });
  it("uses one Claude repair attempt for invalid composition, never a rule-based edit", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-placeholder");
    create.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "compose_experience",
          input: {
            title: "Invalid",
            description: "Unknown product.",
            layout: "collection",
            productIds: ["invented"],
            suggestions: ["Show bags", "Show shoes"],
          },
        },
      ],
    });
    const response = await compose(
      request("experience", { message: "weekend", brandId: "forme" }),
    );
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body).toMatchObject({ code: "COMPOSITION_FAILED" });
    expect(body).not.toHaveProperty("experience");
    expect(create).toHaveBeenCalledTimes(2);
    const retry = JSON.parse(
      create.mock.calls[1][0].messages[0].content.find(
        (block: { type: string }) => block.type === "text",
      ).text,
    );
    expect(retry.correction.problems).toContain("sections");
  });
  it("returns only the corrected Claude composition after a successful repair", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-placeholder");
    const corrected = {
      title: "A shirt for the working day",
      description: "Blue cotton with easy tailoring.",
      layout: "collection",
      productIds: ["oxford-shirt", "chinos"],
      suggestions: ["Compare shirt fits", "Add a lighter layer"],
      sections: [
        {
          type: "editorial",
          title: "A clean starting point",
          body: "An Oxford shirt with relaxed tailoring.",
          imageId: "oxford-shirt",
        },
        {
          type: "products",
          title: "The blue Oxford",
          body: "Cotton with a structured line.",
          productIds: ["oxford-shirt"],
          presentation: "spotlight",
        },
        {
          type: "look",
          title: "Into the afternoon",
          body: "A blue shirt with olive chinos.",
          productIds: ["oxford-shirt", "chinos"],
        },
      ],
    };
    const toolResponse = (input: unknown) => ({
      model: "claude-sonnet-4-6",
      usage: { input_tokens: 100, output_tokens: 50 },
      content: [{ type: "tool_use", name: "compose_experience", input }],
    });
    create
      .mockResolvedValueOnce(
        toolResponse({ ...corrected, productIds: ["invented"] }),
      )
      .mockResolvedValueOnce(toolResponse(corrected));
    const response = await compose(
      request("experience", { message: "A shirt for work", brandId: "forme" }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      experience: corrected,
      source: "claude",
      meta: { attempts: 2, inputTokens: 200, outputTokens: 100 },
    });
    expect(create).toHaveBeenCalledTimes(2);
  });
  it("preserves failure semantics when the provider is unavailable", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-placeholder");
    create.mockRejectedValue(new Error("Provider unavailable"));
    const response = await compose(
      request("experience", { message: "weekend", brandId: "forme" }),
    );
    expect(response.status).toBe(502);
    expect(await response.json()).not.toHaveProperty("experience");
  });
  it("rejects forged image content and unknown shopping anchors before calling Claude", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-placeholder");
    for (const extra of [
      {
        inspiration: {
          mediaType: "image/jpeg",
          data: Buffer.from("not an image file").toString("base64"),
        },
      },
      { context: { lockedIds: ["invented"] } },
      { inspiration: { mediaType: "image/svg+xml", data: "PHN2Zz48L3N2Zz4=" } },
    ])
      expect(
        (
          await compose(
            request("experience", {
              message: "Style this",
              brandId: "forme",
              ...extra,
            }),
          )
        ).status,
      ).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
  it("requires rich discovery sections in new model output, not a legacy plain list", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-placeholder");
    create.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "compose_experience",
          input: {
            title: "A list",
            description: "Known products without a journey.",
            layout: "collection",
            productIds: ["tee"],
            suggestions: ["Show shoes", "Show shirts"],
          },
        },
      ],
    });
    const response = await compose(
      request("experience", { message: "A weekend", brandId: "forme" }),
    );
    expect(response.status).toBe(502);
    expect(create).toHaveBeenCalledTimes(2);
    expect(await response.json()).not.toHaveProperty("experience");
  });
});

describe("checkout API", () => {
  it("completes a simulated order using server prices", async () => {
    const response = await checkout(
      request("checkout", {
        brandId: "forme",
        items: [{ productId: "tee", size: "M", quantity: 2 }],
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      order: {
        simulated: true,
        subtotal: 90,
        total: 100,
        id: expect.stringMatching(/^DEMO-/),
      },
    });
  });
  it("rejects injected prices and empty bags", async () => {
    expect(
      (
        await checkout(
          request("checkout", {
            brandId: "forme",
            items: [{ productId: "tee", size: "M", quantity: 1, price: 1 }],
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (await checkout(request("checkout", { brandId: "forme", items: [] })))
        .status,
    ).toBe(400);
  });
});
