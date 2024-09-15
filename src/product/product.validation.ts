import { MemoryStoredFile } from 'nestjs-form-data';
import { ZodType, z } from 'zod';

const CreateProductVariantOptionSchema = z.object({
  variantTypeId: z.string().min(1, 'Variant type ID is required'),
  value: z.string().min(1, 'Value is required'),
});

const CreateProductVariantSchema = z.object({
  priceAdjustment: z.string().min(1, 'Price adjustment is required'),
  stock: z.number().positive('Stock must be a positive number'),
  variantOptions: z.array(CreateProductVariantOptionSchema),
  variantImage: z.instanceof(MemoryStoredFile).optional(),
});

const UpdateProductVariantOptionSchema = z.object({
  variantTypeId: z.string().min(1, 'Variant type ID is required'),
  value: z.string().min(1, 'Value is required'),
});

// Reuse variant schema with optional fields for update
const UpdateProductVariantSchema = z.object({
  id: z.string().optional(), // optional karena bisa ada varian yang sudah ada sebelumnya
  priceAdjustment: z.string().min(1, 'Price adjustment is required').optional(),
  stock: z.string().optional(),
  variantOptions: z.array(UpdateProductVariantOptionSchema),
  variantImage: z.instanceof(MemoryStoredFile).optional(),
});

export class ProductValidation {
  static readonly CREATE_PRODUCT: ZodType = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    basePrice: z.string().min(1, 'Base price is required'),
    image: z.string().optional(),
    stock: z.string().min(1, 'Stock is required'),
    productImages: z.array(z.instanceof(MemoryStoredFile)),
    variants: z.array(CreateProductVariantSchema).optional(),
  });

  static readonly UPDATE_PRODUCT: ZodType = z.object({
    name: z.string().min(1, 'Name is required').optional(),
    description: z.string().min(1, 'Description is required').optional(),
    basePrice: z.string().min(1, 'Base price is required').optional(),
    image: z.string().optional(),
    stock: z.string().min(1, 'Stock is required').optional(),
    productImages: z.array(z.instanceof(MemoryStoredFile)).optional(), // Optional for update
    variants: z.array(UpdateProductVariantSchema).optional(), // Optional for update
  });
}
