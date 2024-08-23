import { ZodType, z } from 'zod';

export class StoreValidation {
  static readonly UPDATE_STORE: ZodType = z.object({
    name: z
      .string()
      .min(1, { message: 'Name is required.' })
      .max(50, { message: 'Name should not exceed 50 characters.' }),
    description: z
      .string()
      .max(200, { message: 'Description should not exceed 200 characters.' })
      .optional(),
    logo: z
      .string()
      .max(255, { message: 'Logo URL should not exceed 255 characters.' })
      .optional(),
  });
}
