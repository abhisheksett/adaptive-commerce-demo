import { describe, expect, it } from "vitest";
import {
  calculateOrder,
  mergeCart,
  shoppingContextSchema,
  validateExperience,
  validateShoppingExperience,
} from "./commerce";

const composition = {
  title: "Easy layers",
  description: "A small edit from the approved catalog.",
  layout: "outfit",
  productIds: ["knit", "trousers"],
  suggestions: ["Compare these pieces", "Show a lighter layer"],
};

import {
  Catalog,
  ComponentContext,
  MessageProcessor,
} from "@a2ui/web_core/v0_9";
import {
  discoveryApis,
  discoveryCatalogId,
  discoveryMessages,
} from "./discovery";

describe("experience composition", () => {
  it("adds a whole look atomically without mutating the bag on failure", () => {
    const cart = [{ productId: "tee", size: "M", quantity: 9 }];
    expect(
      mergeCart(cart, [{ productId: "tee", size: "M", quantity: 1 }])[0]
        .quantity,
    ).toBe(10);
    expect(() =>
      mergeCart(cart, [{ productId: "tee", size: "M", quantity: 2 }]),
    ).toThrow();
    expect(() =>
      mergeCart(cart, [{ productId: "tee", size: "invalid", quantity: 1 }]),
    ).toThrow();
    expect(cart[0].quantity).toBe(9);
  });
  it("enforces shopping context rather than trusting model claims", () => {
    const context = shoppingContextSchema.parse({
      preferences: { budget: 200 },
      lockedIds: [],
    });
    expect(() =>
      validateShoppingExperience(composition, context),
    ).not.toThrow();
    expect(() =>
      validateShoppingExperience(
        composition,
        shoppingContextSchema.parse({ replaceIds: ["knit"] }),
      ),
    ).toThrow(/replacement/);
    expect(() =>
      validateShoppingExperience(
        composition,
        shoppingContextSchema.parse({ lockedIds: ["tee"] }),
      ),
    ).toThrow(/locked/);
    expect(() =>
      validateShoppingExperience(
        composition,
        shoppingContextSchema.parse({ preferences: { budget: 50 } }),
      ),
    ).toThrow(/budget/);
    expect(() =>
      validateShoppingExperience(
        { ...composition, productIds: ["loafers"] },
        shoppingContextSchema.parse({
          preferences: { excludedMaterials: ["leather"] },
        }),
      ),
    ).toThrow(/material/);
    expect(() =>
      shoppingContextSchema.parse({ savedIds: ["invented"] }),
    ).toThrow();
  });
  it("keeps locked pieces together and checks the sum of an entire look", () => {
    const edit = {
      ...composition,
      sections: [
        {
          type: "editorial",
          title: "Layers",
          body: "Easy layers.",
          imageId: "knit",
        },
        {
          type: "products",
          title: "The knit",
          body: "A soft layer.",
          productIds: ["knit"],
          presentation: "rail",
        },
        {
          type: "look",
          title: "Together",
          body: "A simple pairing.",
          productIds: ["knit", "trousers"],
        },
      ],
    };
    expect(() =>
      validateShoppingExperience(
        edit,
        shoppingContextSchema.parse({
          lockedIds: ["knit"],
          preferences: { budget: 250 },
        }),
      ),
    ).not.toThrow();
    expect(() =>
      validateShoppingExperience(
        edit,
        shoppingContextSchema.parse({
          lockedIds: ["knit"],
          preferences: { budget: 200 },
        }),
      ),
    ).toThrow(/budget/);
    expect(() =>
      validateShoppingExperience(
        composition,
        shoppingContextSchema.parse({ lockedIds: ["knit"] }),
      ),
    ).toThrow(/together/);
  });
  it("creates a real A2UI surface and dispatches a refinement through the SDK", async () => {
    const catalog = new Catalog(
      discoveryCatalogId,
      "v0.9",
      Object.values(discoveryApis),
    );
    const actions: string[] = [];
    const processor = new MessageProcessor([catalog], (action) => {
      actions.push(String(action.context.prompt));
    });
    const experience = validateExperience({
      ...composition,
      sections: [
        {
          type: "editorial",
          title: "A different perspective",
          body: "Easy layers.",
          imageId: "hero",
        },
        {
          type: "question",
          title: "Where are you heading?",
          body: "",
          options: [
            { label: "Work", prompt: "A shirt for work" },
            { label: "Weekend", prompt: "A shirt for the weekend" },
          ],
        },
        {
          type: "products",
          title: "Start here",
          body: "",
          productIds: ["knit"],
          presentation: "spotlight",
        },
      ],
    });
    processor.processMessages(discoveryMessages(experience));
    const surface = processor.getSurface("discovery")!;
    expect(surface.rootId).toBe("root");
    await new ComponentContext(surface, "section_1").dispatchAction({
      event: { name: "refine", context: { prompt: "A shirt for work" } },
    });
    expect(actions).toEqual(["A shirt for work"]);
    processor.dispose();
  });
  it("validates every product reference in rich discovery sections", () => {
    const sections = [
      {
        type: "editorial",
        title: "A different perspective",
        body: "Easy layers for the way you move.",
        imageId: "hero",
      },
      {
        type: "question",
        title: "Where are you heading?",
        body: "Choose a direction.",
        options: [
          { label: "Work", prompt: "For work" },
          { label: "Weekend", prompt: "For the weekend" },
        ],
      },
      {
        type: "products",
        title: "Start here",
        body: "Consider these pieces.",
        productIds: ["knit"],
        presentation: "spotlight",
      },
    ];
    expect(() =>
      validateExperience({ ...composition, sections }),
    ).not.toThrow();
    expect(() =>
      validateExperience({
        ...composition,
        sections: [
          ...sections.slice(0, 2),
          { ...sections[2], productIds: ["invented"] },
        ],
      }),
    ).toThrow();
    expect(() =>
      validateExperience({
        ...composition,
        productIds: ["knit"],
        sections: [
          ...sections.slice(0, 2),
          { ...sections[2], productIds: ["tee"] },
        ],
      }),
    ).toThrow();
    expect(() =>
      validateExperience({
        ...composition,
        sections: [
          { ...sections[0], imageId: "https://untrusted.example/image.jpg" },
          ...sections.slice(1),
        ],
      }),
    ).toThrow();
  });
  it("accepts grounded compositions and preserves the model's chosen order", () => {
    expect(validateExperience(composition).productIds).toEqual([
      "knit",
      "trousers",
    ]);
  });
  it("rejects invented products and layouts", () => {
    expect(() =>
      validateExperience({
        ...composition,
        productIds: ["invented"],
      }),
    ).toThrow();
    expect(() =>
      validateExperience({
        ...composition,
        layout: "execute-code",
      }),
    ).toThrow();
  });
  it("rejects duplicates, executable content fields, and oversized compositions", () => {
    expect(() =>
      validateExperience({ ...composition, productIds: ["knit", "knit"] }),
    ).toThrow();
    expect(() =>
      validateExperience({ ...composition, script: "alert(1)" }),
    ).toThrow();
    expect(() =>
      validateExperience({ ...composition, title: "x".repeat(91) }),
    ).toThrow();
  });
});

describe("checkout", () => {
  it("uses catalog prices and computes delivery", () => {
    expect(
      calculateOrder([{ productId: "tee", size: "M", quantity: 2 }]),
    ).toMatchObject({ subtotal: 90, shipping: 10, total: 100 });
    expect(
      calculateOrder([{ productId: "coat", size: "M", quantity: 1 }]).shipping,
    ).toBe(0);
  });
  it("rejects unknown products, invalid sizes, quantities, and duplicate lines", () => {
    for (const item of [
      { productId: "fake", size: "M", quantity: 1 },
      { productId: "tee", size: "XXS", quantity: 1 },
      { productId: "tee", size: "M", quantity: -1 },
    ]) {
      expect(() => calculateOrder([item])).toThrow();
    }
    const item = { productId: "tee", size: "M", quantity: 1 };
    expect(() => calculateOrder([item, item])).toThrow();
  });
});
