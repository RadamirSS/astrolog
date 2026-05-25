import type { BirthProfile, BirthProfileTopic } from "@astro/tenant-config";
import { birthProfileResponseSchema, birthProfileSchema } from "@astro/tenant-config";

export type BirthProfileInput = {
  name: string;
  birthDate: string;
  birthTime?: string;
  birthPlace: string;
  topic?: BirthProfileTopic;
};

export interface SubmitBirthProfileRequest extends BirthProfileInput {
  tenantId: string;
  userId: string;
}

export interface GetBirthProfileQuery {
  tenantId: string;
  userId: string;
}

export type { BirthProfile };

export { birthProfileSchema as birthProfileInputSchema, birthProfileResponseSchema };
