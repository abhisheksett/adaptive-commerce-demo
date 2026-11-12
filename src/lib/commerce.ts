import { z } from "zod/v4";

export type Product = {
  id: string;
  name: string;
  category: "Clothing" | "Bags" | "Shoes";
  audience: "Women" | "Men" | "Everyone";
  price: number;
  color: string;
  swatch: string;
  image: string;
  sizes: string[];
  tags: string[];
  description: string;
  material: string;
};

export const products: Product[] = [
  {
    id: "coat",
    name: "The City Trench",
    category: "Clothing",
    audience: "Women",
    price: 245,
    color: "Stone",
    swatch: "#aea594",
    image: "coat",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["travel", "work", "layering", "outerwear", "spring"],
    description:
      "An easy, long-line layer with a relaxed drape. Made for early starts, late dinners, and everything in between.",
    material: "Cotton-blend twill. Relaxed fit. Dry clean.",
  },
  {
    id: "knit",
    name: "Soft Structure Knit",
    category: "Clothing",
    audience: "Women",
    price: 98,
    color: "Oat",
    swatch: "#d2c8b7",
    image: "knit",
    sizes: ["XS", "S", "M", "L"],
    tags: ["travel", "casual", "comfort", "knitwear", "winter"],
    description:
      "A tactile, easy-fitting knit with just enough structure. The layer you reach for again and again.",
    material: "Cotton-rich knit. Regular fit. Gentle cold wash.",
  },
  {
    id: "trousers",
    name: "Everyday Wide-Leg",
    category: "Clothing",
    audience: "Women",
    price: 115,
    color: "Sand",
    swatch: "#b3a184",
    image: "trousers",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["work", "travel", "comfort", "trousers", "spring"],
    description:
      "Clean lines, a comfortable waist, and room to move. A quietly versatile foundation for your wardrobe.",
    material: "Cotton twill. Wide-leg fit. Machine wash cold.",
  },
  {
    id: "bag",
    name: "The Everyday Tote",
    category: "Bags",
    audience: "Everyone",
    price: 165,
    color: "Onyx",
    swatch: "#282725",
    image: "bag",
    sizes: ["One size"],
    tags: ["travel", "work", "accessories", "bag"],
    description:
      "A clean silhouette with space for your daily essentials. From your morning commute to a weekend away.",
    material: "Leather outer. Cotton lining. 32 x 26 x 12 cm.",
  },
  {
    id: "dress",
    name: "After Hours Dress",
    category: "Clothing",
    audience: "Women",
    price: 185,
    color: "Ink",
    swatch: "#292d36",
    image: "dress",
    sizes: ["XS", "S", "M", "L"],
    tags: ["dinner", "evening", "occasion", "dress"],
    description:
      "An expressive silhouette for an evening with no particular end in mind. Understated, but never unnoticed.",
    material: "Viscose blend. Fluid fit. Dry clean.",
  },
  {
    id: "sneakers",
    name: "Off-Duty Sneakers",
    category: "Shoes",
    audience: "Everyone",
    price: 125,
    color: "Clay",
    swatch: "#bc775c",
    image: "sneakers",
    sizes: ["36", "37", "38", "39", "40", "41", "42", "43", "44"],
    tags: ["casual", "travel", "comfort", "shoes", "walking"],
    description:
      "Everyday sneakers with a little personality. Lightweight cushioning keeps your plans open.",
    material: "Leather and textile upper. Rubber sole. Regular fit.",
  },
  {
    id: "jacket",
    name: "The Weekend Jacket",
    category: "Clothing",
    audience: "Men",
    price: 225,
    color: "Black",
    swatch: "#292b2a",
    image: "jacket",
    sizes: ["S", "M", "L", "XL"],
    tags: ["casual", "travel", "outerwear", "layering", "winter"],
    description:
      "A timeless outer layer with a lived-in feel. Pair with a simple tee and take the long way home.",
    material: "Leather outer. Lined. Specialist clean only.",
  },
  {
    id: "tee",
    name: "Essential Cotton Tee",
    category: "Clothing",
    audience: "Men",
    price: 45,
    color: "White",
    swatch: "#ecece6",
    image: "tee",
    sizes: ["S", "M", "L", "XL"],
    tags: ["casual", "comfort", "travel", "summer", "basics"],
    description:
      "A good day starts with a good tee. Soft cotton, an easy shape, and no unnecessary details.",
    material: "100% cotton. Regular fit. Machine wash cold.",
  },
  {
    id: "linen-shirt",
    name: "The Open-Air Printed Shirt",
    category: "Clothing",
    audience: "Men",
    price: 128,
    color: "Faded Indigo",
    swatch: "#718e9d",
    image: "linen-shirt",
    sizes: ["S", "M", "L", "XL"],
    tags: ["shirt", "linen", "summer", "weekend", "travel", "relaxed"],
    description:
      "A small print, an easy line, and three-quarter sleeves. Wear loose or open over a tee for unhurried days.",
    material:
      "Cotton-linen blend. Relaxed fit. Gentle cold wash; natural creasing is part of the texture.",
  },
  {
    id: "oxford-shirt",
    name: "The Blue Oxford",
    category: "Clothing",
    audience: "Men",
    price: 110,
    color: "Sky",
    swatch: "#a4bdcc",
    image: "oxford-shirt",
    sizes: ["S", "M", "L", "XL"],
    tags: ["shirt", "cotton", "oxford", "work", "smart casual", "structured"],
    description:
      "A button-down collar and a little more structure. An easy bridge between an ordinary Tuesday and plans after work.",
    material: "100% cotton Oxford cloth. Regular fit. Machine wash cold.",
  },
  {
    id: "poplin-shirt",
    name: "The Relaxed Poplin",
    category: "Clothing",
    audience: "Everyone",
    price: 122,
    color: "White",
    swatch: "#efefeb",
    image: "poplin-shirt",
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: [
      "shirt",
      "cotton",
      "poplin",
      "work",
      "weekend",
      "oversized",
      "unisex",
    ],
    description:
      "Crisp cotton with room to make it your own. A generous silhouette, a curved hem, and sleeves made for rolling up.",
    material: "100% cotton poplin. Oversized fit. Machine wash cold.",
  },
  {
    id: "silk-shirt",
    name: "The Fluid Evening Top",
    category: "Clothing",
    audience: "Women",
    price: 148,
    color: "Pearl",
    swatch: "#dcd7d0",
    image: "silk-shirt",
    sizes: ["XS", "S", "M", "L"],
    tags: ["top", "blouse", "silk", "evening", "dinner", "fluid"],
    description:
      "A clean sleeveless shape and a fluid drape. An understated alternative to a shirt for evenings with easy tailoring.",
    material: "Silk-viscose blend. Fluid fit. Dry clean.",
  },
  {
    id: "chinos",
    name: "The Everyday Chino",
    category: "Clothing",
    audience: "Men",
    price: 130,
    color: "Olive",
    swatch: "#787c61",
    image: "chinos",
    sizes: ["28", "30", "32", "34", "36"],
    tags: ["trousers", "chinos", "work", "weekend", "travel", "smart casual"],
    description:
      "A straight leg, a clean front, and enough ease for a full day. A relaxed partner for a crisp shirt.",
    material: "Cotton with 2% elastane. Straight fit. Machine wash cold.",
  },
  {
    id: "blazer",
    name: "The Unstructured Blazer",
    category: "Clothing",
    audience: "Men",
    price: 235,
    color: "Graphite",
    swatch: "#555955",
    image: "blazer",
    sizes: ["S", "M", "L", "XL"],
    tags: ["blazer", "tailoring", "work", "dinner", "layering", "smart casual"],
    description:
      "Light structure without the formality. Soft shoulders and an easy shape make a shirt feel a little more considered.",
    material: "Cotton-linen blend. Unstructured regular fit. Dry clean.",
  },
  {
    id: "loafers",
    name: "The Leather Derby",
    category: "Shoes",
    audience: "Everyone",
    price: 160,
    color: "Chestnut",
    swatch: "#9b5b39",
    image: "loafers",
    sizes: ["36", "37", "38", "39", "40", "41", "42", "43", "44"],
    tags: ["derby", "shoes", "leather", "work", "dinner", "smart casual"],
    description:
      "A classic lace-up with a warm leather finish. A considered alternative to a sneaker when the occasion asks for a little more.",
    material:
      "Leather upper. Rubber sole. Regular fit. Wipe clean and condition leather.",
  },
];

export const brands = {
  forme: {
    id: "forme",
    name: "LIFE",
    tagline: "Considered pieces. Your point of view.",
    accent: "#c3ccbb",
    tint: "#252c27",
    hero: "hero",
    voice:
      "Thoughtful, warm, editorial. Short sentences. Never extravagant claims.",
    collection: "The considered wardrobe",
    heroText: "Good pieces. New possibilities.",
    currency: "USD",
  },
  studio: {
    id: "studio",
    name: "STUDIO / 02",
    tagline: "Everyday, on your own terms.",
    accent: "#bdc9dc",
    tint: "#252b34",
    hero: "studio",
    voice:
      "Direct, independent, contemporary. Precise and playful, never loud.",
    collection: "A different kind of everyday",
    heroText: "A fresh perspective on getting dressed.",
    currency: "USD",
  },
} as const;

export type BrandId = keyof typeof brands;
export const money = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
export const imageUrl = (image: string) => `/images/${image}.jpg`;
export const productById = (id: string) =>
  products.find((product) => product.id === id);

export const discoveryImageIds = [
  "hero",
  "studio",
  "coat",
  "knit",
  "trousers",
  "bag",
  "dress",
  "sneakers",
  "jacket",
  "tee",
  "linen-shirt",
  "oxford-shirt",
  "poplin-shirt",
  "silk-shirt",
  "chinos",
  "blazer",
  "loafers",
] as const;
export const discoverySectionSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("editorial"),
      title: z.string().min(1).max(90),
      body: z.string().min(1).max(400),
      imageId: z.enum(discoveryImageIds),
    })
    .strict(),
  z
    .object({
      type: z.literal("question"),
      title: z.string().min(1).max(120),
      body: z.string().max(200),
      options: z
        .array(
          z
            .object({
              label: z.string().min(1).max(45),
              prompt: z.string().min(1).max(200),
              imageId: z.enum(discoveryImageIds).optional(),
            })
            .strict(),
        )
        .min(2)
        .max(4),
    })
    .strict(),
  z
    .object({
      type: z.literal("products"),
      title: z.string().min(1).max(90),
      body: z.string().max(240),
      productIds: z.array(z.string()).min(1).max(6),
      presentation: z.enum(["spotlight", "rail"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("look"),
      title: z.string().min(1).max(90),
      body: z.string().min(1).max(300),
      productIds: z.array(z.string()).min(2).max(4),
    })
    .strict(),
  z
    .object({
      type: z.literal("comparison"),
      title: z.string().min(1).max(90),
      productIds: z.array(z.string()).min(2).max(4),
    })
    .strict(),
]);
export type DiscoverySection = z.infer<typeof discoverySectionSchema>;

export const experienceSchema = z
  .object({
    title: z.string().min(1).max(90),
    description: z.string().min(1).max(350),
    layout: z.enum(["collection", "comparison", "outfit"]),
    productIds: z.array(z.string()).min(1).max(8),
    suggestions: z.array(z.string().min(1).max(100)).min(2).max(3),
    sections: z.array(discoverySectionSchema).min(3).max(7).optional(),
  })
  .strict();
export type Experience = z.infer<typeof experienceSchema>;

export const preferencesSchema = z
  .object({
    occasion: z.string().trim().max(80).default(""),
    fit: z.enum(["Any", "Relaxed", "Regular", "Tailored"]).default("Any"),
    palette: z.string().trim().max(80).default(""),
    budget: z.number().positive().max(10000).nullable().default(null),
    excludedMaterials: z
      .array(z.enum(["wool", "silk", "leather"]))
      .max(3)
      .default([]),
  })
  .strict();
export type Preferences = z.infer<typeof preferencesSchema>;
const knownIds = z
  .array(z.string().refine((id) => Boolean(productById(id))))
  .max(15);
export const shoppingContextSchema = z
  .object({
    preferences: preferencesSchema.default(() => preferencesSchema.parse({})),
    savedIds: knownIds.default([]),
    bagIds: knownIds.default([]),
    lockedIds: knownIds.max(4).default([]),
    replaceIds: knownIds.max(4).default([]),
  })
  .strict();
export type ShoppingContext = z.infer<typeof shoppingContextSchema>;

export function validateShoppingExperience(
  value: unknown,
  context: ShoppingContext,
): Experience {
  const experience = validateExperience(value);
  const selectedProducts = experience.productIds.map((id) => productById(id)!);
  if (
    selectedProducts.some((product) =>
      context.preferences.excludedMaterials.some((material) =>
        product.material.toLowerCase().includes(material),
      ),
    )
  )
    throw new Error("Selection includes an explicitly excluded material.");
  if (context.replaceIds.some((id) => experience.productIds.includes(id)))
    throw new Error("Selection includes a piece requested for replacement.");
  if (context.lockedIds.some((id) => !experience.productIds.includes(id)))
    throw new Error("Selection must preserve every locked piece.");
  const looks =
    experience.sections?.filter((section) => section.type === "look") ?? [];
  if (
    context.lockedIds.length &&
    !looks.some((look) =>
      context.lockedIds.every((id) => look.productIds.includes(id)),
    )
  )
    throw new Error(
      "An editable look must contain all locked pieces together.",
    );
  const budget = context.preferences.budget;
  if (
    budget !== null &&
    (selectedProducts.some((product) => product.price > budget) ||
      looks.some(
        (look) =>
          look.productIds.reduce(
            (total, id) => total + productById(id)!.price,
            0,
          ) > budget,
      ))
  )
    throw new Error("Selection exceeds the explicit USD budget.");
  return experience;
}

export function validateExperience(value: unknown): Experience {
  const experience = experienceSchema.parse(value);
  if (
    new Set(experience.productIds).size !== experience.productIds.length ||
    experience.productIds.some((id) => !productById(id))
  ) {
    throw new Error("Experience contains unknown or duplicate products.");
  }
  for (const section of experience.sections ?? []) {
    if (
      "productIds" in section &&
      (new Set(section.productIds).size !== section.productIds.length ||
        section.productIds.some(
          (id) => !productById(id) || !experience.productIds.includes(id),
        ))
    ) {
      throw new Error(
        "Discovery section contains unknown or duplicate products.",
      );
    }
  }
  return experience;
}

export const cartItemSchema = z
  .object({
    productId: z.string(),
    size: z.string().max(20),
    quantity: z.number().int().min(1).max(10),
  })
  .strict();
export const checkoutSchema = z
  .object({
    items: z.array(cartItemSchema).min(1).max(20),
    brandId: z.enum(["forme", "studio"]),
  })
  .strict();
export type CartItem = z.infer<typeof cartItemSchema>;

export function mergeCart(
  current: CartItem[],
  additions: CartItem[],
): CartItem[] {
  calculateOrder(additions);
  const next = current.map((item) => ({ ...item }));
  for (const addition of additions) {
    const existing = next.find(
      (item) =>
        item.productId === addition.productId && item.size === addition.size,
    );
    if (existing) existing.quantity += addition.quantity;
    else next.push({ ...addition });
  }
  calculateOrder(next);
  return next;
}

export function calculateOrder(items: CartItem[]) {
  const parsed = checkoutSchema.shape.items.parse(items);
  const keys = new Set<string>();
  const lines = parsed.map((item) => {
    const product = productById(item.productId);
    if (!product || !product.sizes.includes(item.size))
      throw new Error("Invalid product or size.");
    const key = `${item.productId}:${item.size}`;
    if (keys.has(key)) throw new Error("Duplicate cart line.");
    keys.add(key);
    return {
      ...item,
      name: product.name,
      price: product.price,
      lineTotal: product.price * item.quantity,
    };
  });
  const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0);
  const shipping = subtotal >= 150 ? 0 : 10;
  return { lines, subtotal, shipping, total: subtotal + shipping };
}
