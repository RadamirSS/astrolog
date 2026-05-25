import type { ProductConfig } from "@astro/tenant-config";
import { z } from "zod";
import { productConfigSchema } from "@astro/tenant-config";

export type { ProductConfig };

export const productListSchema = z.array(productConfigSchema);
export const productDetailSchema = productConfigSchema;

/** GET products response `data`: raw `ProductConfig[]` (not `{ products }`). */
export type ProductListPayload = ProductConfig[];

/** GET product detail response `data`: raw `ProductConfig` (not `{ product }`). */
export type ProductDetailPayload = ProductConfig;
