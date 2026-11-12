import { z } from "zod-a2ui";
import { ChildListSchema, type A2uiMessage } from "@a2ui/web_core/v0_9";
import {
  discoveryImageIds,
  validateExperience,
  type Experience,
} from "./commerce";

export const discoveryCatalogId = "https://forme.example/a2ui/discovery/v1";
const title = z.string().min(1).max(120);
const body = z.string().max(400);
const productIds = z.array(z.string().min(1).max(40)).min(1).max(6);
const imageId = z.enum(discoveryImageIds);

export const discoveryApis = {
  Discovery: {
    name: "Discovery",
    schema: z.object({ children: ChildListSchema }).strict(),
  },
  Editorial: {
    name: "Editorial",
    schema: z.object({ title, body, imageId }).strict(),
  },
  Question: {
    name: "Question",
    schema: z
      .object({
        title,
        body,
        options: z
          .array(
            z
              .object({
                label: z.string().min(1).max(45),
                prompt: z.string().min(1).max(200),
                imageId: imageId.optional(),
              })
              .strict(),
          )
          .min(2)
          .max(4),
      })
      .strict(),
  },
  ProductSelection: {
    name: "ProductSelection",
    schema: z
      .object({
        title,
        body,
        productIds,
        presentation: z.enum(["spotlight", "rail"]),
      })
      .strict(),
  },
  StyledLook: {
    name: "StyledLook",
    schema: z.object({ title, body, productIds }).strict(),
  },
  Comparison: {
    name: "Comparison",
    schema: z.object({ title, productIds }).strict(),
  },
} as const;

const componentNames = {
  editorial: "Editorial",
  question: "Question",
  products: "ProductSelection",
  look: "StyledLook",
  comparison: "Comparison",
} as const;

export function discoveryMessages(value: Experience): A2uiMessage[] {
  const experience = validateExperience(value);
  if (!experience.sections?.length)
    throw new Error("Missing discovery sections.");
  const components = experience.sections.map(({ type, ...props }, index) => ({
    id: `section_${index}`,
    component: componentNames[type],
    ...props,
  }));
  return [
    {
      version: "v0.9",
      createSurface: { surfaceId: "discovery", catalogId: discoveryCatalogId },
    },
    {
      version: "v0.9",
      updateComponents: {
        surfaceId: "discovery",
        components: [
          {
            id: "root",
            component: "Discovery",
            children: components.map((component) => component.id),
          },
          ...components,
        ],
      },
    },
  ];
}
